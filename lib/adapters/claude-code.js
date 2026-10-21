'use strict';

// Claude Code adapter：把 skillport 工具转成 Claude Code 的 SKILL.md
// 输出目录结构：dist/claude-code/<id>/SKILL.md
function convert(tool) {
  const d = tool.data;
  let desc = d.description;
  if (Array.isArray(d.aliases) && d.aliases.length) {
    desc += `。别名：${d.aliases.join('、')}`;
  }

  const out = [];
  out.push('---');
  out.push(`name: ${d.id}`);
  out.push(`description: ${desc}`);
  out.push('metadata:');
  out.push(`  skillport-id: ${d.id}`);
  out.push(`  version: ${d.version}`);
  out.push(`  category: ${d.category || 'misc'}`);
  out.push(`  trust: ${d.trust || 'declared'}`);
  out.push('---');
  out.push('');
  const body = tool.body.trim();
  if (!body.startsWith('#')) {
    out.push(`# ${d.name}`);
    out.push('');
  }
  out.push(body);

  if (d.command) {
    out.push('');
    out.push('## 调用方式');
    out.push('');
    out.push(`命令：\`${d.command}\``);
    if (Array.isArray(d.args) && d.args.length) {
      out.push(`默认参数：\`${d.args.join(' ')}\``);
    }
    if (Array.isArray(d.inputs) && d.inputs.length) {
      out.push('');
      out.push('输入参数：');
      for (const inp of d.inputs) {
        const bits = [`- \`${inp.name}\``];
        if (inp.type) bits.push(`(${inp.type})`);
        if (inp.required) bits.push('必填');
        if (inp.description) bits.push(`— ${inp.description}`);
        out.push('  ' + bits.join(' '));
      }
    }
    if (Array.isArray(d.permissions) && d.permissions.length) {
      out.push(`所需权限：${d.permissions.join(', ')}`);
    }
  }
  out.push('');

  return { files: [{ path: `${d.id}/SKILL.md`, content: out.join('\n') }] };
}

module.exports = { name: 'claude-code', description: 'Claude Code 技能（SKILL.md）', convert };
