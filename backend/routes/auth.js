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

// Patients link themselves to a token (the receptionist gave them token N)
router.post('/link-token', requireAuth, async (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ error: 'Patients only' });
  const { tokenNumber } = req.body;
  await User.findByIdAndUpdate(req.user.id, { linkedTokenNumber: tokenNumber || null });
  res.json({ ok: true, linkedTokenNumber: tokenNumber || null });
});

module.exports = router;
