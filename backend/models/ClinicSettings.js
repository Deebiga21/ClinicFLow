const mongoose = require('mongoose');

// Singleton-style settings document — there's only ever one of these per clinic.
const clinicSettingsSchema = new mongoose.Schema({
  clinicId: {
    type: String,
    default: 'default-clinic',
    unique: true
  },
  avgConsultationTime: {
    type: Number, // in minutes
    default: 10
  },
  lastIssuedToken: {
    type: Number,
    default: 0
  },
  currentlyServingToken: {
    type: Number,
    default: null // null = no one is being served yet
  }
});

module.exports = mongoose.model('ClinicSettings', clinicSettingsSchema);
