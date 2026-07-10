const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Note = require('../models/Note');
const Album = require('../models/Album');
const Task = require('../models/Task');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Resume = require('../models/Resume');
const JournalEntry = require('../models/JournalEntry');
const Announcement = require('../models/Announcement');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../config/mailer');
const logActivity = require('../utils/logActivity');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

const isAdminEmail = (email) =>
  process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

const passwordProblem = (password) => {
  if (!password || password.length < MIN_PASSWORD) {
    return `Password must be at least ${MIN_PASSWORD} characters`;
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include both a letter and a number';
  }
  return null;
};

// Readable, non-guessable referral code: name prefix + random suffix, e.g. DHAT-7K2M.
const makeReferralCode = (name) => {
  const prefix = (name || 'USER').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
  const suffix = crypto.randomBytes(3).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  return `${prefix}-${suffix}`;
};

const uniqueReferralCode = async (name) => {
  for (let i = 0; i < 5; i++) {
    const code = makeReferralCode(name);
    if (!(await User.exists({ referralCode: code }))) return code;
  }
  return `${makeReferralCode(name)}${Date.now().toString(36).slice(-3).toUpperCase()}`;
};

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, name: user.name, email: user.email, role: user.role || 'member' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, referralCode } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    const pwdProblem = passwordProblem(password);
    if (pwdProblem) return res.status(400).json({ message: pwdProblem });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // A valid referral code from an approved member auto-approves the account.
    // Codes are strictly one-time: the claim below atomically marks the code as
    // used, so two simultaneous signups can never share one code.
    let referrer = null;
    const newUserId = new mongoose.Types.ObjectId();
    if (referralCode) {
      const code = referralCode.trim().toUpperCase();
      referrer = await User.findOneAndUpdate(
        { referralCode: code, status: { $ne: 'pending' }, referralUsedBy: null },
        { referralUsedBy: newUserId }
      );
      if (!referrer) {
        const exists = await User.exists({ referralCode: code });
        return res.status(400).json({
          message: exists
            ? 'This referral code has already been used'
            : 'Invalid referral code',
        });
      }
    }
    const approved = isAdminEmail(email) || Boolean(referrer);

    let user;
    try {
      const hashed = await bcrypt.hash(password, 10);
      user = await User.create({
        _id: newUserId,
        name,
        email,
        password: hashed,
        role: isAdminEmail(email) ? 'admin' : 'member',
        status: approved ? 'approved' : 'pending',
        referralCode: await uniqueReferralCode(name),
        referredBy: referrer ? referrer._id : null,
      });
    } catch (err) {
      // Release the claimed code if account creation failed for any reason.
      if (referrer) {
        await User.updateOne(
          { _id: referrer._id, referralUsedBy: newUserId },
          { referralUsedBy: null }
        );
      }
      throw err;
    }

    if (referrer) {
      logActivity(
        'register_referral',
        `${user.name} registered with ${referrer.name}'s referral code ${referrer.referralCode} — instant access`,
        user,
        { referrerName: referrer.name, referrerEmail: referrer.email, code: referrer.referralCode }
      );
    } else if (approved) {
      logActivity('register_admin', `${user.name} registered as admin (ADMIN_EMAIL match)`, user);
    } else {
      logActivity('register_pending', `${user.name} registered without a code — waiting for approval`, user);
    }

    if (!approved) {
      return res.status(201).json({
        pending: true,
        message: 'Account created — an admin will review and approve it shortly.',
      });
    }

    // Fire-and-forget: registration must not fail if the mail service is down.
    sendWelcomeEmail(user).catch((err) => console.error('Welcome email failed:', err.message));
    res.status(201).json({ token: signToken(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    // Only explicit 'pending' is blocked — accounts created before gating pass through.
    if (user.status === 'pending' && !isAdminEmail(user.email)) {
      return res.status(403).json({
        pending: true,
        message: 'Your account is awaiting admin approval. You will get an email once approved.',
      });
    }
    // Promote on login so the admin account works even if it registered
    // before ADMIN_EMAIL was configured.
    if (isAdminEmail(user.email) && (user.role !== 'admin' || user.status !== 'approved')) {
      user.role = 'admin';
      user.status = 'approved';
      await user.save();
    }
    res.json({ token: signToken(user) });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -resetTokenHash -resetTokenExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Accounts created before referral codes existed get one lazily.
    if (!user.referralCode) {
      user.referralCode = await uniqueReferralCode(user.name);
      await user.save();
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, linkedin, github } = req.body;
    const updates = {};
    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ message: 'Name cannot be empty' });
      updates.name = String(name).trim();
    }
    if (bio !== undefined) updates.bio = String(bio);
    if (linkedin !== undefined) updates.linkedin = String(linkedin);
    if (github !== undefined) updates.github = String(github);

    const user = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password -resetTokenHash -resetTokenExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Name lives inside the JWT too — issue a fresh token so the UI stays in sync.
    res.json({ user, token: signToken(user) });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    const pwdProblem = passwordProblem(newPassword);
    if (pwdProblem) return res.status(400).json({ message: pwdProblem });

    const user = await User.findById(req.user.userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
};

// ---- Password reset via email link ----

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // Always answer the same way so the endpoint can't be used to probe emails.
    const generic = { message: 'If an account exists for that email, a reset link has been sent.' };
    if (!email || !EMAIL_RE.test(email)) return res.json(generic);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json(generic);

    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const clientUrl = process.env.CLIENT_URL.split(',')[0].trim();
    const link = `${clientUrl}/reset-password?token=${token}`;
    sendPasswordResetEmail(user, link).catch((err) =>
      console.error('Reset email failed:', err.message)
    );
    logActivity('password_reset_requested', `${user.name} requested a password reset link`, user);
    res.json(generic);
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    const pwdProblem = passwordProblem(password);
    if (pwdProblem) return res.status(400).json({ message: pwdProblem });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();
    logActivity('password_reset_done', `${user.name} reset their password via email link`, user);
    res.json({ message: 'Password reset — you can now log in' });
  } catch (err) {
    next(err);
  }
};

// Permanently remove the account and everything the user owns.
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    await Promise.all([
      Album.deleteMany({ createdBy: userId }),
      Note.deleteMany({ author: userId }),
      Task.deleteMany({ createdBy: userId }),
      Expense.deleteMany({ user: userId }),
      Budget.deleteMany({ user: userId }),
      Resume.deleteMany({ user: userId }),
      JournalEntry.deleteMany({ user: userId }),
      Announcement.deleteMany({ createdBy: userId }),
    ]);
    // Shared tasks created by others but assigned to this user: unassign, don't delete.
    await Task.updateMany({ assignee: userId }, { assignee: null });
    // If someone spent their one-time referral code on this account, give it back.
    await User.updateMany({ referralUsedBy: userId }, { referralUsedBy: null });

    await User.deleteOne({ _id: userId });
    logActivity('account_deleted', `${user.name} deleted their account and all data`, user);
    res.json({ message: 'Your account and all your data have been deleted' });
  } catch (err) {
    next(err);
  }
};
