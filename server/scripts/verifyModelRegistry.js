#!/usr/bin/env node
/**
 * Model registry reconciliation.
 *
 * runtime-v2/modelRegistry.js hand-maintains ~48 model entries. Provider
 * catalogues move underneath it: models get retired, and slugs drift
 * ("meta/codellama-70b-instruct" became "meta/codellama-70b"). Nothing
 * validated the registry against reality, so routeRequest() could — and did —
 * select a model the account cannot call, surfacing as a provider error at
 * request time rather than a startup warning.
 *
 * This compares every nvidia-provider entry against the live
 * /v1/models catalogue and reports three buckets: OK, DRIFTED (a close live
 * slug exists — likely a rename), and GONE (no plausible successor).
 *
 * Read-only. Never edits the registry — a human decides what to repoint,
 * because assigning capability scores to a replacement model is a judgement
 * call, not a mechanical substitution.
 *
 *   node server/scripts/verifyModelRegistry.js
 *
 * Exits non-zero when anything is unreachable, so CI can gate on it.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const BASE_URL = 'https://integrate.api.nvidia.com/v1';

async function fetchLiveCatalogue(apiKey) {
  const res = await fetch(`${BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`NVIDIA /models returned ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  return new Set((body.data || []).map((m) => m.id));
}

/**
 * Cheap similarity: share the vendor prefix and enough of the model stem that
 * a human would recognise it as the same family. Deliberately loose — this
 * only suggests candidates for a human to confirm, so false positives are
 * cheaper than misses.
 */
function findSuccessors(registryKey, live) {
  const [vendor] = registryKey.split('/');
  const stem = registryKey
    .split('/')
    .slice(1)
    .join('/')
    .replace(/[-_.]/g, ' ')
    .split(' ')
    .filter((t) => t.length > 2);

  const scored = [];
  for (const id of live) {
    const sameVendor = id.startsWith(`${vendor}/`);
    const idNorm = id.replace(/[-_.]/g, ' ');
    const overlap = stem.filter((t) => idNorm.includes(t)).length;
    if (overlap === 0) continue;
    scored.push({ id, score: overlap + (sameVendor ? 1.5 : 0) });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 3).map((s) => s.id);
}

async function main() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error('NVIDIA_API_KEY is not set — cannot verify the registry.');
    process.exit(2);
  }

  const registry = require('../ai/runtime-v2/modelRegistry');
  const entries = registry.findModelsByProvider('nvidia');

  let live;
  try {
    live = await fetchLiveCatalogue(apiKey);
  } catch (err) {
    console.error(`Failed to fetch the live catalogue: ${err.message}`);
    process.exit(2);
  }

  const ok = [];
  const drifted = [];
  const gone = [];

  for (const entry of entries) {
    const id = entry.model;
    if (live.has(id)) {
      ok.push(id);
      continue;
    }
    const successors = findSuccessors(id, live);
    if (successors.length) drifted.push({ id, successors });
    else gone.push(id);
  }

  console.log(`\nRegistry entries (provider=nvidia): ${entries.length}`);
  console.log(`Live catalogue entries:              ${live.size}\n`);
  console.log(`  reachable : ${ok.length}`);
  console.log(`  drifted   : ${drifted.length}`);
  console.log(`  gone      : ${gone.length}\n`);

  if (drifted.length) {
    console.log('DRIFTED — a live model of the same family exists; likely a rename:');
    for (const d of drifted) {
      console.log(`  ${d.id}`);
      for (const s of d.successors) console.log(`      -> ${s}`);
    }
    console.log('');
  }

  if (gone.length) {
    console.log('GONE — no plausible successor in the live catalogue:');
    for (const g of gone) console.log(`  ${g}`);
    console.log('');
  }

  const unreachable = drifted.length + gone.length;
  if (unreachable > 0) {
    console.log(
      `${unreachable} of ${entries.length} registry entries cannot be called with the ` +
      `configured key. routeRequest() can still select them.\n`
    );
    process.exit(1);
  }

  console.log('Every registry entry is reachable.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
