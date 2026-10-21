'use strict';

// 字段规范 v1：类型、枚举、默认值
const CATEGORIES = ['dev', 'security', 'productivity', 'data', 'media', 'docs', 'web', 'misc'];
const TRUST_LEVELS = ['declared', 'static', 'verified'];

const REQUIRED = {
  id: 'string',
  name: 'string',
  description: 'string',
  version: 'string',
};

const DEFAULTS = {
  category: 'misc',
  tags: [],
  aliases: [],
  installed: true,
  deps: [],
  trust: 'declared',
};

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;

module.exports = { CATEGORIES, TRUST_LEVELS, REQUIRED, DEFAULTS, ID_RE, SEMVER_RE };
