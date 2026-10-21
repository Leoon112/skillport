'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// 只读探测表：检查依赖时只跑 --version 类命令，绝不执行工具本体
const PROBES = {
  node: ['node', ['--version']],
  npm: ['npm', ['--version']],
  python: ['python', ['--version']],
  python3: ['python3', ['--version']],
  playwright: ['npx', ['playwright', '--version']],
};

function checkTool(tool, root) {
  const problems = [];
  const d = tool.data;

  if (typeof d.path === 'string' && d.path) {
    const p = path.resolve(root, d.path);
    if (!fs.existsSync(p)) problems.push(`${tool.file}: path "${d.path}" 不存在`);
  }

  if (Array.isArray(d.deps)) {
    for (const dep of d.deps) {
      const r = checkDep(dep);
      if (r !== true) problems.push(`${tool.file}: 依赖 ${dep} — ${r}`);
    }
  }

  return problems;
}

function checkDep(dep) {
  const m = String(dep).match(/^([A-Za-z0-9_.-]+)(?:\s*(>=|>|<=|<|=)\s*(.+))?$/);
  if (!m) return '格式无法解析';
  const name = m[1];
  const op = m[2];
  const want = m[3];
  const probe = PROBES[name] || [name, ['--version']];
  let out = null;
  try {
    out = execFileSync(probe[0], probe[1], {
      timeout: 8000,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
  } catch (e) {
    return '未检测到（命令不可用）';
  }
  if (op && want) {
    const v = (out || '').match(/\d+(\.\d+)*/);
    if (!v) return '无法解析版本号';
    if (!compareVer(v[0], want, op)) return `版本 ${v[0]} 不满足 ${op}${want}`;
  }
  return true;
}

function compareVer(a, b, op) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x === y) continue;
    const gt = x > y;
    if (op === '>') return gt;
    if (op === '<') return !gt;
    if (op === '>=') return gt;
    if (op === '<=') return !gt;
    if (op === '=') return false;
  }
  return op === '>=' || op === '<=' || op === '=';
}

module.exports = { checkTool, checkDep };
