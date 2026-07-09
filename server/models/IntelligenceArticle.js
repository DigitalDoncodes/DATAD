const mongoose = require('mongoose');

const CATEGORIES = [
  'stock-market',
  'economy',
  'banking-finance',
  'startups',
  'ai-tech',
  'global-business',
  'operations',
  'marketing',
  'corporate',
  'placements',
];

// An admin-curated business-intelligence article, framed for MBA students.
const articleSchema = new mongoose.Schema(
  {
    headline: { type: String, required: true, trim: true, maxlength: 240 },
    summary: { type: String, required: true, maxlength: 1000 },
    whyItMatters: { type: String, maxlength: 1500 },
    category: { type: String, enum: CATEGORIES, required: true },
    mbaConcepts: { type: [{ type: String, maxlength: 60 }], validate: (a) => !a || a.length <= 12 },
    industries: { type: [{ type: String, maxlength: 60 }], validate: (a) => !a || a.length <= 12 },
    interviewRelevance: { type: String, maxlength: 1500 },
    keyTakeaways: { type: [{ type: String, maxlength: 300 }], validate: (a) => !a || a.length <= 10 },
    interviewQuestions: { type: [{ type: String, maxlength: 300 }], validate: (a) => !a || a.length <= 10 },
    businessTerms: { type: [{ type: String, maxlength: 80 }], validate: (a) => !a || a.length <= 15 },
    source: { type: String, maxlength: 120 },
    sourceUrl: { type: String, maxlength: 600 },
    newsOfTheDay: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

articleSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('IntelligenceArticle', articleSchema);
module.exports.CATEGORIES = CATEGORIES;
