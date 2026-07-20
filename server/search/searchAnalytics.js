const SearchHistory = require('../models/SearchHistory');

const inMemoryStore = new Map();
const MAX_MEMORY_ENTRIES = 500;

function _cleanup() {
  if (inMemoryStore.size > MAX_MEMORY_ENTRIES) {
    const keys = [...inMemoryStore.keys()].slice(0, -100);
    for (const k of keys) inMemoryStore.delete(k);
  }
}

async function recordSearch({ userId, query, resultCount, latencyMs, providerTimings }) {
  _cleanup();
  const key = `${userId}:${query}`;
  inMemoryStore.set(key, { query, resultCount, latencyMs, providerTimings, timestamp: Date.now() });

  try {
    await SearchHistory.findOneAndUpdate(
      { user: userId, query: query.toLowerCase().trim() },
      {
        $inc: { frequency: 1 },
        $set: { lastSearchedAt: new Date(), resultCount, latencyMs, providerTimings },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (err) {
    console.error('[SearchAnalytics] Failed to record search:', err.message);
  }
}

function getRecentSearches(userId, limit = 10) {
  const entries = [];
  const now = Date.now();
  for (const [key, val] of inMemoryStore) {
    if (key.startsWith(`${userId}:`)) {
      entries.push({ ...val, query: val.query });
    }
  }
  entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return entries.slice(0, limit);
}

async function getFrequentSearches(userId, limit = 8) {
  try {
    return await SearchHistory.find({ user: userId })
      .sort({ frequency: -1 })
      .limit(limit)
      .select('query frequency resultCount lastSearchedAt')
      .lean();
  } catch {
    return [];
  }
}

async function recordClick(userId, query, resultId, category) {
  try {
    await SearchHistory.findOneAndUpdate(
      { user: userId, query: query.toLowerCase().trim() },
      {
        $push: {
          resultsClicked: { resultId, category, timestamp: new Date() },
        },
      },
    );
  } catch (err) {
    console.error('[SearchAnalytics] Failed to record click:', err.message);
  }
}

async function getPinned(userId) {
  try {
    const Pinned = require('../models/PinnedSearch');
    return await Pinned.find({ user: userId }).sort({ pinnedAt: -1 }).lean();
  } catch {
    return [];
  }
}

async function togglePin(userId, item) {
  try {
    const Pinned = require('../models/PinnedSearch');
    const existing = await Pinned.findOne({ user: userId, resultId: item.id });
    if (existing) {
      await Pinned.deleteOne({ _id: existing._id });
      return { pinned: false };
    }
    await Pinned.create({
      user: userId,
      resultId: item.id,
      title: item.title,
      subtitle: item.subtitle,
      url: item.url,
      icon: item.icon,
      category: item.category,
      action: item.action,
    });
    return { pinned: true };
  } catch (err) {
    console.error('[SearchAnalytics] Failed to toggle pin:', err.message);
    return { pinned: false, error: err.message };
  }
}

module.exports = {
  recordSearch,
  getRecentSearches,
  getFrequentSearches,
  recordClick,
  getPinned,
  togglePin,
};
