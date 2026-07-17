const mongoose = require('mongoose');

const dailyReflectionSchema = new mongoose.Schema({
  dateKey:         { type: String, required: true, unique: true }, // YYYY-MM-DD
  quote:           { text: String, author: String },
  reflection:      { type: String },
  challenge:       { type: String },
  productivityTip: { type: String },
  dailyConcept:    { concept: String, whyToday: String },
  gratitude:       { type: String },
  generatedBy:     { type: String },
  model:           { type: String },
  tokensUsed:      { type: Number },
  status:          { type: String, enum: ['published', 'pending_review'], default: 'published' },
}, { timestamps: true });

module.exports = mongoose.model('DailyReflection', dailyReflectionSchema);
