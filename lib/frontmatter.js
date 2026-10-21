'use strict';

// 极简 YAML frontmatter 解析：只支持 SCHEMA 需要的标量 + 单行数组
function parseFrontmatter(raw) {
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (t === '' || t.startsWith('#')) continue;
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    out[m[1]] = parseScalar(m[2].trim());
  }
  return out;
}

function parseScalar(s) {
  if (s === '' || s === '~') return s === '' ? '' : null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null') return null;
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map(x => parseScalar(x.trim())).filter(x => x !== '');
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function extractFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: text };
  return { data: parseFrontmatter(m[1]), body: text.slice(m[0].length) };
}

module.exports = { parseFrontmatter, parseScalar, extractFrontmatter };
