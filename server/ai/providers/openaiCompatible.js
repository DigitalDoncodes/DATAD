/**
 * Adapter for any OpenAI-compatible API:
 * Groq, OpenAI, Gemini, OpenRouter, NVIDIA NIM, Ollama
 */
const OpenAI = require('openai');

class OpenAICompatibleProvider {
  constructor(config) {
    this.name = config.name;
    this.model = config.model;
    this.maxTokens = config.maxTokens || 2048;
    this.temperature = config.temperature ?? 0.7;
    this._client = null;
    this._config = config;
  }

  _getClient() {
    if (!this._client) {
      const opts = { apiKey: this._config.apiKey };
      if (this._config.baseURL) opts.baseURL = this._config.baseURL;
      this._client = new OpenAI(opts);
    }
    return this._client;
  }

  isAvailable() {
    return Boolean(this._config.apiKey);
  }

  async complete({ messages, maxTokens, temperature, responseFormat, model }) {
    const start = Date.now();
    const resolvedModel = model || this.model;
    const params = {
      model: resolvedModel,
      messages,
      max_tokens: maxTokens || this.maxTokens,
      temperature: temperature ?? this.temperature,
    };
    if (responseFormat) params.response_format = responseFormat;

    const res = await this._getClient().chat.completions.create(params);
    const text = res.choices[0].message.content.trim();
    return {
      text,
      provider: this.name,
      model: resolvedModel,
      tokensUsed: res.usage?.total_tokens || 0,
      promptTokens: res.usage?.prompt_tokens || 0,
      completionTokens: res.usage?.completion_tokens || 0,
      latencyMs: Date.now() - start,
    };
  }

  async generate({ system, user, context, query, taskName, intent, userId, model }) {
    const messages = [
      ...(context ? [{ role: 'system', content: context }] : []),
      ...(system ? [{ role: 'system', content: system }] : []),
      ...(user ? [{ role: 'user', content: user }] : []),
      ...(query ? [{ role: 'user', content: query }] : []),
    ];
    return this.complete({ messages, model });
  }
}

module.exports = OpenAICompatibleProvider;
