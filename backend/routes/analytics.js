const express = require('express');
const router = express.Router();
const Token = require('../models/Token');
const VisitRecord = require('../models/VisitRecord');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { requireAuth, requireRole } = require('../middleware/auth');

// Helper: date range
function dayRange(date) {
  const d = date ? new Date(date) : new Date();
  d.setHours(0,0,0,0);
  const end = new Date(d); end.setHours(23,59,59,999);
  return { start: d, end };
}

// GET /api/analytics/daily?date=YYYY-MM-DD
router.get('/analytics/daily', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { start, end } = dayRange(req.query.date);

    const [done, skipped, waiting, inConsult, appointments] = await Promise.all([
      Token.countDocuments({ status: 'done', completedAt: { $gte: start, $lte: end } }),
      Token.countDocuments({ status: 'skipped', completedAt: { $gte: start, $lte: end } }),
      Token.countDocuments({ status: 'waiting' }),
      Token.countDocuments({ status: 'in_consultation' }),
      Appointment.countDocuments({ scheduledDate: { $gte: start, $lte: end } })
    ]);

    // Avg wait & consult times from VisitRecords
    const visitAgg = await VisitRecord.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: 'done' } },
      { $group: {
          _id: null,
          avgWait: { $avg: '$waitDurationMinutes' },
          avgConsult: { $avg: '$consultDurationMinutes' }
      }}
    ]);
    const avgWait = visitAgg[0]?.avgWait ? Math.round(visitAgg[0].avgWait) : null;
    const avgConsult = visitAgg[0]?.avgConsult ? Math.round(visitAgg[0].avgConsult) : null;

    // Per-doctor breakdown
    const byDoctor = await Token.aggregate([
      { $match: { completedAt: { $gte: start, $lte: end }, status: { $in: ['done', 'skipped'] }, doctorId: { $ne: null } } },
      { $group: { _id: '$doctorId', doctorName: { $first: '$doctorName' }, total: { $sum: 1 },
                  done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
                  skipped: { $sum: { $cond: [{ $eq: ['$status', 'skipped'] }, 1, 0] } } } },
      { $sort: { total: -1 } }
    ]);

    res.json({
      date: start.toISOString().split('T')[0],
      totalDone: done,
      totalSkipped: skipped,
      currentlyWaiting: waiting,
      currentlyInConsultation: inConsult,
      appointmentsScheduled: appointments,
      avgWaitMinutes: avgWait,
      avgConsultMinutes: avgConsult,
      byDoctor
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Analytics failed' }); }
});

// GET /api/analytics/range?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/analytics/range', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : (() => { const d = new Date(); d.setDate(d.getDate()-7); return d; })();
    const to   = req.query.to   ? new Date(req.query.to)   : new Date();
    from.setHours(0,0,0,0); to.setHours(23,59,59,999);

    // Daily counts over the range
    const dailyCounts = await Token.aggregate([
      { $match: { completedAt: { $gte: from, $lte: to }, status: { $in: ['done', 'skipped'] } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          done:    { $sum: { $cond: [{ $eq: ['$status','done'] },    1, 0] } },
          skipped: { $sum: { $cond: [{ $eq: ['$status','skipped'] }, 1, 0] } }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Department breakdown
    const byDepartment = await Token.aggregate([
      { $match: { completedAt: { $gte: from, $lte: to }, status: 'done', department: { $ne: '' } } },
      { $group: { _id: '$department', total: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    // Peak hours (by hour of day)
    const peakHours = await Token.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({ from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0], dailyCounts, byDepartment, peakHours });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Range analytics failed' }); }
});

// GET /api/analytics/doctors — per-doctor performance
router.get('/analytics/doctors', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { start, end } = dayRange(req.query.date);

    const stats = await VisitRecord.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, doctorId: { $ne: null } } },
      { $group: {
          _id: '$doctorId',
          doctorName: { $first: '$doctorName' },
          department: { $first: '$department' },
          totalPatients: { $sum: 1 },
          avgWait:    { $avg: '$waitDurationMinutes' },
          avgConsult: { $avg: '$consultDurationMinutes' }
      }},
      { $sort: { totalPatients: -1 } }
    ]);

    res.json(stats);
  } catch (err) { res.status(500).json({ error: 'Doctor analytics failed' }); }
});

module.exports = router;
