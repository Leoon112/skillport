'use strict';
const { CATEGORIES, TRUST_LEVELS, INPUT_TYPES, PERMISSIONS, REQUIRED, ID_RE, SEMVER_RE } = require('./schema');

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

  for (const key of ['tags', 'aliases', 'deps', 'args', 'permissions']) {
    if (d[key] !== undefined && !Array.isArray(d[key])) {
      errors.push(`${file}: 字段 "${key}" 应为数组`);
    }
  }

  if (d.command !== undefined && typeof d.command !== 'string') {
    errors.push(`${file}: 字段 "command" 应为 string`);
  }

  if (Array.isArray(d.permissions)) {
    for (const p of d.permissions) {
      if (!PERMISSIONS.includes(p)) {
        errors.push(`${file}: 未知 permission "${p}"（允许：${PERMISSIONS.join(', ')}）`);
      }
    }
  }

  if (Array.isArray(d.inputs)) {
    for (const [i, inp] of d.inputs.entries()) {
      if (typeof inp !== 'object' || inp === null) {
        errors.push(`${file}: inputs[${i}] 应为对象`);
        continue;
      }
      if (typeof inp.name !== 'string' || inp.name === '') {
        errors.push(`${file}: inputs[${i}].name 应为非空字符串`);
      }
      if (inp.type !== undefined && !INPUT_TYPES.includes(inp.type)) {
        errors.push(`${file}: inputs[${i}].type "${inp.type}" 未知（允许：${INPUT_TYPES.join(', ')}）`);
      }
      if (inp.required !== undefined && typeof inp.required !== 'boolean') {
        errors.push(`${file}: inputs[${i}].required 只能是 true / false`);
      }
    }
  }

  return errors;
}

module.exports = { validateTool };
