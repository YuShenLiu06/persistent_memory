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

## 项目结构概览

```
persistent_memory/
├── CLAUDE.md              # 主记忆文件（本文件）
├── Docs/                  # 详细文档目录
│   ├── implementation-plan.md    # 实现方案文档
│   ├── implementation-analysis.md # 实现分析文档
│   ├── claude-code-architecture.md # Claude Code 架构参考
│   ├── 简要.canvas        # 项目规划画布
│   └── .obsidian/         # Obsidian 配置（禁止修改）
└── .claude/               # Claude Code 配置（可部署到 ~/.claude/）
    ├── settings.local.json
    ├── skills/
    │   └── persistent-context/    # 核心 SKILL
    │       ├── SKILL.md           # 文档更新工作流程
    │       ├── README.md          # 使用说明
    │       └── templates/         # 文档模板
    │           ├── claude-md.template.md
    │           ├── api-doc.template.md
    │           └── module-doc.template.md
    ├── rules/
    │   └── memory-loading.md      # 强制加载规则
    └── hooks/
        └── stop-hook-prompt.md    # 会话结束提醒（可选）
```

---

## 技术文档索引

### 设计文档
| 文档 | 路径 | 说明 |
|------|------|------|
| 实现方案 | `Docs/implementation-plan.md` | 项目实现方案总结 |
| 实现分析 | `Docs/implementation-analysis.md` | 多种实现方法利弊分析 |
| 架构参考 | `Docs/claude-code-architecture.md` | Claude Code 记忆系统架构 |

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

---

## 当前任务状态

**已完成**：核心 SKILL、Rules、Hooks 实现完成

**可部署**：
```bash
cp -r .claude/skills/persistent-context ~/.claude/skills/
cp .claude/rules/memory-loading.md ~/.claude/rules/
```

**待验证**：
- [ ] 新会话验证 CLAUDE.md 自动加载
- [ ] 手动执行 `/update-memory` 验证工作流程

---

*最后更新: 2026-03-04*
