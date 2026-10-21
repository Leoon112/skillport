# 数据规范（SCHEMA v2）

一个工具 = 一个 Markdown 文件，位于 `tools/`。文件开头是 YAML frontmatter，之后是正文（用法说明、示例）。

## 核心原则

1. **稳定 id 优先**：`id` 是唯一引用锚点，在 frontmatter 里显式声明，不依赖文件名。重命名文件、移动分类不改变 id。
2. **declared ≠ verified**：frontmatter 只是文档声明；`validate` 查格式，`check` 查实际可用性。真实状态由 `trust` 字段承载。
3. **数据规范先行**：Markdown 是唯一权威数据源；索引/缓存从它派生，不能反过来成为第二数据源。

## 字段定义

### 必填（validate 不通过即报错）

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | string（kebab-case） | 唯一 id，全局不得重复 | `website-audit` |
| `name` | string | 显示名 | `Website Audit` |
| `description` | string | 一句话说明，供搜索匹配 | `检查网站上线前漏洞、运行错误与质量` |
| `version` | string（semver） | 语义化版本 | `1.0.0` |

### 可选（有默认值）

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `category` | enum | `misc` | 见下方分类枚举 |
| `tags` | string[] | `[]` | 标签 |
| `aliases` | string[] | `[]` | 别名，搜索可命中 |
| `installed` | boolean | `true` | 是否已安装 |
| `path` | string | — | 工具脚本路径（相对项目根） |
| `deps` | string[] | `[]` | 依赖声明，如 `["node>=18", "playwright"]` |
| `trust` | enum | `declared` | 见下方 trust 分级 |

### 可移植层字段（第二阶段，AI 调用工具所需，已实现）

| 字段 | 类型 | 说明 |
|------|------|------|
| `command` | string | 调用入口，如 `node tools/scripts/x.js` 或 `npx playwright` |
| `args` | string[] | 默认参数，如 `["--format", "json"]` |
| `inputs` | object[] | 输入参数 schema（见下方子字段） |
| `permissions` | string[] | 权限声明，枚举：`network` / `file-read` / `file-write` / `exec` |

`inputs` 每项子字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 参数名 |
| `type` | string | 否 | 枚举：`string` / `number` / `boolean` |
| `description` | string | 否 | 参数说明 |
| `required` | boolean | 否 | 是否必填，默认 false |

示例：

```yaml
command: node tools/scripts/website-audit.js
args: [--format, json]
inputs:
  - name: url
    type: string
    description: 要审计的网址
    required: true
permissions: [network, file-read]
```

AI 层调用约定：`command` + 按 `inputs` 填充的参数 + `args` 默认参数，组成最终执行命令；调用前先检查 `permissions` 是否被授权。

## 类型与枚举规范

- **boolean 只能写 `true` / `false`**，禁止 `yes` / `no` / `1` / `0`
- **category 枚举**：`dev`（开发）、`security`（安全）、`productivity`（效率）、`data`（数据）、`media`（媒体）、`docs`（文档）、`web`（网络）、`misc`（其他）
- **trust 分级**：
  - `declared`：仅文档声称，未验证（新建默认）
  - `static`：`validate` 格式通过 + `check` 静态检查通过（路径存在、依赖可检测、命令格式有效）
  - `verified`：已在隔离环境真实执行过一次且通过（由用户/CI 标记）

## id 规则

- 小写 kebab-case：`[a-z0-9]+(-[a-z0-9]+)*`
- 全局唯一，validate 检查重复
- 一旦分配，不随文件名/分类变更而变

## 无效数据与重复的处理

- 缺必填字段 → validate 报 error
- 类型错误（如 `installed: yes`）→ validate 报 error
- 重复 id → validate 报 error（列出文件名 + 重复 id）
- 未知 category / trust 枚举值 → validate 报 error
- `path` 指向不存在的文件 → check 报 error（validate 只查格式，不查文件）

## 依赖表示法

`deps` 每个条目形如 `<名称>[<比较符><版本>]`，例如 `node>=18`、`playwright`（仅存在性检测）、`python>=3.9`。

`check` 只做安全的只读检测（`--version` 类只读命令），**绝不执行工具本体**；真实执行须在隔离环境 + 用户授权下进行。
