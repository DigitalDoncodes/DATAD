const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // slug, e.g. "finance"
  label: { type: String, required: true },
  description: { type: String },

  // Which programs list this subject (denormalised for quick look‑ups, optional)
  programs: { type: [String] },

  // Feature‑enable flags – the only subject‑level knobs we need today
  enablesFinanceHub:   { type: Boolean, default: false },
  enablesWellbeingHub: { type: Boolean, default: false },
  enablesCareerHub:    { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SubjectRegistry', subjectSchema);
