const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const { generalLimiter } = require('../middleware/rateLimiters');
const registry = require('./searchRegistry');
const analytics = require('./searchAnalytics');

router.use(verifyToken);

// ── Existing POST / (non-streaming, backward compatible) ──────────────
router.post('/', generalLimiter, async (req, res, next) => {
  try {
    const { query, commands: includeCommands, limit } = req.body;
    if (!query || !query.trim()) {
      return res.json({ query: '', results: [], commands: [] });
    }

    const start = Date.now();
    const [results, commands] = await Promise.all([
      registry.search(query, req.user.userId, { limit, includeAnalytics: true }),
      includeCommands ? registry.searchCommands(query, req.user.userId) : Promise.resolve([]),
    ]);
    const latencyMs = Date.now() - start;

    analytics.recordSearch({
      userId: req.user.userId,
      query,
      resultCount: results.length,
      latencyMs,
      providerTimings: registry.getLastAnalytics()?.providerTimings,
    }).catch(() => {});

    const intent = registry.parseIntent(query);

    res.json({
      query,
      results,
      commands,
      intent,
      total: results.length + commands.length,
      latencyMs,
      providerTimings: registry.getLastAnalytics()?.providerTimings,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /stream  (SSE progressive streaming) ─────────────────────────
router.post('/stream', generalLimiter, async (req, res, next) => {
  try {
    const { query, commands: includeCommands, limit } = req.body;
    if (!query || !query.trim()) {
      return res.json({ query: '', results: [], commands: [] });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const sendEvent = (type, data) => {
      if (res.destroyed) return;
      res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const commandsPromise = includeCommands
      ? registry.searchCommands(query, req.user.userId)
      : Promise.resolve([]);

    const intent = registry.parseIntent(query);
    sendEvent('intent', intent);

    const start = Date.now();
    let finalResults = [];

    await registry.searchStream(query, req.user.userId, { limit }, (event) => {
      if (event.type === 'provider') {
        sendEvent('provider', {
          providerId: event.providerId,
          providerLabel: event.providerLabel,
          results: event.results || [],
          error: event.error || null,
          completedCount: event.completedCount,
          totalProviders: event.totalProviders,
        });
      } else if (event.type === 'done') {
        finalResults = event.results;
        const latencyMs = Date.now() - start;

        analytics.recordSearch({
          userId: req.user.userId,
          query,
          resultCount: event.totalResults,
          latencyMs,
          providerTimings: event.providerTimings,
        }).catch(() => {});

        sendEvent('done', {
          results: event.results,
          totalResults: event.totalResults,
          rawResults: event.rawResults,
          latencyMs,
          providerTimings: event.providerTimings,
        });
      }
    });

    const commands = await commandsPromise;
    if (commands.length > 0) {
      sendEvent('commands', commands);
    }

    res.end();
  } catch (err) {
    if (!res.headersSent) return next(err);
    try { res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`); res.end(); } catch {}
  }
});

// ── GET /providers ────────────────────────────────────────────────────
router.get('/providers', (req, res) => {
  res.json(registry.getProviders());
});

// ── POST /intent  (parse a query without searching) ────────────────────
router.post('/intent', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ message: 'Query required' });
  res.json(registry.parseIntent(query));
});

// ── POST /analytics/click ─────────────────────────────────────────────
router.post('/analytics/click', async (req, res) => {
  try {
    const { query, resultId, category } = req.body;
    if (!query || !resultId) return res.status(400).json({ message: 'query and resultId required' });
    await analytics.recordClick(req.user.userId, query, resultId, category);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /analytics/recents ────────────────────────────────────────────
router.get('/analytics/recents', (req, res) => {
  const recents = analytics.getRecentSearches(req.user.userId, 10);
  res.json(recents);
});

// ── GET /analytics/frequent ───────────────────────────────────────────
router.get('/analytics/frequent', async (req, res) => {
  const frequent = await analytics.getFrequentSearches(req.user.userId, 8);
  res.json(frequent);
});

// ── POST /pin  (toggle pin) ────────────────────────────────────────────
router.post('/pin', async (req, res) => {
  try {
    const result = await analytics.togglePin(req.user.userId, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /pinned ───────────────────────────────────────────────────────
router.get('/pinned', async (req, res) => {
  const pinned = await analytics.getPinned(req.user.userId);
  res.json(pinned);
});

module.exports = router;
