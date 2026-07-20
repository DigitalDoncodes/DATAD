/**
 * Stage B/C of the Content Studio pipeline: LLM metadata + destination
 * suggestion, embedding, duplicate detection. Runs async after ingest;
 * degrades gracefully when no AI provider is configured.
 */
const cloudinary = require('../../config/cloudinary');
const ContentItem = require('../../models/ContentItem');
const registry = require('./destinationRegistry');
const { extract } = require('./extractors');
const { embed } = require('../../ai/embeddings/embed');
const duplicateService = require('./duplicateService');

function stripFences(raw) {
  return raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
}

function thumbnailFor(item) {
  const { publicId, resourceType, type } = item.file;
  if (!publicId) return undefined;
  try {
    if (type === 'image' || type === 'pdf') {
      // PDFs upload as resource_type image on Cloudinary; page 1 renders as jpg.
      return cloudinary.url(publicId, {
        resource_type: 'image', format: 'jpg', page: type === 'pdf' ? 1 : undefined,
        width: 480, crop: 'limit', secure: true,
      });
    }
    if (type === 'video') {
      return cloudinary.url(publicId, {
        resource_type: 'video', format: 'jpg', width: 480, crop: 'limit', secure: true,
      });
    }
  } catch (_) { /* thumbnail is cosmetic */ }
  return undefined;
}

// Filename-based fallback when AI is unavailable.
function heuristicAnalysis(item, extracted) {
  const base = item.file.originalName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  const byType = {
    image: 'gallery', video: 'resources', audio: 'resources', excel: 'resources',
    zip: /photo|image|pic/i.test(base) ? 'gallery' : 'resources',
  };
  return {
    title: base.charAt(0).toUpperCase() + base.slice(1),
    description: '',
    summary: extracted.text ? extracted.text.slice(0, 300) : '',
    keywords: [],
    language: 'en',
    suggestedDestination: byType[item.file.type] || (/announce/i.test(base) ? 'announcements' : 'notes'),
    confidence: 0.3,
    model: 'heuristic',
  };
}

async function llmAnalysis(item, extracted) {
  const { getProvider } = require('../../ai/providers');
  const provider = getProvider(); // throws when nothing is configured

  const catalog = registry
    .catalog()
    .map((d) => `- "${d.key}": ${d.label} — ${d.description}`)
    .join('\n');

  const prompt = `You are the content-classification engine of DATAD, a student batch platform.
Analyse this uploaded file and reply with ONLY a JSON object, no other text.

Filename: ${item.file.originalName}
File type: ${item.file.type} (${item.file.mime}, ${(item.file.size / 1024).toFixed(0)} KB${item.file.pageCount ? `, ${item.file.pageCount} pages` : ''})

Available destinations:
${catalog}

Extracted content sample:
"""
${(extracted.text || '(no extractable text — judge from the filename and type)').slice(0, 6000)}
"""

JSON schema (omit unknown fields or use null):
{"title":"clean human title","description":"1-2 sentence description","summary":"3-4 sentence summary",
"subject":"academic subject if any","semester":"e.g. Sem 3","course":"course name if any",
"company":"company name if the content is about one","category":"short category label",
"keywords":["up to 8"],"language":"ISO code","suggestedDestination":"one destination key from the list",
"confidence":0.0}
confidence is YOUR 0-1 confidence in suggestedDestination.`;

  const res = await provider.complete({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 800,
    temperature: 0.2,
  });
  const parsed = JSON.parse(stripFences(res.text));
  if (!registry.destinations[parsed.suggestedDestination]) {
    parsed.suggestedDestination = 'resources';
    parsed.confidence = Math.min(parsed.confidence || 0.3, 0.4);
  }
  return { ...parsed, model: `${res.provider}/${res.model}` };
}

/**
 * Full analysis for an item whose file buffer is still in memory.
 * Updates the ContentItem in place; never throws (marks `failed` instead).
 */
async function analyze(itemId, buffer) {
  const item = await ContentItem.findById(itemId);
  if (!item) return;
  try {
    item.status = 'analyzing';
    await item.save();

    const extracted = buffer
      ? await extract(item.file.type, buffer)
      : { text: '' };
    if (extracted.pageCount != null) item.file.pageCount = extracted.pageCount;

    let ai;
    // Images have no extractable text and most providers can't process
    // raw image data — go straight to heuristics to avoid "model does not
    // support image input" errors.
    if (item.file.type === 'image') {
      ai = heuristicAnalysis(item, extracted);
    } else {
      try {
        ai = await llmAnalysis(item, extracted);
      } catch (err) {
        console.warn(`[studio:analyze] AI unavailable/failed (${err.message}); using heuristics`);
        ai = heuristicAnalysis(item, extracted);
      }
    }

    item.analysis = {
      ...ai,
      keywords: (ai.keywords || []).slice(0, 8),
      handwritten: extracted.handwritten,
      ocrText: extracted.text || undefined,
      thumbnailUrl: thumbnailFor(item),
    };

    // Prefill the editable meta from analysis.
    item.meta = {
      title: ai.title || item.file.originalName,
      description: ai.description || '',
      subject: ai.subject || '',
      semester: ai.semester || '',
      course: ai.course || '',
      company: ai.company || '',
      category: ai.category || '',
      tags: (ai.keywords || []).slice(0, 8),
      visibility: 'members',
      extra: {},
    };
    // Respect a destination pinned at upload time (deep-linked uploads).
    if (!item.destination?.key) {
      item.destination = {
        key: ai.suggestedDestination,
        targetModel: registry.get(ai.suggestedDestination).model,
      };
    }

    // Embedding + near-duplicate detection (best-effort).
    try {
      const vector = await embed(
        [ai.title, ai.summary, (extracted.text || '').slice(0, 4000)].filter(Boolean).join('\n')
      );
      if (vector) {
        item.embedding = vector;
        const similar = await duplicateService.findSimilar(item, vector);
        if (similar && !item.duplicateOf) {
          item.duplicateOf = similar._id;
          item.duplicateKind = 'similar';
        }
      }
    } catch (err) {
      console.warn(`[studio:analyze] embedding/duplicate step failed: ${err.message}`);
    }

    item.status = 'ready_for_review';
    await item.save();
  } catch (err) {
    console.error(`[studio:analyze] failed for ${itemId}: ${err.message}`);
    item.status = 'failed';
    item.rejectedReason = err.message;
    await item.save().catch(() => {});
  }
}

module.exports = { analyze };
