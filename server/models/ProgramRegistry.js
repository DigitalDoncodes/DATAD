const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // slug, e.g. "mba"
  label: { type: String, required: true },
  description: { type: String },

  // Optional overrides of global defaults
  dashboardOrder: { type: [String] },
  promptSet: { type: String },
  features: {
    financeHub:    { type: Boolean },
    wellbeingHub:  { type: Boolean },
    careerHub:     { type: Boolean },
    community:     { type: Boolean },
    aiChat:        { type: Boolean },
    dailyBriefing: { type: Boolean },
    dailyCase:     { type: Boolean },
    planner:       { type: Boolean },
    resources:     { type: Boolean }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProgramRegistry', programSchema);
