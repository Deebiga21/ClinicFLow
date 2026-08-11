const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Token = require('../models/Token');
const ClinicSettings = require('../models/ClinicSettings');
const { buildQueueState } = require('../utils/queueHelpers');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET appointments — filterable by date, doctor, status
router.get('/appointments', requireAuth, async (req, res) => {
  try {
    const { date, doctorId, status } = req.query;
    const filter = {};
    if (date) {
      const d = new Date(date); d.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      filter.scheduledDate = { $gte: d, $lte: end };
    }
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;
    const appts = await Appointment.find(filter)
      .populate('doctorId', 'name department roomNumber')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .lean();
    res.json(appts);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch appointments' }); }
});

// GET today's appointments
router.get('/appointments/today', requireAuth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const end = new Date(today); end.setHours(23,59,59,999);
    const appts = await Appointment.find({ scheduledDate: { $gte: today, $lte: end } })
      .populate('doctorId', 'name department roomNumber')
      .sort({ scheduledTime: 1 })
      .lean();
    res.json(appts);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch today appointments' }); }
});

// GET single appointment
router.get('/appointments/:id', requireAuth, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate('doctorId', 'name department roomNumber')
      .lean();
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch appointment' }); }
});

// POST create appointment (staff, admin, or patient)
router.post('/appointments', requireAuth, requireRole('admin', 'staff', 'patient'), async (req, res) => {
  try {
    const { patientName, patientPhone, patientEmail, doctorId, scheduledDate, scheduledTime, reason } = req.body;
    if (!patientName || !doctorId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ error: 'patientName, doctorId, scheduledDate, scheduledTime required' });
    }
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const appt = await Appointment.create({
      patientName: patientName.trim(),
      patientPhone: patientPhone || '',
      patientEmail: patientEmail || '',
      doctorId,
      department: doctor.department,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      reason: reason || '',
      createdBy: req.user.id
    });
    res.status(201).json(appt);
  } catch (err) { res.status(500).json({ error: 'Failed to create appointment' }); }
});

// PUT update appointment
router.put('/appointments/:id', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const allowed = ['patientName','patientPhone','patientEmail','doctorId','scheduledDate','scheduledTime','reason','status','notes'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    const appt = await Appointment.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('doctorId', 'name department roomNumber');
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (err) { res.status(500).json({ error: 'Failed to update appointment' }); }
});

// POST check-in: appointment → live queue token
router.post('/appointments/:id/checkin', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id).populate('doctorId');
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.status === 'checked_in' || appt.status === 'in_consultation') {
      return res.status(400).json({ error: 'Already checked in', linkedTokenNumber: appt.linkedTokenNumber });
    }

    const settings = await ClinicSettings.findOneAndUpdate(
      { clinicId: 'default-clinic' },
      { $inc: { lastIssuedToken: 1 } },
      { new: true, upsert: true }
    );

    const token = await Token.create({
      tokenNumber: settings.lastIssuedToken,
      patientName: appt.patientName,
      status: 'waiting',
      doctorId: appt.doctorId._id,
      doctorName: appt.doctorId.name,
      department: appt.doctorId.department,
      appointmentId: appt._id
    });

    appt.status = 'checked_in';
    appt.linkedTokenNumber = token.tokenNumber;
    await appt.save();

    const state = await buildQueueState();
    req.io.emit('queueUpdated', state);
    req.io.emit('notify', {
      tone: 'info',
      title: 'Appointment checked in',
      message: `${appt.patientName} — Token #${token.tokenNumber}`
    });

    res.json({ token, state });
  } catch (err) { res.status(500).json({ error: 'Check-in failed' }); }
});

// DELETE / cancel appointment
router.delete('/appointments/:id', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ ok: true, appt });
  } catch (err) { res.status(500).json({ error: 'Failed to cancel appointment' }); }
});

module.exports = router;
