const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    interests: { type: [{ type: String, maxlength: 40 }], default: [] },

    // Signup gating: pending accounts wait for admin approval unless they
    // registered with a valid referral code from an approved member.
    status: { type: String, enum: ['pending', 'approved'], default: 'approved' },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // One-time use: set to the account that redeemed this user's code.
    referralUsedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Profile
    bio: { type: String, maxlength: 300, default: '' },
    linkedin: { type: String, maxlength: 200, default: '' },
    github: { type: String, maxlength: 200, default: '' },

    // Password reset (hashed token + expiry)
    resetTokenHash: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
