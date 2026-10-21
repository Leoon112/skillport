# skillport

跨 agent 技能/工具可移植层：一份 Markdown 源，转成 Claude Code / Codex / 其他 agent 各自的技能格式。

**定位**：不是又一个工具管理器（那种已经很多），而是让同一份技能在多个 agent 之间复用、不锁 vendor、本地优先。

## 分层

- **数据层**：一个工具 = 一份 Markdown（frontmatter + 正文），字段规范见 `spec/SCHEMA.md`，每个工具有稳定 `id`
- **管理层**：`toolbox` CLI —— 校验（validate）、可用性检查（check）、搜索、索引生成
- **AI 接入层（第二阶段）**：工具检索 + 调用说明 + 权限检查 + 执行结果反馈；把 Markdown 源转成各 agent 格式

## 当前状态（第一阶段）

只实现数据规范 + `validate` + `check`。**未实现** adapter/转换器、语义搜索、数据库——这些是第二阶段。

## 用法

```bash
node bin/toolbox.js validate      # 校验元数据格式与规范
node bin/toolbox.js check         # 静态检查文件/依赖可用性（绝不执行脚本）
node bin/toolbox.js list          # 列出所有工具
node bin/toolbox.js search <词>    # 关键词搜索
node bin/toolbox.js show <id>     # 查看工具详情
```

或 `npm run validate` / `npm run check`。

## 字段规范

见 `spec/SCHEMA.md`。
