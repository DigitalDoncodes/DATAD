const { getPromptForTask } = require('./promptRegistry');

let _graphApi;

function init(graphApi) {
  _graphApi = graphApi;
}

function buildPrompt(concepts, task) {
  const prompt = getPromptForTask(task || 'knowledge-graph');
  if (!prompt) return null;

  let system = prompt.system || '';
  const conceptList = Array.isArray(concepts)
    ? concepts.map((c) => `- ${c.name || c}: ${c.description || ''}`).join('\n')
    : concepts || '';

  system = system.replace(/\$\{concepts\}/g, conceptList);
  return { system, user: prompt.user || '', promptId: 'knowledge-graph', version: prompt.currentVersion };
}

async function getRelatedConcepts(nodeId, depth = 1, limit = 20) {
  if (!_graphApi) return [];

  try {
    return await _graphApi.getRelated(nodeId, { depth, limit });
  } catch {
    return [];
  }
}

async function getNodeInfo(nodeId) {
  if (!_graphApi) return null;
  try {
    return await _graphApi.getNode(nodeId);
  } catch {
    return null;
  }
}

async function searchNodes(query, limit = 20) {
  if (!_graphApi) return [];
  try {
    return await _graphApi.search(query, { limit });
  } catch {
    return [];
  }
}

async function getKnowledgeContext(userId, topics, maxNodes = 10) {
  if (!_graphApi || !topics?.length) return null;

  try {
    const results = [];
    for (const topic of topics.slice(0, 5)) {
      const nodes = await _graphApi.search(topic, { limit: Math.ceil(maxNodes / 5), userId });
      results.push(...(nodes || []));
    }
    return results.slice(0, maxNodes);
  } catch {
    return null;
  }
}

module.exports = {
  init,
  buildPrompt,
  getRelatedConcepts,
  getNodeInfo,
  searchNodes,
  getKnowledgeContext,
};
