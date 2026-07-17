const OpenAI = require('openai');

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

const NVIDIA_MODELS = {
  'deepseek-ai/deepseek-v4-flash': {
    contextWindow: 1048576, supportsVision: false, supportsEmbedding: false, maxTokens: 8192,
  },
  'deepseek-ai/deepseek-v4-pro': {
    contextWindow: 1048576, supportsVision: false, supportsEmbedding: false, maxTokens: 8192,
  },
  'deepseek-ai/deepseek-r1': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'deepseek-ai/deepseek-r1-distill-llama-8b': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'deepseek-ai/deepseek-r1-distill-llama-70b': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'deepseek-ai/deepseek-r1-distill-qwen-32b': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'meta/llama-3.3-70b-instruct': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 2048,
  },
  'meta/llama-3.1-8b-instruct': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 2048,
  },
  'meta/llama-3.1-70b-instruct': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 2048,
  },
  'meta/llama-4-maverick': {
    contextWindow: 256000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'nvidia/llama-3.1-nemotron-70b-instruct': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'nvidia/nemotron-3-super-120b-a12b': {
    contextWindow: 262000, supportsVision: false, supportsEmbedding: false, maxTokens: 8192,
  },
  'nvidia/nemotron-3-nano': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 2048,
  },
  'nvidia/llama-3.3-nemotron-super-49b-v1.5': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'nvidia/nemotron-4-340b-instruct': {
    contextWindow: 4096, supportsVision: false, supportsEmbedding: false, maxTokens: 1024,
  },
  'qwen/qwen3-coder-480b-a35b-instruct': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 8192,
  },
  'qwen/qwen-3.5': {
    contextWindow: 262000, supportsVision: false, supportsEmbedding: false, maxTokens: 8192,
  },
  'mistralai/mistral-large-3': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'mistralai/devstral-2-123b': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'minimax/minimax-m2.7-230b': {
    contextWindow: 262000, supportsVision: false, supportsEmbedding: false, maxTokens: 8192,
  },
  'google/gemma-4-31b-it': {
    contextWindow: 16000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'google/gemma-2-2b-it': {
    contextWindow: 8192, supportsVision: false, supportsEmbedding: false, maxTokens: 2048,
  },
  'google/gemma-2-9b-it': {
    contextWindow: 8192, supportsVision: false, supportsEmbedding: false, maxTokens: 2048,
  },
  'glm-5/glm-5': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'glm-5/glm-5.2': {
    contextWindow: 256000, supportsVision: false, supportsEmbedding: false, maxTokens: 8192,
  },
  'openai/gpt-oss-120b': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'openai/gpt-oss-20b': {
    contextWindow: 128000, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'nvidia/nv-embedqa-e5-v5': {
    contextWindow: 512, supportsVision: false, supportsEmbedding: true, maxTokens: 512,
  },
  'nvidia/bge-m3': {
    contextWindow: 8192, supportsVision: false, supportsEmbedding: true, maxTokens: 8192,
  },
  'nvidia/nv-embedcode-7b-v1': {
    contextWindow: 4096, supportsVision: false, supportsEmbedding: true, maxTokens: 4096,
  },
  'bigcode/starcoder2-7b': {
    contextWindow: 16384, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'meta/codellama-13b-instruct': {
    contextWindow: 16384, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'meta/codellama-34b-instruct': {
    contextWindow: 16384, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'meta/codellama-70b-instruct': {
    contextWindow: 16384, supportsVision: false, supportsEmbedding: false, maxTokens: 4096,
  },
  'nvidia/cosmos-reason2-8b': {
    contextWindow: 32768, supportsVision: true, supportsEmbedding: false, maxTokens: 2048,
  },
  'nvidia/cosmos-transfer1-7b': {
    contextWindow: 32768, supportsVision: true, supportsEmbedding: false, maxTokens: 2048,
  },
  'nvidia/cosmos3-nano': {
    contextWindow: 16384, supportsVision: true, supportsEmbedding: false, maxTokens: 2048,
  },
  'nvidia/cosmos3-nano-reasoner': {
    contextWindow: 16384, supportsVision: true, supportsEmbedding: false, maxTokens: 2048,
  },
  'sarvamai/sarvam-m': {
    contextWindow: 8192, supportsVision: false, supportsEmbedding: false, maxTokens: 2048,
  },
  'utter-project/eurollm-9b-instruct': {
    contextWindow: 8192, supportsVision: false, supportsEmbedding: false, maxTokens: 2048,
  },
  'speakleash/bielik-11b-v2.3-instruct': {
    contextWindow: 8192, supportsVision: false, supportsEmbedding: false, maxTokens: 2048,
  },
};

class NvidiaProvider {
  constructor(config) {
    this.name = 'nvidia';
    this.model = config.model || 'meta/llama-3.3-70b-instruct';
    this.maxTokens = config.maxTokens || 2048;
    this.temperature = config.temperature ?? 0.7;
    this._config = config;
    this._client = null;
  }

  _getClient() {
    if (!this._client) {
      this._client = new OpenAI({
        apiKey: process.env.NVIDIA_API_KEY,
        baseURL: NVIDIA_BASE_URL,
      });
    }
    return this._client;
  }

  isAvailable() {
    return Boolean(process.env.NVIDIA_API_KEY);
  }

  getModelInfo(modelName) {
    return NVIDIA_MODELS[modelName] || NVIDIA_MODELS['meta/llama-3.3-70b-instruct'];
  }

  async complete({ messages, system, maxTokens, temperature, responseFormat, model }) {
    const start = Date.now();
    const resolvedModel = model || this.model;
    const modelInfo = this.getModelInfo(resolvedModel);

    const params = {
      model: resolvedModel,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...messages,
      ],
      max_tokens: maxTokens || modelInfo.maxTokens || this.maxTokens,
      temperature: temperature ?? this.temperature,
    };
    if (responseFormat) params.response_format = responseFormat;

    const res = await this._getClient().chat.completions.create(params);
    const text = res.choices[0].message.content.trim();
    return {
      text,
      provider: 'nvidia',
      model: resolvedModel,
      tokensUsed: res.usage?.total_tokens || 0,
      promptTokens: res.usage?.prompt_tokens || 0,
      completionTokens: res.usage?.completion_tokens || 0,
      latencyMs: Date.now() - start,
    };
  }

  async generateEmbeddings(inputs, model) {
    const embedModel = model || 'nvidia/nv-embedqa-e5-v5';
    const client = this._getClient();
    const inputsArr = Array.isArray(inputs) ? inputs : [inputs];
    const res = await client.embeddings.create({
      model: embedModel,
      input: inputsArr,
    });
    return res.data.map((d) => d.embedding);
  }

  async generate({ system, user, context, query, taskName, intent, userId, model }) {
    const messages = [
      ...(context ? [{ role: 'system', content: context }] : []),
      ...(system ? [{ role: 'system', content: system }] : []),
      ...(user ? [{ role: 'user', content: user }] : []),
      ...(query ? [{ role: 'user', content: query }] : []),
    ];
    return this.complete({ messages, system, model });
  }
}

module.exports = NvidiaProvider;
