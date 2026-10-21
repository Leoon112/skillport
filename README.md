# skillport

跨 agent 技能/工具可移植层：一份 Markdown 源，转成 Claude Code / Codex / 其他 agent 各自的技能格式。

**定位**：不是又一个工具管理器（那种已经很多），而是让同一份技能在多个 agent 之间复用、不锁 vendor、本地优先。

## 分层

- **数据层**：一个工具 = 一份 Markdown（frontmatter + 正文），字段规范见 `spec/SCHEMA.md`，每个工具有稳定 `id` 与 `trust` 分级
- **管理层**：`toolbox` CLI —— 校验（validate）、可用性检查（check）、搜索、新建（add）、索引（index）
- **转换层（adapter）**：把 Markdown 源转成各 agent 的技能格式（Claude Code / Codex），可插拔

## 当前状态

三个阶段核心闭环已跑通：

1. **数据规范**：字段 schema + `trust` 三级（declared / static / verified）+ 稳定 `id`（`validate` 校验）
2. **可移植字段**：`command` / `args` / `inputs` / `permissions`（AI 调用所需）+ `add` / `index`
3. **adapter 转换**：`export` 把源转成 Claude Code / Codex 的 SKILL.md

**刻意未做**：语义搜索 / 向量库（关键词搜索够用，分阶段推进）、更多 adapter（Cursor 等）。

## 用法

```bash
node bin/toolbox.js validate        # 校验元数据格式与规范
node bin/toolbox.js check           # 静态检查文件/依赖可用性（绝不执行脚本）
node bin/toolbox.js list            # 列出所有工具
node bin/toolbox.js search <词>      # 关键词搜索
node bin/toolbox.js show <id>       # 查看工具详情
node bin/toolbox.js add <id>        # 新建工具骨架
node bin/toolbox.js index           # 生成派生索引缓存（.toolbox/index.json）
node bin/toolbox.js export          # 列出可用目标格式
node bin/toolbox.js export <目标>    # 导出为目标 agent 格式，如 claude-code / codex
```

或 `npm run validate` / `npm run check`。

## 可移植层（adapter）

一份 Markdown 源 → 多个 agent 的格式，adapter 可插拔：

| 目标 | 命令 | 输出 |
|------|------|------|
| Claude Code | `export claude-code` | `dist/claude-code/<id>/SKILL.md` |
| Codex CLI | `export codex` | `dist/codex/<id>/SKILL.md` |

新增 adapter：在 `lib/adapters/` 加一个模块（导出 `name` + `convert(tool) -> { files }`），并在 `lib/adapters/index.js` 注册。

## 字段规范

见 `spec/SCHEMA.md`。
