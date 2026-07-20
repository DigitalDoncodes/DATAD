const registry = require('./searchRegistry');
const fs = require('fs');
const path = require('path');

const PROVIDERS_DIR = path.join(__dirname, 'providers');

function registerAll() {
  const files = fs.readdirSync(PROVIDERS_DIR).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const provider = require(path.join(PROVIDERS_DIR, file));
    if (provider.id && typeof provider.search === 'function') {
      registry.register(provider);
    }
  }
  return registry;
}

const searchRouter = require('./searchRouter');

module.exports = { registerAll, registry, searchRouter };
