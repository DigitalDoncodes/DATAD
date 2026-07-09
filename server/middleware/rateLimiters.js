const rateLimit = require('express-rate-limit');

const make = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });

// Generous ceiling across the whole API — just anti-abuse, not felt in normal use.
const generalLimiter = make(15, 300, 'Too many requests, please slow down and try again shortly');

// Strict — brute-force protection on login/register.
const authLimiter = make(15, 20, 'Too many attempts, please try again later');

// Expensive operations: file uploads and fan-out emails.
const heavyLimiter = make(15, 40, 'Too many uploads or sends, please try again later');

module.exports = { generalLimiter, authLimiter, heavyLimiter };
