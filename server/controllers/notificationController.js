const Notification = require('../models/Notification');
const logger = require('../utils/logger');

exports.list = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.userId })
      .populate('actor', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    const unread = notifications.filter((n) => !n.read).length;
    res.json({ notifications, unread });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { read: true }
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user.userId, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// Helper used by other controllers to fire notifications without blocking
exports.notify = async ({ user, type, title, body, link, actor }) => {
  try {
    if (!user || user.toString() === (actor || '').toString()) return;
    await Notification.create({ user, type, title, body, link, actor });
  } catch (err) {
    logger.error('Failed to create notification', { error: err.message, user, type, title });
  }
};

// Bulk helper — one insertMany for broadcasting to many users
exports.notifyBulk = async (userIds, { type, title, body, link, actor }) => {
  try {
    if (!userIds?.length) return;
    const actorStr = actor ? actor.toString() : null;
    const docs = userIds
      .filter((id) => !actorStr || id.toString() !== actorStr)
      .map((user) => ({ user, type, title, body, link, actor }));
    if (docs.length) await Notification.insertMany(docs, { ordered: false });
  } catch (err) {
    logger.error('Failed to create bulk notifications', { error: err.message, userIdsCount: userIds?.length, type, title });
  }
};
