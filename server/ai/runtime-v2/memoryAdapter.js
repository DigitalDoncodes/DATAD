const UserMemory = require('../../models/UserMemory');

async function saveMemory(userId, entry) {
  try {
    const patch = {};
    if (entry.value?.query) {
      patch.$push = { recentTopics: { $each: [entry.value.query.slice(0, 80)], $slice: -10 } };
    }
    if (entry.value?.intent) {
      patch.lastIntent = entry.value.intent;
    }
    patch.lastInteractionAt = new Date();
    await UserMemory.findOneAndUpdate(
      { user: userId },
      patch,
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.warn('[memoryAdapter] Failed to save memory:', err.message);
    return null;
  }
}

async function getRecentMemory(userId, limit = 10) {
  try {
    const mem = await UserMemory.findOne({ user: userId }).lean();
    if (!mem) return [];
    return (mem.recentTopics || []).slice(-limit).map((topic, i) => ({
      key: `topic:${i}`,
      value: topic,
      createdAt: mem.lastInteractionAt,
    }));
  } catch {
    return [];
  }
}

async function getMemoryByType(userId, type, limit = 10) {
  return [];
}

async function getMemoryByKey(userId, key) {
  return null;
}

async function deleteMemory(userId, memoryId) {
  return false;
}

async function searchMemory(userId, query, limit = 10) {
  const mem = await UserMemory.findOne({ user: userId }).lean();
  if (!mem) return [];
  const topics = (mem.recentTopics || []).filter((t) =>
    t.toLowerCase().includes(query.toLowerCase())
  );
  return topics.slice(0, limit).map((t) => ({ key: t, value: t }));
}

async function getMemorySummary(userId) {
  return [];
}

module.exports = {
  getRecentMemory,
  getMemoryByType,
  saveMemory,
  getMemoryByKey,
  deleteMemory,
  searchMemory,
  getMemorySummary,
};
