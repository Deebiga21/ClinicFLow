const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientName: { type: String, required: true, trim: true },
  patientPhone: { type: String, default: '', trim: true },
  patientEmail: { type: String, default: '', trim: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  department: { type: String, required: true },
  scheduledDate: { type: Date, required: true },       // date only (midnight UTC)
  scheduledTime: { type: String, required: true },     // "09:30" HH:mm
  reason: { type: String, default: '', trim: true },
  status: {
    type: String,
    enum: ['scheduled', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  // Set when the appointment converts to a live queue token
  linkedTokenNumber: { type: Number, default: null },
  notes: { type: String, default: '', trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

appointmentSchema.index({ scheduledDate: 1, doctorId: 1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
