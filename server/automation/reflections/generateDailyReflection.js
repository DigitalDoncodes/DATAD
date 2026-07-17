const { run } = require('../../ai/runner');
const PROMPTS = require('../../ai/prompts');
const { runJob } = require('../jobRunner');
const DailyReflection = require('../../models/DailyReflection');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function generateDailyReflection() {
  return runJob('daily-reflection-generation', async () => {
    const dateStr = todayKey();
    const dayOfWeek = DAYS[new Date().getDay()];

    const existing = await DailyReflection.findOne({ dateKey: dateStr });
    if (existing) {
      console.log(`[daily-reflection] Reflection for ${dateStr} already exists — skipping`);
      return { itemsProcessed: 0, meta: { skipped: true } };
    }

    const prompt = PROMPTS.dailyReflection({ dateStr, dayOfWeek });
    const { result, meta } = await run({ system: prompt.system, user: prompt.user, json: true });

    await DailyReflection.create({
      dateKey: dateStr,
      quote: result.quote || {},
      reflection: result.reflection,
      challenge: result.challenge,
      productivityTip: result.productivityTip,
      dailyConcept: result.concept || {},
      gratitude: result.gratitude,
      generatedBy: meta.provider,
      model: meta.model,
      tokensUsed: meta.tokensUsed,
      status: 'published',
    });

    return { provider: meta.provider, model: meta.model, tokensUsed: meta.tokensUsed, itemsProcessed: 1 };
  });
}

module.exports = { generateDailyReflection };
