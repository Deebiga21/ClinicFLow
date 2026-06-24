const express = require('express');
const router = express.Router();
const VisitRecord = require('../models/VisitRecord');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET visit history — by patientName, doctorId, date range, or userId
router.get('/visits', requireAuth, async (req, res) => {
  try {
    const { patientName, doctorId, from, to, userId, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (patientName) filter.patientName = { $regex: patientName, $options: 'i' };
    if (doctorId) filter.doctorId = doctorId;
    if (userId) filter.patientUserId = userId;
    if (from || to) {
      filter.createdAt = {};
      if (from) { const d = new Date(from); d.setHours(0,0,0,0); filter.createdAt.$gte = d; }
      if (to)   { const d = new Date(to);   d.setHours(23,59,59,999); filter.createdAt.$lte = d; }
    }
    const skip = (parseInt(page)-1) * parseInt(limit);
    const [records, total] = await Promise.all([
      VisitRecord.find(filter)
        .populate('doctorId', 'name department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VisitRecord.countDocuments(filter)
    ]);
    res.json({ records, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch visits' }); }
});

// GET my visit history (patient view)
router.get('/visits/me', requireAuth, async (req, res) => {
  try {
    const records = await VisitRecord.find({ patientUserId: req.user.id })
      .populate('doctorId', 'name department')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(records);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch your visit history' }); }
});

// GET single visit
router.get('/visits/:id', requireAuth, async (req, res) => {
  try {
    const record = await VisitRecord.findById(req.params.id)
      .populate('doctorId', 'name department roomNumber')
      .lean();
    if (!record) return res.status(404).json({ error: 'Visit not found' });
    res.json(record);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch visit' }); }
});

// PUT update visit notes/diagnosis (staff or admin only)
router.put('/visits/:id', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const allowed = ['diagnosis', 'prescription', 'notes'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    const record = await VisitRecord.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!record) return res.status(404).json({ error: 'Visit not found' });
    res.json(record);
  } catch (err) { res.status(500).json({ error: 'Failed to update visit' }); }
});

module.exports = router;
