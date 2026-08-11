const express = require('express');
const router = express.Router();
const Token = require('../models/Token');
const ClinicSettings = require('../models/ClinicSettings');
const VisitRecord = require('../models/VisitRecord');
const { buildQueueState } = require('../utils/queueHelpers');
const { requireAuth, requireRole } = require('../middleware/auth');

const { runXGBoostPrediction } = require('./ml');

// Helper: record a visit when a token is completed/skipped
async function recordVisit(token, status = 'done') {
  try {
    const waitMs   = token.calledAt    ? new Date(token.calledAt).getTime()    - new Date(token.createdAt).getTime()  : null;
    const consultMs= token.completedAt ? new Date(token.completedAt).getTime() - (token.calledAt ? new Date(token.calledAt).getTime() : 0) : null;
    await VisitRecord.create({
      tokenNumber:          token.tokenNumber,
      patientName:          token.patientName,
      patientUserId:        token.patientUserId || null,
      doctorId:             token.doctorId || null,
      doctorName:           token.doctorName || '',
      department:           token.department || '',
      appointmentId:        token.appointmentId || null,
      arrivedAt:            token.createdAt,
      calledAt:             token.calledAt || null,
      completedAt:          token.completedAt || new Date(),
      waitDurationMinutes:  waitMs    ? Math.round(waitMs    / 60000) : null,
      consultDurationMinutes: consultMs ? Math.round(consultMs / 60000) : null,
      status
    });
  } catch (err) { console.error('VisitRecord create error:', err); }
}

// PUBLIC — get global or per-doctor queue state
// ?doctorId=<id> for per-doctor view
router.get('/queue', async (req, res) => {
  try {
    const state = await buildQueueState(req.query.doctorId || null);
    res.json(state);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch queue state' }); }
});

// STAFF/ADMIN — add patient (optionally assign to doctor)
router.post('/queue/add', requireAuth, requireRole('staff', 'admin', 'patient'), async (req, res) => {
  try {
    const { patientName, doctorId, doctorName, department, vitals, consultationReason, diseasePrediction } = req.body;
    if (!patientName?.trim()) return res.status(400).json({ error: 'Patient name is required' });

    const settings = await ClinicSettings.findOneAndUpdate(
      { clinicId: 'default-clinic' },
      { $inc: { lastIssuedToken: 1 } },
      { new: true, upsert: true }
    );

    // Predict ML Priority Alert
    const mlPrediction = await runXGBoostPrediction(vitals || {});

    const newToken = await Token.create({
      tokenNumber: settings.lastIssuedToken,
      patientName: patientName.trim(),
      status: 'waiting',
      doctorId:    doctorId    || null,
      doctorName:  doctorName  || '',
      department:  department  || '',
      consultationReason: consultationReason?.trim() || 'General Consultation',
      priorityLevel: mlPrediction.priorityLevel,
      priorityScore: mlPrediction.priorityScore,
      isEmergencyAlert: mlPrediction.isEmergencyAlert,
      predictedDisease: diseasePrediction?.disease || '',
      diseaseConfidence: diseasePrediction?.confidence || 0,
      vitals: vitals || {
        age: 35, systolic_bp: 120, diastolic_bp: 80, heart_rate: 75,
        spo2: 98, temperature: 37.0, pain_score: 0, symptom_severity: 1
      }
    });

    const state = await buildQueueState(doctorId || null);
    req.io.emit('queueUpdated', state);

    const alertTone = mlPrediction.isEmergencyAlert ? 'danger' : (mlPrediction.priorityLevel === 'MEDIUM' ? 'warning' : 'info');
    req.io.emit('notify', {
      tone: alertTone,
      title: mlPrediction.isEmergencyAlert ? '🚨 EMERGENCY PRIORITY ALERT' : 'New patient added',
      message: `Token #${newToken.tokenNumber} — ${newToken.patientName} [${mlPrediction.priorityLevel} PRIORITY]${doctorName ? ` → Dr. ${doctorName}` : ''}`,
      tokenNumber: newToken.tokenNumber
    });
    res.status(201).json({ token: newToken, state, mlPrediction });
  } catch (err) { res.status(500).json({ error: 'Failed to add patient' }); }
});

// STAFF/ADMIN — call next (optionally scoped to doctorId)
router.post('/queue/call-next', requireAuth, requireRole('staff', 'admin'), async (req, res) => {
  try {
    const { doctorId } = req.body;
    const consultFilter = { status: 'in_consultation' };
    const waitFilter    = { status: 'waiting' };
    if (doctorId) { consultFilter.doctorId = doctorId; waitFilter.doctorId = doctorId; }

    const current = await Token.findOne(consultFilter);
    if (current) {
      current.status = 'done';
      current.completedAt = new Date();
      await current.save();
      await recordVisit(current, 'done');
    }

    const next = await Token.findOne(waitFilter).sort({ isEmergencyAlert: -1, priorityScore: -1, tokenNumber: 1 });
    if (next) {
      next.status = 'in_consultation';
      next.calledAt = new Date();
      await next.save();
      req.io.to(`token:${next.tokenNumber}`).emit('notify', {
        tone: 'success',
        title: 'You are being called!',
        message: `Token #${next.tokenNumber} (${next.patientName}) — please proceed${next.doctorName ? ` to Dr. ${next.doctorName}` : ' to the consultation room'}.`,
        tokenNumber: next.tokenNumber, patientName: next.patientName
      });
      req.io.emit('notify', {
        tone: 'info', title: 'Now calling',
        message: `Token #${next.tokenNumber} — ${next.patientName}${next.doctorName ? ` → Dr. ${next.doctorName}` : ''}`,
        tokenNumber: next.tokenNumber, patientName: next.patientName
      });
    }

    const state = await buildQueueState(doctorId || null);
    req.io.emit('queueUpdated', state);
    res.json({ state });
  } catch (err) { res.status(500).json({ error: 'Failed to call next patient' }); }
});

// STAFF/ADMIN — skip current patient
router.post('/queue/skip', requireAuth, requireRole('staff', 'admin'), async (req, res) => {
  try {
    const { doctorId } = req.body;
    const consultFilter = { status: 'in_consultation' };
    const waitFilter    = { status: 'waiting' };
    if (doctorId) { consultFilter.doctorId = doctorId; waitFilter.doctorId = doctorId; }

    const current = await Token.findOne(consultFilter);
    if (current) {
      current.status = 'skipped';
      current.completedAt = new Date();
      await current.save();
      await recordVisit(current, 'skipped');
    }
    const next = await Token.findOne(waitFilter).sort({ isEmergencyAlert: -1, priorityScore: -1, tokenNumber: 1 });
    if (next) { next.status = 'in_consultation'; next.calledAt = new Date(); await next.save(); }

    const state = await buildQueueState(doctorId || null);
    req.io.emit('queueUpdated', state);
    res.json({ state });
  } catch (err) { res.status(500).json({ error: 'Failed to skip patient' }); }
});

// STAFF/ADMIN — update avg consultation time
router.put('/queue/settings', requireAuth, requireRole('staff', 'admin'), async (req, res) => {
  try {
    const { avgConsultationTime } = req.body;
    if (!avgConsultationTime || avgConsultationTime <= 0)
      return res.status(400).json({ error: 'avgConsultationTime must be positive' });
    await ClinicSettings.findOneAndUpdate(
      { clinicId: 'default-clinic' },
      { avgConsultationTime },
      { upsert: true }
    );
    const state = await buildQueueState();
    req.io.emit('queueUpdated', state);
    res.json({ state });
  } catch (err) { res.status(500).json({ error: 'Failed to update settings' }); }
});

// Patient self-checkout
router.post('/queue/checkout', requireAuth, async (req, res) => {
  try {
    const { tokenNumber } = req.body;
    if (!tokenNumber) return res.status(400).json({ error: 'tokenNumber required' });
    const token = await Token.findOne({ tokenNumber });
    if (!token) return res.status(404).json({ error: 'Token not found' });
    if (token.status === 'done') return res.json({ ok: true, message: 'Already checked out' });
    token.status = 'done';
    token.completedAt = new Date();
    await token.save();
    await recordVisit(token, 'done');
    const state = await buildQueueState();
    req.io.emit('queueUpdated', state);
    req.io.emit('notify', { tone: 'success', title: 'Patient checked out', message: `Token #${tokenNumber} completed visit.` });
    res.json({ ok: true, state });
  } catch (err) { res.status(500).json({ error: 'Checkout failed' }); }
});

// STAFF/ADMIN — reset queue
router.post('/queue/reset', requireAuth, requireRole('staff', 'admin'), async (req, res) => {
  try {
    await Token.deleteMany({});
    await ClinicSettings.findOneAndUpdate({ clinicId: 'default-clinic' }, { lastIssuedToken: 0 }, { upsert: true });
    const state = await buildQueueState();
    req.io.emit('queueUpdated', state);
    res.json({ state });
  } catch (err) { res.status(500).json({ error: 'Failed to reset queue' }); }
});

module.exports = router;
