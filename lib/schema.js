'use strict';

// 字段规范 v2：类型、枚举、默认值（含可移植层字段）
const CATEGORIES = ['dev', 'security', 'productivity', 'data', 'media', 'docs', 'web', 'misc'];
const TRUST_LEVELS = ['declared', 'static', 'verified'];
const INPUT_TYPES = ['string', 'number', 'boolean'];
const PERMISSIONS = ['network', 'file-read', 'file-write', 'exec'];

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
  args: [],
  inputs: [],
  permissions: [],
};

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;

module.exports = { CATEGORIES, TRUST_LEVELS, INPUT_TYPES, PERMISSIONS, REQUIRED, DEFAULTS, ID_RE, SEMVER_RE };
