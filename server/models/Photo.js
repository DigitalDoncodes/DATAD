const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album', required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, trim: true, maxlength: 300 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Photo', photoSchema);
