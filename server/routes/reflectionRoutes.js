const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const DailyReflection = require('../models/DailyReflection');

router.get('/today', verifyToken, async (req, res, next) => {
  try {
    const dateKey = new Date().toISOString().slice(0, 10);
    const reflection = await DailyReflection.findOne({ dateKey, status: 'published' }).lean();
    if (!reflection) return res.json(null);
    res.json(reflection);
  } catch (err) { next(err); }
});

module.exports = router;
