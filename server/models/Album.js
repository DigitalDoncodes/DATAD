const mongoose = require('mongoose');

// An album is a link to a shared Google Photos album (no files stored here).
const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    link: { type: String, required: true, trim: true, maxlength: 600 },
    cover: { type: String, trim: true, maxlength: 600 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Album', albumSchema);
