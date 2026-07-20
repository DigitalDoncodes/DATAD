class SearchRegistry {
  constructor() {
    this._providers = new Map();
    this._intentPatterns = this._buildIntentPatterns();
  }

  _buildIntentPatterns() {
    return [
      { pattern: /^(create|new|add|make)\s+(a\s+)?(note|task|event|post|reminder|goal)/i, intent: 'create', entity: '$4' },
      { pattern: /^(open|go\s+to|navigate|show|launch)\s+(.+)/i, intent: 'navigate', entity: '$2' },
      { pattern: /^(find|search|look\s+for|show\s+me)\s+(.+)/i, intent: 'search', entity: '$2' },
      { pattern: /^(delete|remove|archive|trash)\s+(.+)/i, intent: 'delete', entity: '$2' },
      { pattern: /^(edit|update|change|modify)\s+(.+)/i, intent: 'edit', entity: '$2' },
      { pattern: /^(chat|ask|talk|message)\s+(dax|ai|assistant)?/i, intent: 'chat', entity: '$2' },
      { pattern: /^(summarise|summarize|summary)\s+(.+)/i, intent: 'summarize', entity: '$2' },
      { pattern: /^(review|feedback|critique)\s+(.+)/i, intent: 'review', entity: '$2' },
      { pattern: /^(compare|vs|versus)\s+(.+)/i, intent: 'compare', entity: '$2' },
      { pattern: /^(help|commands|shortcuts|keys)/i, intent: 'help' },
      { pattern: /^(\?\?\?|idk|not sure|dunno|help me)/i, intent: 'confused' },
    ];
  }

  register(provider) {
    if (!provider.id || typeof provider.search !== 'function') {
      throw new Error(`SearchProvider must have an id and a search() method`);
    }
    this._providers.set(provider.id, provider);
  }

  parseIntent(query) {
    const q = query.trim();
    for (const { pattern, intent, entity } of this._intentPatterns) {
      const match = q.match(pattern);
      if (match) {
        return {
          intent,
          entity: entity ? (match[entity] || '').trim() : null,
          raw: q,
          confident: true,
        };
      }
    }
    return { intent: 'search', entity: q, raw: q, confident: false };
  }

  deduplicate(results) {
    const seen = new Map();
    const out = [];
    for (const r of results) {
      const key = r.url || r.id || r.title.toLowerCase().trim();
      if (seen.has(key)) {
        const existing = seen.get(key);
        if ((r.score || 0) > (existing.score || 0)) {
          existing.score = r.score;
          existing.matchType = r.matchType || existing.matchType;
          existing.providers = [...new Set([...(existing.providers || [existing.providerId]), r.providerId])];
        }
        continue;
      }
      seen.set(key, { ...r, providers: [r.providerId] });
      out.push(seen.get(key));
    }
    return out;
  }

  async search(query, userId, options = {}) {
    if (!query || !query.trim()) return [];
    const q = query.trim();
    const allResults = [];
    const providerTimings = {};
    const providerStatus = {};

    const promises = [];
    for (const [id, provider] of this._providers) {
      const start = Date.now();
      providerStatus[id] = 'pending';
      promises.push(
        (async () => {
          try {
            const results = await provider.search(q, userId, options);
            providerTimings[id] = Date.now() - start;
            providerStatus[id] = 'done';
            if (Array.isArray(results)) {
              for (const r of results) {
                allResults.push({
                  ...r,
                  providerId: id,
                  providerLabel: provider.label || id,
                  category: provider.label || provider.id,
                });
              }
            }
          } catch (err) {
            providerTimings[id] = Date.now() - start;
            providerStatus[id] = 'error';
            console.error(`[Search] Provider "${provider.id}" failed:`, err.message);
          }
        })()
      );
    }

    await Promise.allSettled(promises);
    const ranked = this._rank(allResults, q);
    const deduped = this.deduplicate(ranked);

    if (options.includeAnalytics !== false) {
      this._lastAnalytics = {
        query: q,
        totalResults: deduped.length,
        rawResults: allResults.length,
        providerTimings,
        providerStatus,
        timestamp: Date.now(),
      };
    }

    return deduped.slice(0, options.limit || 50);
  }

  async searchStream(query, userId, options = {}, onResult) {
    if (!query || !query.trim()) {
      if (onResult) onResult({ type: 'done', results: [] });
      return [];
    }
    const q = query.trim();
    const allResults = [];
    const providerTimings = {};
    const totalProviders = this._providers.size;
    let completedCount = 0;

    const promises = [];
    for (const [id, provider] of this._providers) {
      const start = Date.now();
      promises.push(
        (async () => {
          try {
            const results = await provider.search(q, userId, options);
            providerTimings[id] = Date.now() - start;
            completedCount++;
            if (Array.isArray(results)) {
              const tagged = results.map((r) => ({
                ...r,
                providerId: id,
                providerLabel: provider.label || id,
                category: provider.label || provider.id,
              }));
              allResults.push(...tagged);
              if (onResult) {
                onResult({
                  type: 'provider',
                  providerId: id,
                  providerLabel: provider.label || id,
                  results: tagged,
                  completedCount,
                  totalProviders,
                  providerTimings,
                });
              }
            }
          } catch (err) {
            providerTimings[id] = Date.now() - start;
            completedCount++;
            if (onResult) {
              onResult({
                type: 'provider',
                providerId: id,
                providerLabel: provider.label || id,
                error: err.message,
                completedCount,
                totalProviders,
                providerTimings,
              });
            }
          }
        })()
      );
    }

    await Promise.allSettled(promises);
    const ranked = this._rank(allResults, q);
    const deduped = this.deduplicate(ranked).slice(0, options.limit || 50);

    if (onResult) {
      onResult({
        type: 'done',
        results: deduped,
        totalResults: deduped.length,
        rawResults: allResults.length,
        providerTimings,
        completedCount,
        totalProviders,
      });
    }

    return deduped;
  }

  async getCommands(userId) {
    const commands = [];
    for (const [, provider] of this._providers) {
      if (typeof provider.getCommands === 'function') {
        try {
          const cmds = await provider.getCommands(userId);
          if (Array.isArray(cmds)) commands.push(...cmds);
        } catch {}
      }
    }
    return commands;
  }

  async searchCommands(query, userId) {
    const q = query.toLowerCase().trim();
    const commands = await this.getCommands(userId);
    return commands
      .map((c) => {
        const title = (c.title || '').toLowerCase();
        const keywords = (c.keywords || []).join(' ').toLowerCase();
        let score = 0;
        const searchTerms = q.split(/\s+/);
        for (const term of searchTerms) {
          if (title === term) score += 50;
          if (title.startsWith(term)) score += 30;
          if (title.includes(term)) score += 15;
          if (keywords.includes(term)) score += 10;
        }
        return { ...c, score, category: 'Commands', providerId: '_commands' };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  _rank(results, query) {
    const q = query.toLowerCase();
    const now = Date.now();
    const scores = results.map((r) => {
      const title = (r.title || '').toLowerCase();
      const subtitle = (r.subtitle || '').toLowerCase();
      const tags = (r.tags || []).join(' ').toLowerCase();
      const content = (r.content || '').toLowerCase();

      let score = 0;
      if (title === q) score += 100;
      else if (title.startsWith(q)) score += 60;
      else if (title.includes(q)) score += 30;

      if (subtitle === q) score += 50;
      else if (subtitle.startsWith(q)) score += 30;
      else if (subtitle.includes(q)) score += 15;

      const matchedTags = tags.split(/\s+/).filter((t) => t && q.includes(t) || t === q);
      score += matchedTags.length * 15;

      if (content.includes(q)) score += 10;
      else {
        const terms = q.split(/\s+/).filter(Boolean);
        const matchedContentTerms = terms.filter((t) => content.includes(t)).length;
        score += matchedContentTerms * 3;
      }

      if (r.recentlyViewed) {
        const recency = Math.max(0, 1 - (now - new Date(r.recentlyViewed).getTime()) / 604800000);
        score += recency * 10;
      }
      if (r.frequency) score += Math.min(r.frequency, 10) * 3;
      if (r.priority != null) score += r.priority;

      const providerPriority = this._providers.get(r.providerId)?.priority || 0;
      score += providerPriority * 0.1;

      return { ...r, score };
    });

    return scores
      .filter((r) => r.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.matchType === 'exact' && b.matchType !== 'exact') return -1;
        if (b.matchType === 'exact' && a.matchType !== 'exact') return 1;
        return 0;
      });
  }

  getProviders() {
    const result = {};
    for (const [id, provider] of this._providers) {
      result[id] = { id, label: provider.label, priority: provider.priority };
    }
    return result;
  }

  getLastAnalytics() {
    return this._lastAnalytics || null;
  }
}

const registry = new SearchRegistry();
module.exports = registry;
