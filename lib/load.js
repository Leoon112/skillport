'use strict';
const fs = require('fs');
const path = require('path');
const { extractFrontmatter } = require('./frontmatter');

function loadTools(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
  return files.map(f => {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const { data, body } = extractFrontmatter(text);
    return { file: f, abs: path.join(dir, f), data, body };
  });
}

module.exports = { loadTools };
