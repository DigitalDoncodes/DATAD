const requestStore = require('./requestStore');
const aiObservability = require('./aiObservability');

function getRecentRequests(count = 100) {
  return requestStore.recent(count);
}

function getRuntimeSummary() {
  return requestStore.summary();
}

function resetStore() {
  requestStore.reset();
}

function install() {
  aiObservability.install();
}

module.exports = {
  install,
  getRecentRequests,
  getRuntimeSummary,
  resetStore,
};
