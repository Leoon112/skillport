'use strict';
const { CATEGORIES, TRUST_LEVELS, REQUIRED, ID_RE, SEMVER_RE } = require('./schema');

function validateTool(tool, seenIds) {
  const errors = [];
  const d = tool.data;
  const file = tool.file;

  for (const [key, type] of Object.entries(REQUIRED)) {
    if (d[key] === undefined) {
      errors.push(`${file}: 缺少必填字段 "${key}"`);
    } else if (typeof d[key] !== type) {
      errors.push(`${file}: 字段 "${key}" 应为 ${type}`);
    }
  }

  if (typeof d.id === 'string') {
    if (!ID_RE.test(d.id)) {
      errors.push(`${file}: id "${d.id}" 不符合 kebab-case 规范`);
    } else if (seenIds.has(d.id)) {
      errors.push(`${file}: id "${d.id}" 重复`);
    } else {
      seenIds.add(d.id);
    }
  }

  if (typeof d.version === 'string' && !SEMVER_RE.test(d.version)) {
    errors.push(`${file}: version "${d.version}" 不是合法 semver`);
  }

  if (d.category !== undefined && !CATEGORIES.includes(d.category)) {
    errors.push(`${file}: 未知 category "${d.category}"（允许：${CATEGORIES.join(', ')}）`);
  }

  if (d.trust !== undefined && !TRUST_LEVELS.includes(d.trust)) {
    errors.push(`${file}: 未知 trust "${d.trust}"（允许：${TRUST_LEVELS.join(', ')}）`);
  }

  if (d.installed !== undefined && typeof d.installed !== 'boolean') {
    errors.push(`${file}: installed 只能是 true / false`);
  }

  for (const key of ['tags', 'aliases', 'deps']) {
    if (d[key] !== undefined && !Array.isArray(d[key])) {
      errors.push(`${file}: 字段 "${key}" 应为数组`);
    }
  }

  return errors;
}

module.exports = { validateTool };
