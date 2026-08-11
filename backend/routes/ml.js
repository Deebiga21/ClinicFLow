const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const Token = require('../models/Token');
const { buildQueueState } = require('../utils/queueHelpers');
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * Execute Python XGBoost predict.py script
 */
function runXGBoostPrediction(vitals) {
  return new Promise((resolve) => {
    const pythonExe = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.resolve(__dirname, '../../ml/predict.py');
    const inputJson = JSON.stringify(vitals || {});

    const py = spawn(pythonExe, [scriptPath, inputJson]);
    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (data) => { stdout += data.toString(); });
    py.stderr.on('data', (data) => { stderr += data.toString(); });

    py.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          const result = JSON.parse(stdout.trim());
          if (!result.error) return resolve(result);
        } catch (e) {
          console.error('Failed to parse Python ML output:', e);
        }
      }
      console.warn('XGBoost process fallback:', stderr || 'Non-zero exit');
      resolve(heuristicFallback(vitals));
    });

    py.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      resolve(heuristicFallback(vitals));
    });
  });
}

/**
 * Execute Python XGBoost predict.py script for disease prediction
 */
function runDiseasePrediction(features) {
  return new Promise((resolve) => {
    const pythonExe = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.resolve(__dirname, '../../ml/predict.py');
    const inputJson = JSON.stringify(features || {});

    // Use the --disease flag
    const py = spawn(pythonExe, [scriptPath, '--disease', inputJson]);
    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (data) => { stdout += data.toString(); });
    py.stderr.on('data', (data) => { stderr += data.toString(); });

    py.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          const result = JSON.parse(stdout.trim());
          if (!result.error) return resolve(result);
        } catch (e) {
          console.error('Failed to parse Python ML disease output:', e);
        }
      }
      console.warn('XGBoost disease process fallback:', stderr || 'Non-zero exit');
      resolve({ disease: 'Unknown', confidence: 0, error: 'Prediction failed' });
    });

    py.on('error', (err) => {
      console.error('Failed to start Python process for disease:', err);
      resolve({ disease: 'Unknown', confidence: 0, error: err.message });
    });
  });
}

function heuristicFallback(vitals = {}) {
  const age = Number(vitals.age || 35);
  const sysBp = Number(vitals.systolic_bp || 120);
  const hr = Number(vitals.heart_rate || 75);
  const spo2 = Number(vitals.spo2 || 98);
  const temp = Number(vitals.temperature || 37.0);
  const pain = Number(vitals.pain_score || 0);
  const severity = Number(vitals.symptom_severity || 1);

  let score = 15;
  if (spo2 < 90) score += 40;
  else if (spo2 < 94) score += 20;

  if (sysBp > 165 || sysBp < 90) score += 25;
  if (hr > 120 || hr < 50) score += 20;
  if (temp > 39.2 || temp < 35.8) score += 15;

  score += pain * 3.5;
  score += (severity - 1) * 20;
  if (age > 70 || age < 5) score += 10;

  score = Math.min(Math.max(score, 5), 99);
  let level = 'LOW';
  if (score >= 60) level = 'HIGH';
  else if (score >= 30) level = 'MEDIUM';

  return {
    priorityLevel: level,
    priorityScore: Math.round(score * 10) / 10,
    isEmergencyAlert: level === 'HIGH' || spo2 < 90 || sysBp > 170,
    probabilities: {
      LOW: level === 'LOW' ? 0.8 : 0.1,
      MEDIUM: level === 'MEDIUM' ? 0.7 : 0.2,
      HIGH: level === 'HIGH' ? 0.9 : 0.1
    },
    fallbackUsed: true
  };
}

// POST /api/ml/predict
router.post('/ml/predict', async (req, res) => {
  try {
    const vitals = req.body || {};
    const prediction = await runXGBoostPrediction(vitals);
    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: 'Priority prediction failed', details: err.message });
  }
});

// POST /api/ml/reassess-token/:tokenId - update a token's vitals & priority
router.post('/ml/reassess-token/:tokenId', requireAuth, requireRole('staff', 'admin'), async (req, res) => {
  try {
    const { tokenId } = req.params;
    const vitals = req.body.vitals || {};
    const token = await Token.findById(tokenId);
    if (!token) return res.status(404).json({ error: 'Token not found' });

    const prediction = await runXGBoostPrediction(vitals);
    token.vitals = { ...token.vitals, ...vitals };
    token.priorityLevel = prediction.priorityLevel;
    token.priorityScore = prediction.priorityScore;
    token.isEmergencyAlert = prediction.isEmergencyAlert;
    await token.save();

    const state = await buildQueueState(token.doctorId);
    req.io.emit('queueUpdated', state);
    if (prediction.isEmergencyAlert) {
      req.io.emit('notify', {
        tone: 'danger',
        title: '🚨 HIGH PRIORITY EMERGENCY ALERT',
        message: `Token #${token.tokenNumber} (${token.patientName}) reassessed as HIGH priority!`,
        tokenNumber: token.tokenNumber
      });
    }

    res.json({ token, prediction, state });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reassess token priority' });
  }
});

// POST /api/ml/predict-disease
router.post('/ml/predict-disease', async (req, res) => {
  try {
    const features = req.body || {};
    const prediction = await runDiseasePrediction(features);
    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: 'Disease prediction failed', details: err.message });
  }
});

module.exports = { router, runXGBoostPrediction, runDiseasePrediction };
