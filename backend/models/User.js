const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['patient', 'staff', 'admin'], required: true },
  displayName: { type: String, default: '' },
  linkedTokenNumber: { type: Number, default: null },

  email:      { type: String, default: '', trim: true, lowercase: true },
  phone:      { type: String, default: '', trim: true },
  bio:        { type: String, default: '', trim: true, maxlength: 280 },
  department: { type: String, default: '' },

  soundEnabled:  { type: Boolean, default: true },
  notifyOnChat:  { type: Boolean, default: true },

  // Admin-only: track account status
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
