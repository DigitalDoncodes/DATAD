const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkTier = require('../middleware/checkTier');
const DailyBriefing = require('../models/DailyBriefing');
const { getUserMemory } = require('../ai/memory');

// Specialization → priority sections for Phase 8 personalization
const SPEC_SECTIONS = {
  Finance:    ['market', 'finance', 'economy'],
  Marketing:  ['consulting', 'technology', 'placements'],
  Operations: ['operations', 'economy', 'technology'],
  HR:         ['leadership', 'placements', 'consulting'],
  Consulting: ['consulting', 'market', 'leadership', 'economy'],
};

router.get('/today', verifyToken, checkTier('trial'), async (req, res, next) => {
  try {
    const dateKey = new Date().toISOString().slice(0, 10);
    const briefing = await DailyBriefing.findOne({ dateKey, status: 'published' }).lean();
    if (!briefing) return res.status(404).json({ message: 'No briefing for today yet' });

    // Phase 8 — surface most-relevant sections for user's specialization
    const mem = await getUserMemory(req.user.userId).catch(() => null);
    const spec = mem?.specialization;
    const prioritySections = spec ? (SPEC_SECTIONS[spec] || []) : [];

    res.json({ ...briefing, _personalization: { specialization: spec || null, prioritySections } });
  } catch (err) { next(err); }
});

router.get('/history', verifyToken, checkTier('trial'), async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 7, 30);
    const briefings = await DailyBriefing.find({ status: 'published' })
      .sort({ dateKey: -1 })
      .limit(limit)
      .select('dateKey headline interviewTip keyNumbers mustKnowTerm createdAt')
      .lean();
    res.json(briefings);
  } catch (err) { next(err); }
});

module.exports = router;
