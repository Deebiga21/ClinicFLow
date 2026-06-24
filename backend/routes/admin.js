const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { requireAuth, requireRole, signToken } = require('../middleware/auth');

// All admin routes require admin role
const adminOnly = [requireAuth, requireRole('admin')];

// GET all staff/admin users
router.get('/admin/users', ...adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch users' }); }
});

// POST create staff/admin account
router.post('/admin/users', ...adminOnly, async (req, res) => {
  try {
    const { username, password, role, displayName, department } = req.body;
    if (!username || !password || !['staff','admin'].includes(role)) {
      return res.status(400).json({ error: 'username, password, role(staff|admin) required' });
    }
    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Username already taken' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase(),
      passwordHash,
      role,
      displayName: displayName || username,
      department: department || ''
    });
    const { passwordHash: _, ...safe } = user.toObject();
    res.status(201).json(safe);
  } catch (err) { res.status(500).json({ error: 'Failed to create user' }); }
});

// PUT update user (role, department, active status)
router.put('/admin/users/:id', ...adminOnly, async (req, res) => {
  try {
    const allowed = ['role', 'displayName', 'department', 'isActive', 'email', 'phone'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, select: '-passwordHash' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: 'Failed to update user' }); }
});

// POST reset password (admin can reset any user's password)
router.post('/admin/users/:id/reset-password', ...adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Min 6 chars' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.params.id, { passwordHash });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Failed to reset password' }); }
});

// DELETE (deactivate) user
router.delete('/admin/users/:id', ...adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot deactivate yourself' });
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Failed to deactivate user' }); }
});

// GET activity log (tokens created/completed in last N hours)
router.get('/admin/activity', ...adminOnly, async (req, res) => {
  try {
    const Token = require('../models/Token');
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 3600000);
    const tokens = await Token.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ since: since.toISOString(), tokens });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch activity' }); }
});

// GET system overview (counts, quick health)
router.get('/admin/overview', ...adminOnly, async (req, res) => {
  try {
    const Token = require('../models/Token');
    const Appointment = require('../models/Appointment');
    const Doctor = require('../models/Doctor');
    const today = new Date(); today.setHours(0,0,0,0);
    const todayEnd = new Date(today); todayEnd.setHours(23,59,59,999);

    const [totalUsers, staffCount, adminCount, totalDoctors, availDoctors,
           tokensToday, apptToday, currentWaiting] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'staff', isActive: true }),
      User.countDocuments({ role: 'admin', isActive: true }),
      Doctor.countDocuments(),
      Doctor.countDocuments({ isAvailable: true }),
      Token.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),
      Appointment.countDocuments({ scheduledDate: { $gte: today, $lte: todayEnd } }),
      Token.countDocuments({ status: 'waiting' })
    ]);

    res.json({ totalUsers, staffCount, adminCount, totalDoctors, availDoctors, tokensToday, apptToday, currentWaiting });
  } catch (err) { res.status(500).json({ error: 'Overview failed' }); }
});

module.exports = router;
