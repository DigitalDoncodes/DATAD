const ActivityLog = require('../models/ActivityLog');
const logger = require('./logger');

// Fire-and-forget: activity logging must never break the main request.
const logActivity = (type, message, user = {}, meta = {}) => {
  ActivityLog.create({
    type,
    message,
    actorName: user.name || '',
    actorEmail: user.email || '',
    meta,
  }).catch((err) => logger.error('Activity log failed:', { error: err.message, type, message }));
};

module.exports = logActivity;
