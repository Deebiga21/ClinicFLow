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

// Seed multiple realistic doctors
router.post('/doctors/seed', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const sampleDoctors = [
      { name: 'Priya Sharma', department: 'Cardiology', specialization: 'Interventional Cardiologist', roomNumber: '101', avgConsultationTime: 12, isAvailable: true },
      { name: 'Rajesh Gupta', department: 'General', specialization: 'Senior Physician & Diabetologist', roomNumber: '102', avgConsultationTime: 10, isAvailable: true },
      { name: 'Ananya Verma', department: 'Pediatrics', specialization: 'Pediatric Specialist & Neonatologist', roomNumber: '103', avgConsultationTime: 15, isAvailable: true },
      { name: 'Vikram Mehta', department: 'Neurology', specialization: 'Consultant Neurophysician', roomNumber: '201', avgConsultationTime: 15, isAvailable: true },
      { name: 'Siddharth Rao', department: 'Orthopedics', specialization: 'Orthopedic & Joint Replacement Surgeon', roomNumber: '202', avgConsultationTime: 12, isAvailable: true },
      { name: 'Kavita Patel', department: 'Dermatology', specialization: 'Cosmetologist & Skin Specialist', roomNumber: '203', avgConsultationTime: 10, isAvailable: true },
      { name: 'Arjun Nair', department: 'Emergency', specialization: 'Trauma & Emergency Specialist', roomNumber: 'ER-1', avgConsultationTime: 8, isAvailable: true },
      { name: 'Meera Iyer', department: 'ENT', specialization: 'Otolaryngologist & Head Surgeon', roomNumber: '301', avgConsultationTime: 10, isAvailable: true },
      { name: 'Rohan Deshmukh', department: 'Ophthalmology', specialization: 'Cataract & Retina Specialist', roomNumber: '302', avgConsultationTime: 10, isAvailable: true },
      { name: 'Sunita Reddy', department: 'Gynecology', specialization: 'Obstetrician & Gynecologist', roomNumber: '303', avgConsultationTime: 15, isAvailable: true },
      { name: 'Amitabh Joshi', department: 'Psychiatry', specialization: 'Behavioral & Neuropsychiatrist', roomNumber: '401', avgConsultationTime: 20, isAvailable: true }
    ];

    const created = [];
    for (const d of sampleDoctors) {
      const exists = await Doctor.findOne({ name: d.name });
      if (!exists) {
        const newDoc = await Doctor.create({ ...d, createdBy: req.user.id });
        created.push(newDoc);
      }
    }

    const allDoctors = await Doctor.find().sort({ department: 1, name: 1 }).lean();
    res.json({ message: `Seeded ${created.length} new doctors`, doctors: allDoctors });
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed doctors' });
  }
});

module.exports = router;
