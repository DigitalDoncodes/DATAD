const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { heavyLimiter } = require('../middleware/rateLimiters');
const {
  getStats,
  listStudents,
  getStudentProfile,
  approveStudent,
  rejectStudent,
  getActivityLogs,
  getReferralMap,
  createAnnouncement,
  deleteAnnouncement,
} = require('../controllers/adminController');

router.use(verifyToken, checkRole('admin'));

router.get('/stats', getStats);
router.get('/students', listStudents);
router.get('/students/:id/profile', getStudentProfile);
router.patch('/students/:id/approve', approveStudent);
router.delete('/students/:id/reject', rejectStudent);
router.get('/logs', getActivityLogs);
router.get('/referrals', getReferralMap);

router.post('/announcements', heavyLimiter, createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Site-wide meta (placement date, batch name)
const SiteMeta = require('../models/SiteMeta');
router.get('/meta', async (req, res, next) => {
  try {
    const meta = await SiteMeta.findOne({ key: 'main' }).lean();
    res.json(meta || {});
  } catch (err) { next(err); }
});
router.put('/meta', async (req, res, next) => {
  try {
    const { placementDate, batchName } = req.body;
    const meta = await SiteMeta.findOneAndUpdate(
      { key: 'main' },
      { $set: { placementDate: placementDate || null, batchName: batchName || '' } },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(meta);
  } catch (err) { next(err); }
});

// ── Subscription management ───────────────────────────────────────────────

const SubscriptionRequest = require('../models/SubscriptionRequest');
const User = require('../models/User');

const { TIERS } = require('../subscription/tierHierarchy');

const VALID_TIERS = TIERS;

// Paid plans run for exactly one month from activation; trials for 7 days.
const oneMonthFromNow = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d;
};
const sevenDaysFromNow = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

// List all subscription requests
router.get('/subscriptions', async (req, res, next) => {
  try {
    const status = req.query.status; // pending | approved | rejected | (all)
    const filter = status ? { status } : {};
    const requests = await SubscriptionRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('user', 'name email tier')
      .lean();
    res.json(requests);
  } catch (err) { next(err); }
});

// List all users with their tier
router.get('/subscriptions/users', async (req, res, next) => {
  try {
    const users = await User.find()
      .select('name email role tier trialStartedAt tierExpiresAt subscriptionRef createdAt status')
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (err) { next(err); }
});

// Manually change a user's tier
router.patch('/subscriptions/users/:id/tier', async (req, res, next) => {
  try {
    const { tier, subscriptionRef, tierExpiresAt } = req.body;
    if (!VALID_TIERS.includes(tier)) {
      return res.status(400).json({ message: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` });
    }

    const patch = { tier };
    if (subscriptionRef) patch.subscriptionRef = subscriptionRef;
    if (tierExpiresAt) patch.tierExpiresAt = new Date(tierExpiresAt);
    else if (tier === 'free') patch.tierExpiresAt = null; // free never expires
    else if (tier === 'trial') patch.tierExpiresAt = sevenDaysFromNow();
    else patch.tierExpiresAt = oneMonthFromNow(); // pro/max default to one month

    const user = await User.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true })
      .select('name email tier tierExpiresAt subscriptionRef')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    // An admin-granted trial consumes the one-time self-serve trial too
    if (tier === 'trial') {
      await User.updateOne({ _id: req.params.id, trialStartedAt: null }, { trialStartedAt: new Date() });
    }

    const till = patch.tierExpiresAt
      ? ` — valid till ${new Date(patch.tierExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : '';
    res.json({ message: `${user.name} updated to ${tier}${till}`, user });
  } catch (err) { next(err); }
});

// Approve or reject a subscription request
router.patch('/subscriptions/:id/review', async (req, res, next) => {
  try {
    const { action, reviewNote } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }

    const sr = await SubscriptionRequest.findById(req.params.id).populate('user', 'name email');
    if (!sr) return res.status(404).json({ message: 'Request not found' });
    if (sr.status !== 'pending') {
      return res.status(400).json({ message: 'Request already reviewed' });
    }

    sr.status = action === 'approve' ? 'approved' : 'rejected';
    sr.reviewedBy = req.user.userId;
    sr.reviewedAt = new Date();
    sr.reviewNote = reviewNote || '';
    await sr.save();

    // If approved, upgrade the user's tier automatically
    if (action === 'approve') {
      const expiresAt = oneMonthFromNow(); // paid plans run for exactly one month
      await User.findByIdAndUpdate(sr.user._id, {
        $set: { tier: sr.tier, subscriptionRef: sr.paymentRef, tierExpiresAt: expiresAt },
      });
    }

    res.json({ message: `Request ${sr.status}`, request: sr });
  } catch (err) { next(err); }
});

// Public meta — any member can read the placement date for the countdown.
module.exports = router;

