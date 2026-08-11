const Token = require('../models/Token');
const ClinicSettings = require('../models/ClinicSettings');
const Doctor = require('../models/Doctor');

async function getSettings() {
  let settings = await ClinicSettings.findOne({ clinicId: 'default-clinic' });
  if (!settings) settings = await ClinicSettings.create({ clinicId: 'default-clinic' });
  return settings;
}

/**
 * Build queue state — optionally filtered by doctorId.
 * If doctorId is provided, returns a per-doctor view.
 * Otherwise returns the global queue (all doctors combined).
 */
async function buildQueueState(doctorId = null) {
  const settings = await getSettings();

  const waitFilter = { status: 'waiting' };
  const consultFilter = { status: 'in_consultation' };
  if (doctorId) {
    waitFilter.doctorId = doctorId;
    consultFilter.doctorId = doctorId;
  }

  const waitingTokens = await Token.find(waitFilter)
    .sort({ isEmergencyAlert: -1, priorityScore: -1, tokenNumber: 1 })
    .lean();

  const currentToken = await Token.findOne(consultFilter).lean();

  // Per-doctor consultation time override
  let avgTime = settings.avgConsultationTime;
  if (doctorId) {
    const doc = await Doctor.findById(doctorId).lean();
    if (doc && doc.avgConsultationTime) avgTime = doc.avgConsultationTime;
  }

  let remainingForCurrent = 0;
  if (currentToken && currentToken.calledAt) {
    const elapsedMin = (Date.now() - new Date(currentToken.calledAt).getTime()) / 60000;
    remainingForCurrent = Math.max(avgTime - elapsedMin, 0);
  }

  const queueWithWaitTimes = waitingTokens.map((token, index) => ({
    ...token,
    peopleAhead: index,
    estimatedWaitMinutes: Math.round(remainingForCurrent + index * avgTime)
  }));

  const doneFilter = { status: 'done' };
  // Count done for today
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const doneCount = await Token.countDocuments({ ...doneFilter, completedAt: { $gte: todayStart } });

  return {
    currentToken: currentToken || null,
    currentTokenRemainingMinutes: Math.round(remainingForCurrent),
    waitingQueue: queueWithWaitTimes,
    avgConsultationTime: avgTime,
    totalWaiting: queueWithWaitTimes.length,
    totalServedToday: doneCount,
    lastIssuedToken: settings.lastIssuedToken,
    doctorId: doctorId || null
  };
}

module.exports = { getSettings, buildQueueState };
