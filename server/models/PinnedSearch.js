const mongoose = require('mongoose');

const pinnedSearchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resultId: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  url: { type: String },
  icon: { type: String },
  category: { type: String },
  action: { type: String },
  pinnedAt: { type: Date, default: Date.now },
});

pinnedSearchSchema.index({ user: 1, resultId: 1 }, { unique: true });

module.exports = mongoose.model('PinnedSearch', pinnedSearchSchema);
