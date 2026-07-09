const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Note = require('../models/Note');
const Album = require('../models/Album');
const Task = require('../models/Task');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Resume = require('../models/Resume');
const JournalEntry = require('../models/JournalEntry');
const Announcement = require('../models/Announcement');
const { sendWelcomeEmail } = require('../config/mailer');

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

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, name: user.name, email: user.email, role: user.role || 'member' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
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
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: isAdminEmail(email) ? 'admin' : 'member',
    });
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
    // Promote on login so the admin account works even if it registered
    // before ADMIN_EMAIL was configured.
    if (isAdminEmail(user.email) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }
    res.json({ token: signToken(user) });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
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

    await User.deleteOne({ _id: userId });
    res.json({ message: 'Your account and all your data have been deleted' });
  } catch (err) {
    next(err);
  }
};
