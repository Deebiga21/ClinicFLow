const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true },
  patientName: { type: String, required: true, trim: true },
  patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['waiting', 'in_consultation', 'done', 'skipped'],
    default: 'waiting'
  },

  // Doctor / department routing
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  doctorName: { type: String, default: '' },
  department: { type: String, default: '' },

  // Linked appointment (if booked in advance)
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },

  createdAt:   { type: Date, default: Date.now },
  calledAt:    { type: Date, default: null },
  completedAt: { type: Date, default: null }
});

tokenSchema.index({ status: 1, tokenNumber: 1 });
tokenSchema.index({ doctorId: 1, status: 1 });

module.exports = mongoose.model('Token', tokenSchema);
