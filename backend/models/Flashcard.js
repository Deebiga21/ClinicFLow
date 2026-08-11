const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  idKey: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  category: { type: String, required: true },
  tagClass: { type: String, default: 'flashcard__tag--fever' },
  symptoms: [{ type: String }],
  homeCare: [{ type: String }],
  otcMedications: [{ type: String }],
  redFlags: [{ type: String }],
  medicalTip: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Flashcard', flashcardSchema);
