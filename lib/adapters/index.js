'use strict';

// adapter 注册表：每个 agent 一个模块，统一 convert(tool) -> { files }
const adapters = {
  'claude-code': require('./claude-code'),
};

function getAdapter(name) {
  return adapters[name] || null;
}

function listAdapters() {
  return Object.values(adapters);
}

module.exports = { getAdapter, listAdapters };
