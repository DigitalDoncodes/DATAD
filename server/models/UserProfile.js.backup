const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    clubs: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    batch: { type: String, trim: true },
    specialization: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 300 },
    lookingFor: { type: String, trim: true },
    preMbaDomain: { type: String, trim: true, maxlength: 80 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
