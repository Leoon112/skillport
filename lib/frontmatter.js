'use strict';

// 极简 YAML frontmatter 解析：标量 + 单行数组 + 嵌套列表（如 inputs）
function parseFrontmatter(raw) {
  const out = {};
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const val = m[2].trim();
    // 嵌套列表：值为空，下一行是缩进的 "- "
    if (val === '' && i + 1 < lines.length && /^\s+-\s/.test(lines[i + 1])) {
      const items = [];
      let cur = null;
      i++;
      while (i < lines.length) {
        const l = lines[i];
        if (l.trim() === '' || l.trim().startsWith('#')) { i++; continue; }
        const lm = l.match(/^\s*-\s+(.*)$/);
        if (lm) {
          cur = {};
          const kv = lm[1].match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
          if (kv) cur[kv[1]] = parseScalar(kv[2].trim());
          items.push(cur);
        } else if (cur && /^\s+[A-Za-z_]/.test(l)) {
          const km = l.trim().match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
          if (km) cur[km[1]] = parseScalar(km[2].trim());
        } else {
          break;
        }
        i++;
      }
      i--;
      out[m[1]] = items;
    } else {
      out[m[1]] = parseScalar(val);
    }
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
