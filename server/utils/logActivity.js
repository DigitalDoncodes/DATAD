const ActivityLog = require('../models/ActivityLog');

// Fire-and-forget: activity logging must never break the main request.
const logActivity = (type, message, user = {}, meta = {}) => {
  ActivityLog.create({
    type,
    message,
    actorName: user.name || '',
    actorEmail: user.email || '',
    meta,
  }).catch((err) => console.error('Activity log failed:', err.message));
};

module.exports = logActivity;
