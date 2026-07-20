require('dotenv').config({ quiet: true });
const p = require('./ai/providers').getProviderChain('nvidia')[0];
const models = [
  ['Llama 3.3 70B', 'meta/llama-3.3-70b-instruct'],
  ['Llama 4 Maverick', 'meta/llama-4-maverick-17b-128e-instruct'],
  ['Qwen 3.5', 'qwen/qwen3.5-397b-a17b'],
  ['Mistral Large 3', 'mistralai/mistral-large-3-675b-instruct-2512'],
  ['GLM 5.2', 'z-ai/glm-5.2'],
];
const withTimeout = (pr, ms) => Promise.race([pr, new Promise((_, r) => setTimeout(() => r(Object.assign(new Error('timeout'), { status: 'TIMEOUT' })), ms))]);
(async () => {
  for (const [label, model] of models) {
    const t = Date.now();
    try {
      await withTimeout(p.complete({ messages: [{ role: 'user', content: 'hi' }], model, maxTokens: 8 }), 45000);
      console.log('OK  ', String(Date.now() - t).padStart(6) + 'ms |', label);
    } catch (e) {
      console.log('FAIL', String(Date.now() - t).padStart(6) + 'ms |', label, '|', e.status || e.message.slice(0, 60));
    }
  }
  process.exit(0);
})();
