const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
  idKey: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Imaging & Scans', 'Pathology & Labs', 'Cardiology', 'Treatments & Procedures']
  },
  cost: { type: Number, required: true },
  currency: { type: String, default: '₹' },
  turnaround: { type: String, default: 'Same Day' },
  prep: { type: String, default: 'No special prep required' },
  description: { type: String, default: '' },
  popular: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Treatment', treatmentSchema);
