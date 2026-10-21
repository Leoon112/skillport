#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs');
const { loadTools } = require('../lib/load');
const { validateTool } = require('../lib/validate');
const { checkTool } = require('../lib/check');

// 关键：从任意 cwd 运行都能定位到项目根，从而找到 tools/
const ROOT = path.resolve(__dirname, '..');
const TOOLS_DIR = path.join(ROOT, 'tools');

function main() {
  const [cmd, arg] = process.argv.slice(2);
  switch (cmd) {
    case 'validate': return cmdValidate();
    case 'check': return cmdCheck();
    case 'list': return cmdList();
    case 'search': return cmdSearch(arg);
    case 'show': return cmdShow(arg);
    case 'add':
    case 'index':
      console.log(`toolbox ${cmd}：第二阶段实现（当前先做数据规范 + validate + check）`);
      return;
    default:
      return usage();
  }
}

function usage() {
  console.log([
    'skillport toolbox',
    '用法：',
    '  node bin/toolbox.js validate     校验工具元数据格式与规范',
    '  node bin/toolbox.js check        静态检查文件/依赖可用性（不执行脚本）',
    '  node bin/toolbox.js list         列出所有工具',
    '  node bin/toolbox.js search <词>   关键词搜索',
    '  node bin/toolbox.js show <id>    查看工具详情',
  ].join('\n'));
}

function requireTools() {
  if (!fs.existsSync(TOOLS_DIR)) {
    console.error(`未找到 tools/ 目录（${TOOLS_DIR}）`);
    process.exit(1);
  }
  return loadTools(TOOLS_DIR);
}

function cmdValidate() {
  const tools = requireTools();
  if (tools.length === 0) {
    console.log('tools/ 下没有 .md 文件');
    return;
  }
  const seen = new Set();
  const errors = [];
  for (const t of tools) errors.push(...validateTool(t, seen));
  if (errors.length === 0) {
    console.log(`[PASS] validate：${tools.length} 个工具，格式与规范无误`);
  } else {
    console.error(`[FAIL] validate：${errors.length} 处问题`);
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
}

function cmdCheck() {
  const tools = requireTools();
  let bad = 0;
  for (const t of tools) {
    const errs = checkTool(t, ROOT);
    if (errs.length === 0) {
      console.log(`[ok]   ${t.file}`);
    } else {
      bad++;
      for (const e of errs) console.error(`[x]  ${e}`);
    }
  }
  if (bad === 0) {
    console.log(`[PASS] check：${tools.length} 个工具静态检查通过`);
  } else {
    console.error(`[FAIL] check：${bad} 个工具有问题`);
    process.exit(1);
  }
}

function cmdList() {
  const tools = requireTools();
  for (const t of tools) {
    const d = t.data;
    console.log(`${d.id}\t${d.name}\t${d.category || 'misc'}\t${d.trust || 'declared'}`);
  }
}

function cmdSearch(q) {
  if (!q) {
    console.error('用法: node bin/toolbox.js search <关键词>');
    process.exit(1);
  }
  const tools = requireTools();
  const kw = q.toLowerCase();
  const hits = tools.filter(t => {
    const d = t.data;
    const hay = [d.name, d.description, d.id, ...(d.tags || []), ...(d.aliases || [])]
      .join(' ')
      .toLowerCase();
    return hay.includes(kw);
  });
  if (hits.length === 0) {
    console.log(`无匹配 "${q}"`);
    return;
  }
  for (const t of hits) console.log(`${t.data.id}\t${t.data.name}\t${t.data.description}`);
}

function cmdShow(id) {
  if (!id) {
    console.error('用法: node bin/toolbox.js show <id>');
    process.exit(1);
  }
  const tools = requireTools();
  const t = tools.find(x => x.data.id === id);
  if (!t) {
    console.error(`未找到工具 "${id}"`);
    process.exit(1);
  }
  const d = t.data;
  console.log(`id: ${d.id}`);
  console.log(`name: ${d.name}`);
  console.log(`description: ${d.description}`);
  console.log(`version: ${d.version}`);
  console.log(`category: ${d.category || 'misc'}`);
  console.log(`trust: ${d.trust || 'declared'}`);
  console.log(`installed: ${d.installed}`);
  console.log(`file: ${t.file}`);
  console.log('---');
  console.log(t.body.trim());
}

main();
