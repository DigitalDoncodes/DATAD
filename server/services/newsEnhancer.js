/**
 * AI news enhancement — turns cached articles into preparation material for students.
 * Uses the new AI runner (provider-agnostic, retry, proper SDK calls).
 */
const { run } = require('../ai/runner');
const PROMPTS = require('../ai/prompts');
const NewsItem = require('../models/NewsItem');

const BATCH_SIZE = 8;

async function enhanceBatch(articles) {
  const prompt = PROMPTS.newsEnhance({ articles });
  const { result } = await run({ system: prompt.system, user: prompt.user, json: true });

  const enhancements = Array.isArray(result) ? result : [];
  let saved = 0;

  for (let i = 0; i < articles.length; i++) {
    const e = enhancements[i];
    if (!e?.whyItMatters) continue;
    const r = await NewsItem.updateOne(
      { _id: articles[i]._id },
      {
        $set: {
          whyItMatters: e.whyItMatters,
          mbaConcepts: (e.mbaConcepts || []).slice(0, 4),
          keyTakeaways: [e.keyTakeaway].filter(Boolean),
          interviewRelevance: e.interviewRelevance || 'medium',
        },
      }
    );
    if (r.modifiedCount) saved++;
  }
  return saved;
}

async function enhancePending(maxArticles = 24) {
  const pending = await NewsItem.find({
    $or: [{ whyItMatters: null }, { whyItMatters: '' }, { whyItMatters: { $exists: false } }],
  })
    .sort({ publishedAt: -1 })
    .limit(maxArticles)
    .lean();

  if (pending.length === 0) return { enhanced: 0 };

  let enhanced = 0;
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    try {
      enhanced += await enhanceBatch(pending.slice(i, i + BATCH_SIZE));
    } catch (err) {
      console.error('[newsEnhancer] batch failed:', err.message);
    }
  }
  console.log(`[newsEnhancer] ${enhanced}/${pending.length} articles enhanced`);
  return { enhanced };
}

module.exports = { enhancePending };
