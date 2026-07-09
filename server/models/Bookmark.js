const mongoose = require('mongoose');

// A user's saved intelligence article. One per (user, article).
const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'IntelligenceArticle', required: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, article: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
