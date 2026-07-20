/**
 * Adapter for Anthropic Claude (native SDK).
 */
const Anthropic = require('@anthropic-ai/sdk');

class AnthropicProvider {
  constructor(config) {
    this.name = 'anthropic';
    this.model = config.model;
    this.maxTokens = config.maxTokens || 2048;
    this.temperature = config.temperature ?? 0.7;
    this._client = null;
    this._config = config;
  }

  _getClient() {
    if (!this._client) {
      this._client = new Anthropic({ apiKey: this._config.apiKey });
    }
    return this._client;
  }

  isAvailable() {
    return Boolean(this._config.apiKey);
  }

  async complete({ messages, system, maxTokens, temperature }) {
    const start = Date.now();
    // Separate system message from messages array (Anthropic API style)
    const systemPrompt = system || messages.find((m) => m.role === 'system')?.content;
    const userMessages = messages.filter((m) => m.role !== 'system');

    const params = {
      model: this.model,
      max_tokens: maxTokens || this.maxTokens,
      messages: userMessages,
    };
    if (systemPrompt) params.system = systemPrompt;

    const res = await this._getClient().messages.create(params);
    const text = res.content[0].text.trim();
    return {
      text,
      provider: 'anthropic',
      model: this.model,
      tokensUsed: (res.usage?.input_tokens || 0) + (res.usage?.output_tokens || 0),
      promptTokens: res.usage?.input_tokens || 0,
      completionTokens: res.usage?.output_tokens || 0,
      latencyMs: Date.now() - start,
    };
  }

  async generate({ system, user, context, query, taskName, intent, userId }) {
    const messages = [
      ...(context ? [{ role: 'system', content: context }] : []),
      ...(system ? [{ role: 'system', content: system }] : []),
      ...(user ? [{ role: 'user', content: user }] : []),
      ...(query ? [{ role: 'user', content: query }] : []),
    ];
    return this.complete({ messages, system });
  }
}

module.exports = AnthropicProvider;
