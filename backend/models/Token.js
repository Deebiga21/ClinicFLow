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

  // Consulting Reason / Symptoms
  consultationReason: { type: String, default: '', trim: true },

  // ML Priority Alert & Vitals
  priorityLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  priorityScore: { type: Number, default: 0 },
  isEmergencyAlert: { type: Boolean, default: false },
  
  // ML Disease Predictor
  predictedDisease: { type: String, default: '' },
  diseaseConfidence: { type: Number, default: 0 },

  vitals: {
    age: { type: Number, default: 35 },
    systolic_bp: { type: Number, default: 120 },
    diastolic_bp: { type: Number, default: 80 },
    heart_rate: { type: Number, default: 75 },
    spo2: { type: Number, default: 98 },
    temperature: { type: Number, default: 37.0 },
    pain_score: { type: Number, default: 0 },
    symptom_severity: { type: Number, default: 1 }
  },

  // EMR Charting / Consultation Output
  diagnosis: { type: String, default: '' },
  clinicalNotes: { type: String, default: '' },
  prescription: [{
    drugName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true }
  }],

  createdAt:   { type: Date, default: Date.now },
  calledAt:    { type: Date, default: null },
  completedAt: { type: Date, default: null }
});

tokenSchema.index({ status: 1, isEmergencyAlert: -1, priorityScore: -1, tokenNumber: 1 });
tokenSchema.index({ doctorId: 1, status: 1 });

module.exports = mongoose.model('Token', tokenSchema);
