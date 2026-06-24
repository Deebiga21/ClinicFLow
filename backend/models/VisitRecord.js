const mongoose = require('mongoose');

const visitRecordSchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true },
  patientName: { type: String, required: true, trim: true },
  patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  doctorName: { type: String, default: '' },
  department: { type: String, default: '' },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },

  // Timing
  arrivedAt: { type: Date, default: null },
  calledAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },

  // Computed
  waitDurationMinutes: { type: Number, default: null },
  consultDurationMinutes: { type: Number, default: null },

  // Clinical notes (staff only)
  diagnosis: { type: String, default: '', trim: true },
  prescription: { type: String, default: '', trim: true },
  notes: { type: String, default: '', trim: true },

  status: {
    type: String,
    enum: ['done', 'skipped', 'no_show'],
    default: 'done'
  }
}, { timestamps: true });

visitRecordSchema.index({ patientName: 1 });
visitRecordSchema.index({ createdAt: -1 });
visitRecordSchema.index({ patientUserId: 1 });

module.exports = mongoose.model('VisitRecord', visitRecordSchema);
