const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true, index: true },
  senderRole: { type: String, enum: ['patient', 'staff'], required: true },
  senderName: { type: String, default: '' },
  text: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
