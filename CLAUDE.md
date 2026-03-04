# 持久上下文系统 (Persistent Memory)

> 此项目旨在创建一个可复用的持久上下文系统模板，使 AI 能够自主维护 CLAUDE.md 文件。

---

## 约束条件/禁止项

- **禁止**超出项目目录进行文件更改
- **禁止**修改 `.obsidian/` 目录下的配置文件
- **必须**遵循树状目录结构，保证可视性良好
- **必须**使用增量更新策略维护文档

---

## 项目偏好

- 文档格式：Markdown
- 索引存储：JSON + Markdown 双格式
- 更新策略：增量更新
- 命名规范：蛇形命名法 (snake_case)

---

## 用户偏好

- 文档注释使用中文
- 代码注释根据项目语言决定
- 优先使用简洁的表述

---

## 常用工具/指令

| 命令 | 说明 |
|------|------|
| `/update-memory` | 手动触发文档更新 |
| `/record-refactor` | 记录大型重构变更 |

---

## 常用模块/API

> 详细文档索引见 [Docs/index/index.md](Docs/index/index.md)

### 核心 SKILL 组件

| SKILL | 路径 | 说明 |
|-------|------|------|
| persistent-context | `.claude/skills/persistent-context/SKILL.md` | 文档维护和更新工作流程 |
| doc-navigation | `.claude/skills/doc-navigation/SKILL.md` | 文档查找和导航流程 |

### 文档模板

| 模板 | 路径 | 用途 |
|------|------|------|
| CLAUDE.md | `.claude/skills/persistent-context/templates/claude-md.template.md` | 主记忆文件模板 |
| API 文档 | `.claude/skills/persistent-context/templates/api-doc.template.md` | API 接口文档模板 |
| 模块文档 | `.claude/skills/persistent-context/templates/module-doc.template.md` | 模块/组件文档模板 |

### 安装脚本

| 脚本 | 路径 | 说明 |
|------|------|------|
| Hook 安装 | `scripts/install-hook.js` | Stop Hook 安装脚本 |

---

## 项目结构概览

```
persistent_memory/
├── CLAUDE.md              # 主记忆文件（本文件）
├── README.md              # 项目主文档
├── Docs/                  # 详细文档目录
│   ├── index/             # 文档索引目录
│   │   ├── _tree.json     # 索引结构数据
│   │   └── index.md       # 文档导航索引
│   ├── api/               # API 文档目录
│   ├── module/            # 模块文档目录
│   ├── implementation-plan.md    # 实现方案文档
│   ├── implementation-analysis.md # 实现分析文档
│   ├── claude-code-architecture.md # Claude Code 架构参考
│   ├── hook.md            # Hook 配置参考
│   ├── 简要.canvas        # 项目规划画布
│   └── .obsidian/         # Obsidian 配置（禁止修改）
├── scripts/               # 安装和维护脚本
│   ├── install-hook.js    # Stop Hook 安装脚本
│   └── README.md          # 脚本使用说明
└── .claude/               # Claude Code 配置（可部署到 ~/.claude/）
    ├── settings.local.json
    ├── skills/
    │   ├── persistent-context/    # 文档维护 SKILL
    │   │   ├── SKILL.md           # 文档更新工作流程
    │   │   ├── README.md          # 使用说明
    │   │   └── templates/         # 文档模板
    │   │       ├── claude-md.template.md
    │   │       ├── api-doc.template.md
    │   │       └── module-doc.template.md
    │   └── doc-navigation/        # 文档导航 SKILL
    │       └── SKILL.md           # 文档查找和导航流程
    ├── rules/
    │   └── memory-loading.md      # 强制加载规则
    └── hooks/
        └── stop-hook-prompt.md    # Hook 文档说明
```

---

## 技术文档索引

> **快速导航**: [Docs/index/index.md](Docs/index/index.md) - 完整文档索引

### 项目文档
| 文档 | 路径 | 说明 |
|------|------|------|
| 项目 README | `README.md` | 项目概述、安装、使用指南 |
| 脚本说明 | `scripts/README.md` | 安装脚本使用说明 |

### 设计文档
| 文档 | 路径 | 说明 |
|------|------|------|
| 实现方案 | `Docs/implementation-plan.md` | 项目实现方案总结 |
| 实现分析 | `Docs/implementation-analysis.md` | 多种实现方法利弊分析 |
| 架构参考 | `Docs/claude-code-architecture.md` | Claude Code 记忆系统架构 |
| Hook 配置 | `Docs/hook.md` | Stop Hook 详细配置参考 |

### 规划文档
| 文档 | 路径 | 说明 |
|------|------|------|
| 项目规划 | `Docs/简要.canvas` | Canvas 格式的项目规划图 |

---

## 架构决策记录

### ADR-001: 选择 SKILL + 可选 Hook 架构
- **日期**: 2026-03-04
- **决策**: 采用 SKILL 为核心、Hook 为辅助的架构
- **原因**:
  - SKILL 自包含，无 Hook 也能工作
  - 兼容所有 Agent（Hook 不是所有 Agent 都支持）
  - 简化实现复杂度

### ADR-002: 使用 Prompt 类型 Hook
- **日期**: 2026-03-04
- **决策**: Hook 使用 `type: "prompt"` 而非命令脚本
- **原因**:
  - 更好的跨平台兼容性
  - 提醒 AI 而非执行脚本，更灵活
  - 降低维护成本
- **响应格式**: `{"ok": true}` 或 `{"ok": false, "reason": "..."}`（注意：使用 `ok` 字段而非 `decision`）

### ADR-003: 大型重构由用户手动触发
- **日期**: 2026-03-04
- **决策**: 不自动检测大型重构，由用户手动触发记录
- **原因**:
  - 避免复杂的检测逻辑
  - 用户更清楚什么是"大型重构"
  - 减少误报和噪音

### ADR-004: 模板放置在 SKILL 子目录
- **日期**: 2026-03-04
- **决策**: 模板文件放在 `skills/persistent-context/templates/` 而非独立的 `templates/` 目录
- **原因**:
  - 模仿 `~/.claude/` 标准编排模式
  - SKILL 自包含，便于整体复制部署
  - 与 Claude Code 生态保持一致

### ADR-005: 不支持配置项，使用固定名称
- **日期**: 2026-03-04
- **决策**: 系统不提供配置项，使用固定的 `CLAUDE.md` 和 `Docs/` 名称
- **原因**:
  - 简化实现复杂度
  - 降低用户学习成本
  - 符合 Claude Code 社区惯例

### ADR-006: 使用 Node.js 安装脚本
- **日期**: 2026-03-04
- **决策**: 使用 Node.js 脚本 (`scripts/install-hook.js`) 安装 Stop Hook
- **原因**:
  - 跨平台兼容性（Windows/macOS/Linux）
  - 无需额外依赖（仅使用 Node.js 内置模块）
  - 支持预览模式和强制重装
  - 自动备份原有配置
- **替代方案**:
  - Shell 脚本：跨平台兼容性差
  - 手动配置：容易出错，不便于维护

### ADR-007: 创建 doc-navigation SKILL
- **日期**: 2026-03-04
- **决策**: 创建独立的 doc-navigation SKILL 用于文档查找和导航
- **原因**:
  - 职责分离：persistent-context 负责维护，doc-navigation 负责查找
  - 可复用性：其他项目可以单独使用文档导航功能
  - 遵循单一职责原则
- **协作关系**:
  - memory-loading (Rule): 会话开始时强制加载 CLAUDE.md
  - doc-navigation (SKILL): 通过索引查找和定位文档
  - persistent-context (SKILL): 维护和更新文档索引

---

## 当前任务状态

**已完成**：
- 核心 SKILL、Rules、Hooks 实现
  - `persistent-context`: 文档维护和更新
  - `doc-navigation`: 文档查找和导航
  - `memory-loading`: 强制加载 CLAUDE.md
- 项目 README.md 文档
- Stop Hook 安装脚本 (`scripts/install-hook.js`)
- 文档存储结构 (`Docs/api/`, `Docs/module/`, `Docs/index/`)
- 文档索引系统 (`_tree.json`, `index.md`)

**三组件协作关系**：
```
会话开始 → memory-loading (Rule) 加载 CLAUDE.md
     ↓
查找文档 → doc-navigation (SKILL) 使用索引定位
     ↓
更新文档 → persistent-context (SKILL) 维护索引
```

**可部署**：
```bash
# 安装 SKILL 和 Rule
cp -r .claude/skills/persistent-context ~/.claude/skills/
cp -r .claude/skills/doc-navigation ~/.claude/skills/
cp .claude/rules/memory-loading.md ~/.claude/rules/

# 安装 Stop Hook（可选）
node scripts/install-hook.js
```

**验证清单**：
- [x] 新会话验证 CLAUDE.md 自动加载 ✅ 2026-03-04
- [x] 手动执行 `/persistent-context` 验证工作流程 ✅ 2026-03-04
- [x] Stop Hook 工作正常 ✅ 2026-03-04
- [x] 安装脚本功能完整 ✅ 2026-03-04
- [x] doc-navigation SKILL 创建完成 ✅ 2026-03-04

---

*最后更新: 2026-03-04 (新增 doc-navigation SKILL，完善三组件协作架构)*
