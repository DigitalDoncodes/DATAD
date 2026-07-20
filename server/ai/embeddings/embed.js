const OpenAI = require('openai');

const EMBEDDING_DIM = 1536;

let _openai = null;
let _nvidia = null;

function _getOpenAI() {
  if (_openai) return _openai;
  _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

function _getNvidia() {
  if (_nvidia) return _nvidia;
  _nvidia = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });
  return _nvidia;
}

async function embed(text) {
  const clean = (text || '').replace(/\s+/g, ' ').trim().slice(0, 8000);
  if (!clean) return null;

  // Prefer NVIDIA embeddings when NVIDIA_API_KEY is set
  if (process.env.NVIDIA_API_KEY) {
    try {
      const res = await _getNvidia().embeddings.create({
        model: 'nvidia/nv-embedqa-e5-v5',
        input: clean,
      });
      return res.data[0].embedding;
    } catch (err) {
      console.warn('[embed] NVIDIA embedding failed, falling back:', err.message);
    }
  }

  // Fallback to OpenAI embeddings
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await _getOpenAI().embeddings.create({
        model: 'text-embedding-3-small',
        input: clean,
      });
      return res.data[0].embedding;
    } catch (err) {
      console.warn('[embed] OpenAI embedding failed, falling back to TF-IDF:', err.message);
    }
  }

  // Deterministic TF-IDF fallback
  return _tfidfVector(clean, EMBEDDING_DIM);
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function _tfidfVector(text, dims) {
  const vec = new Array(dims).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;

  for (const [token, count] of Object.entries(freq)) {
    const idx = _hashStr(token) % dims;
    vec[idx] += count / tokens.length;
  }

  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

function _hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

module.exports = { embed, cosineSimilarity, EMBEDDING_DIM };
