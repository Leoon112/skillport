#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs');
const { loadTools } = require('../lib/load');
const { validateTool } = require('../lib/validate');
const { checkTool } = require('../lib/check');
const { ID_RE } = require('../lib/schema');
const { getAdapter, listAdapters } = require('../lib/adapters');

// 关键：从任意 cwd 运行都能定位到项目根，从而找到 tools/
const ROOT = path.resolve(__dirname, '..');
const TOOLS_DIR = path.join(ROOT, 'tools');

function main() {
  const [cmd, arg, arg2] = process.argv.slice(2);
  switch (cmd) {
    case 'validate': return cmdValidate();
    case 'check': return cmdCheck();
    case 'list': return cmdList();
    case 'search': return cmdSearch(arg);
    case 'show': return cmdShow(arg);
    case 'add': return cmdAdd(arg);
    case 'index': return cmdIndex();
    case 'export': return cmdExport(arg, arg2);
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
    '  node bin/toolbox.js add <id>     新建工具骨架',
    '  node bin/toolbox.js index        生成派生索引缓存',
    '  node bin/toolbox.js export [目标] 导出为目标 agent 格式',
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
  if (d.command) console.log(`command: ${d.command}`);
  if (Array.isArray(d.args) && d.args.length) console.log(`args: [${d.args.join(', ')}]`);
  if (Array.isArray(d.permissions) && d.permissions.length) console.log(`permissions: [${d.permissions.join(', ')}]`);
  if (Array.isArray(d.inputs) && d.inputs.length) {
    console.log('inputs:');
    for (const inp of d.inputs) {
      const bits = [`  - ${inp.name}`];
      if (inp.type) bits.push(`(${inp.type})`);
      if (inp.required) bits.push('[必填]');
      if (inp.description) bits.push(`— ${inp.description}`);
      console.log(bits.join(' '));
    }
  }
  console.log('---');
  console.log(t.body.trim());
}

function cmdAdd(id) {
  if (!id) {
    console.error('用法: node bin/toolbox.js add <id>');
    process.exit(1);
  }
  if (!ID_RE.test(id)) {
    console.error(`id "${id}" 不符合 kebab-case 规范（[a-z0-9]+(-[a-z0-9]+)*）`);
    process.exit(1);
  }
  const file = path.join(TOOLS_DIR, id + '.md');
  if (fs.existsSync(file)) {
    console.error(`已存在 ${id}.md，不覆盖`);
    process.exit(1);
  }
  const name = id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  const content = [
    '---',
    `id: ${id}`,
    `name: ${name}`,
    'description: （一句话说明）',
    'version: 0.1.0',
    'category: misc',
    'tags: []',
    'aliases: []',
    'installed: true',
    'deps: []',
    'trust: declared',
    '# 第二阶段（AI 可调用时填写，去掉行首 # 启用）：',
    `# command: node tools/scripts/${id}.js`,
    '# args: []',
    '# inputs:',
    '#   - name: url',
    '#     type: string',
    '#     required: true',
    '# permissions: [network]',
    '---',
    '',
    `# ${name}`,
    '',
    '（在此填写工具说明、用法、示例）',
    '',
  ].join('\n');
  fs.writeFileSync(file, content, 'utf8');
  console.log(`[ok] 已创建 ${id}.md（${path.relative(ROOT, file)}）`);
}

function cmdIndex() {
  const tools = requireTools();
  const index = {
    generatedAt: new Date().toISOString(),
    count: tools.length,
    tools: tools.map(t => ({
      id: t.data.id,
      name: t.data.name,
      description: t.data.description,
      category: t.data.category || 'misc',
      trust: t.data.trust || 'declared',
      tags: t.data.tags || [],
      aliases: t.data.aliases || [],
      file: t.file,
    })),
  };
  const dir = path.join(ROOT, '.toolbox');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index, null, 2), 'utf8');
  console.log(`[ok] 已生成 .toolbox/index.json（${tools.length} 个工具）`);
}

function cmdExport(agent, id) {
  const tools = requireTools();
  if (!agent) {
    console.log('可用目标格式：');
    for (const a of listAdapters()) console.log(`  ${a.name}\t${a.description}`);
    return;
  }
  const adapter = getAdapter(agent);
  if (!adapter) {
    console.error(`未知目标 "${agent}"（可用：${listAdapters().map(a => a.name).join(', ')}）`);
    process.exit(1);
  }
  const targets = id ? tools.filter(t => t.data.id === id) : tools;
  if (id && targets.length === 0) {
    console.error(`未找到工具 "${id}"`);
    process.exit(1);
  }
  const distRoot = path.join(ROOT, 'dist', agent);
  let n = 0;
  for (const t of targets) {
    const { files } = adapter.convert(t);
    for (const f of files) {
      const outPath = path.join(distRoot, f.path);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, f.content, 'utf8');
      n++;
    }
  }
  console.log(`[ok] 已导出 ${targets.length} 个工具 → ${path.relative(ROOT, distRoot)}（${n} 个文件）`);
}

main();
