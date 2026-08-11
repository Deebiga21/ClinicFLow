const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Fields safe to send to the client
function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    linkedTokenNumber: user.linkedTokenNumber,
    email: user.email,
    phone: user.phone,
    bio: user.bio,
    department: user.department,
    soundEnabled: user.soundEnabled,
    notifyOnChat: user.notifyOnChat,
    createdAt: user.createdAt
  };
}

router.post('/register', async (req, res) => {
  try {
    const { username, password, role, displayName } = req.body;
    if (!username || !password || !['patient', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'username, password, role(patient|staff) required' });
    }
    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Username already taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase(),
      passwordHash,
      role,
      displayName: displayName || username
    });
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(publicUser(user));
});

// Update profile info (display name, contact info, bio, preferences)
router.put('/me', requireAuth, async (req, res) => {
  try {
    const allowed = ['displayName', 'email', 'phone', 'bio', 'department', 'soundEnabled', 'notifyOnChat'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(publicUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password (requires current password)
router.put('/me/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

const Token = require('../models/Token');
const { buildQueueState } = require('../utils/queueHelpers');

const ClinicSettings = require('../models/ClinicSettings');

// Patients link themselves to a token (the receptionist gave them token N)
router.post('/link-token', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'patient') return res.status(403).json({ error: 'Patients only' });
    const { tokenNumber, consultationReason } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let num = Number(tokenNumber);
    const userName = user.displayName || user.username;

    // Fetch current clinic settings & currently serving token
    const settings = await ClinicSettings.findOne({ clinicId: 'default-clinic' }) || { lastIssuedToken: 0 };
    const currentServing = await Token.findOne({ status: 'in_consultation' }).lean();

    // Find highest token number issued in database or settings
    const highestTokenDoc = await Token.findOne().sort({ tokenNumber: -1 }).lean();
    const maxIssued = Math.max(
      settings.lastIssuedToken || 0,
      currentServing ? currentServing.tokenNumber : 0,
      highestTokenDoc ? highestTokenDoc.tokenNumber : 0
    );

    let finalTokenNumber = num;
    let isReassignedDueToAllotment = false;
    let isRemappedOldToken = false;

    if (num) {
      const existingToken = await Token.findOne({ tokenNumber: num });
      if (existingToken) {
        // Check if token N is already allotted to ANOTHER patient
        const belongsToDifferentUser = existingToken.patientUserId && existingToken.patientUserId.toString() !== user._id.toString();
        const belongsToDifferentName = existingToken.patientName && existingToken.patientName.toLowerCase() !== userName.toLowerCase();

        if (belongsToDifferentUser || (belongsToDifferentName && existingToken.patientUserId)) {
          // Token N is already allotted to someone else (e.g. nurse added someone else for #56)
          // Allot the NEXT available token number automatically!
          finalTokenNumber = maxIssued + 1;
          isReassignedDueToAllotment = true;
        } else {
          // Token N belongs to this patient or is an unlinked desk token -> update it cleanly
          finalTokenNumber = num;
          existingToken.patientUserId = user._id;
          existingToken.patientName = userName;
          existingToken.status = 'waiting';
          if (consultationReason?.trim()) existingToken.consultationReason = consultationReason.trim();
          await existingToken.save();
        }
      } else if (num <= maxIssued) {
        // Requested number is <= maxIssued and doesn't exist -> assign next available
        finalTokenNumber = maxIssued + 1;
        isRemappedOldToken = true;
      }
    } else {
      // No token number specified -> issue next token
      finalTokenNumber = maxIssued + 1;
    }

    // If a new token document needs to be created for finalTokenNumber
    let tokenDoc = await Token.findOne({ tokenNumber: finalTokenNumber });
    if (!tokenDoc) {
      tokenDoc = await Token.create({
        tokenNumber: finalTokenNumber,
        patientName: userName,
        patientUserId: user._id,
        status: 'waiting',
        consultationReason: consultationReason?.trim() || 'General Consultation',
        priorityLevel: 'LOW',
        priorityScore: 20
      });
    } else if (isReassignedDueToAllotment || isRemappedOldToken) {
      tokenDoc.patientUserId = user._id;
      tokenDoc.patientName = userName;
      tokenDoc.status = 'waiting';
      if (consultationReason?.trim()) tokenDoc.consultationReason = consultationReason.trim();
      await tokenDoc.save();
    }

    user.linkedTokenNumber = finalTokenNumber;
    await user.save();

    // Update lastIssuedToken in settings
    await ClinicSettings.findOneAndUpdate(
      { clinicId: 'default-clinic' },
      { $max: { lastIssuedToken: finalTokenNumber } },
      { upsert: true }
    );

    const state = await buildQueueState();
    if (req.io) {
      req.io.emit('queueUpdated', state);
      req.io.emit('tokenLinked', state);
      req.io.emit('tokenCreated', state);

      let msg = `Token #${finalTokenNumber} linked to ${userName}`;
      if (isReassignedDueToAllotment) {
        msg = `Token #${num} was already allotted to another patient. Assigned Token #${finalTokenNumber} to ${userName}.`;
      } else if (isRemappedOldToken) {
        msg = `Token #${num} remapped to active Token #${finalTokenNumber} for ${userName}.`;
      }

      req.io.emit('notify', {
        tone: isReassignedDueToAllotment ? 'warning' : 'info',
        title: isReassignedDueToAllotment ? 'Token Allotment Conflict Resolved' : 'Patient Linked Token',
        message: msg,
        tokenNumber: finalTokenNumber
      });
    }

    res.json({
      ok: true,
      linkedTokenNumber: finalTokenNumber,
      isReassignedDueToAllotment,
      isRemappedOldToken,
      originalRequested: num,
      message: isReassignedDueToAllotment
        ? `Token #${num} was already allotted to another patient. You have been assigned Token #${finalTokenNumber}.`
        : `Token #${finalTokenNumber} linked successfully.`,
      state
    });
  } catch (err) {
    console.error('Link token error:', err);
    res.status(500).json({ error: 'Failed to link token' });
  }
});

module.exports = router;
