const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    interests: { type: [{ type: String, maxlength: 40 }], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
