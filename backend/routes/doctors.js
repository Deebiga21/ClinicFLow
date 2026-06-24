const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET all doctors (public)
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ department: 1, name: 1 }).lean();
    res.json(doctors);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch doctors' }); }
});

// GET single doctor
router.get('/doctors/:id', async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch doctor' }); }
});

// POST create doctor (admin or staff)
router.post('/doctors', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { name, department, specialization, roomNumber, avgConsultationTime } = req.body;
    if (!name || !department) return res.status(400).json({ error: 'name and department required' });
    const doc = await Doctor.create({
      name: name.trim(),
      department: department.trim(),
      specialization: specialization || '',
      roomNumber: roomNumber || '',
      avgConsultationTime: avgConsultationTime || 10,
      createdBy: req.user.id
    });
    res.status(201).json(doc);
  } catch (err) { res.status(500).json({ error: 'Failed to create doctor' }); }
});

// PUT update doctor (admin or staff)
router.put('/doctors/:id', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const allowed = ['name', 'department', 'specialization', 'roomNumber', 'isAvailable', 'avgConsultationTime'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    const doc = await Doctor.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: 'Failed to update doctor' }); }
});

// DELETE doctor (admin only)
router.delete('/doctors/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete doctor' }); }
});

// Toggle availability
router.post('/doctors/:id/toggle-availability', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    doc.isAvailable = !doc.isAvailable;
    await doc.save();
    res.json(doc);
  } catch (err) { res.status(500).json({ error: 'Failed to toggle availability' }); }
});

module.exports = router;
