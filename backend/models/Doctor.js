const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  specialization: { type: String, default: '', trim: true },
  roomNumber: { type: String, default: '', trim: true },
  isAvailable: { type: Boolean, default: true },
  avgConsultationTime: { type: Number, default: 10 }, // per-doctor override
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
