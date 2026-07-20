const mongoose = require('mongoose');

const userModelPrefSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  provider: { type: String, required: true },
  model: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('UserModelPref', userModelPrefSchema);
