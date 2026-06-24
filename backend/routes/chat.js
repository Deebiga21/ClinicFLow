const express = require('express');
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// History for a specific token's chat thread
router.get('/chat/:tokenNumber', requireAuth, async (req, res) => {
  const tokenNumber = Number(req.params.tokenNumber);
  if (!tokenNumber) return res.status(400).json({ error: 'Invalid token number' });
  const messages = await Message.find({ tokenNumber }).sort({ createdAt: 1 }).limit(200).lean();
  res.json({ messages });
});

// Staff can see list of active chat threads (one per current/waiting token)
router.get('/chat', requireAuth, async (req, res) => {
  if (req.user.role !== 'staff') return res.status(403).json({ error: 'Staff only' });
  const threads = await Message.aggregate([
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$tokenNumber', lastMessage: { $first: '$text' }, lastAt: { $first: '$createdAt' } } },
    { $sort: { lastAt: -1 } }
  ]);
  res.json({ threads });
});

module.exports = router;
