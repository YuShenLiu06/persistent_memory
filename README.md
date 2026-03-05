# Persistent Memory

> Claude Code 持久上下文系统 - 让 AI 跨会话记忆项目知识

---

## 概述

Persistent Memory 是一个 Claude Code 插件，提供完整的持久上下文解决方案。通过 SKILL、Rules、Hooks 三层架构，使 AI 能够自主维护 `CLAUDE.md` 文件，实现跨会话的知识持久化。

### 核心特性

- **自动记忆维护** - AI 自主更新项目记忆文件，无需手动干预
- **架构决策记录** - 自动记录和追踪重要的技术决策 (ADR)
- **文档索引管理** - 维护技术文档的双格式索引 (JSON + Markdown)
- **增量更新策略** - 只修改变更部分，保持文档一致性
- **跨平台兼容** - 支持 Windows、macOS、Linux

---

## 快速开始

### 前置要求

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 已安装
- 项目根目录存在 `CLAUDE.md` 文件

### 安装

#### 1. 安装 SKILL（核心组件）

```bash
# 复制 SKILL 到 Claude Code 配置目录
cp -r .claude/skills/persistent-context ~/.claude/skills/
cp -r .claude/skills/doc-navigation ~/.claude/skills/
```

#### 2. 安装 Rule（推荐）

```bash
# 复制强制加载规则
cp .claude/rules/memory-loading.md ~/.claude/rules/
```

#### 3. 安装 Hook（可选）

```bash
# 使用安装脚本自动配置
node scripts/install-hook.js
```

或手动配置 `~/.claude/settings.json`，详见 [Hook 配置文档](Docs/hook.md)。

### 验证安装

重启 Claude Code 后，新会话应自动加载项目 `CLAUDE.md` 文件。

---

## 使用方法

### 自动触发

当 AI 识别到以下情况时，会自动使用此系统：

- 需要更新 `CLAUDE.md` 项目记忆
- 需要记录架构决策
- 需要维护文档索引

### 使用示例

```bash
# 更新项目记忆
> /update-memory

# 记录重构
> /record-refactor
这次重构将数据库从 MySQL 迁移到 PostgreSQL
```

---

## 架构说明

系统采用三层架构设计，由三个核心组件协作：

```
┌─────────────────────────────────────────────────────┐
│                    架构层次                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐                                   │
│  │   Hook      │  会话结束时提醒更新                │
│  │  (可选)     │  → 触发 SKILL 执行                 │
│  └──────┬──────┘                                   │
│         │                                          │
│  ┌──────▼──────┐                                   │
│  │   Rule      │  强制加载 CLAUDE.md               │
│  │  (推荐)     │  → 确保上下文可用                  │
│  └──────┬──────┘                                   │
│         │                                          │
│  ┌──────▼──────┐                                   │
│  │   SKILLs    │  定义维护和导航工作流程            │
│  │  (必需)     │  → 核心功能实现                    │
│  └─────────────┘                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 三组件协作关系

```
会话开始 → memory-loading (Rule) 加载 CLAUDE.md
     ↓
查找文档 → doc-navigation (SKILL) 使用索引定位
     ↓
更新文档 → persistent-context (SKILL) 维护索引
```

### 组件职责

| 组件 | 类型 | 职责 | 必需性 |
|------|------|------|--------|
| persistent-context | SKILL | 文档维护和更新工作流程 | 必需 |
| doc-navigation | SKILL | 文档查找和导航流程 | 必需 |
| memory-loading | Rule | 强制加载 CLAUDE.md | 推荐 |
| stop-hook-prompt | Hook | 会话结束提醒更新 | 可选 |

### 设计理念

- **职责分离** - persistent-context 负责维护，doc-navigation 负责查找
- **SKILL 自包含** - 即使没有 Hook，SKILL 也能完整工作
- **Hook 为辅助** - 仅用于提醒，不依赖其执行逻辑
- **增量更新** - 只修改变更部分，避免重写整个文件

---

## 文件结构

```
persistent_memory/
├── CLAUDE.md                          # 主记忆文件
├── Docs/                              # 详细文档目录
│   ├── index/                         # 文档索引目录
│   │   ├── _tree.json                 # 索引结构数据 (机器可读)
│   │   └── index.md                   # 文档导航索引 (人类可读)
│   ├── api/                           # API 文档目录
│   ├── module/                        # 模块文档目录
│   ├── implementation-plan.md         # 实现方案
│   ├── implementation-analysis.md     # 实现分析
│   ├── claude-code-architecture.md    # 架构参考
│   └── hook.md                        # Hook 配置文档
│
├── scripts/                           # 安装和维护脚本
│   ├── install-hook.js                # Stop Hook 安装脚本
│   └── README.md                      # 脚本使用说明
│
└── .claude/                           # Claude Code 配置
    ├── settings.local.json            # 本地设置
    │
    ├── skills/
    │   ├── persistent-context/        # 文档维护 SKILL
    │   │   ├── SKILL.md               # SKILL 定义
    │   │   ├── README.md              # SKILL 说明
    │   │   └── templates/             # 文档模板
    │   │       ├── claude-md.template.md  # CLAUDE.md 模板
    │   │       ├── api-doc.template.md    # API 文档模板
    │   │       └── module-doc.template.md # 模块文档模板
    │   │
    │   └── doc-navigation/            # 文档导航 SKILL
    │       └── SKILL.md               # 文档查找和导航流程
    │
    ├── rules/memory-loading.md        # 强制加载规则
    │
    └── hooks/stop-hook-prompt.md      # Stop Hook 配置
```

---

## CLAUDE.md 结构

SKILL 维护的 `CLAUDE.md` 包含以下标准章节：

| 章节 | 说明 | 优先级 |
|------|------|--------|
| 约束条件/禁止项 | 项目限制和安全规则 | 最高 |
| 项目偏好 | 技术栈和编码规范 | 高 |
| 用户偏好 | 个人偏好设置 | 高 |
| 常用工具/指令 | 项目特定命令 | 中 |
| 项目结构概览 | 目录结构说明 | 中 |
| 技术文档索引 | 文档导航链接 | 中 |
| 架构决策记录 (ADR) | 重要决策记录 | 高 |
| 当前任务状态 | 进行中的工作 | 高 |

---

## 架构决策记录 (ADR)

系统自动维护架构决策记录，格式如下：

```markdown
### ADR-001: 选择 SKILL + 可选 Hook 架构
- **日期**: 2026-03-04
- **决策**: 采用 SKILL 为核心、Hook 为辅助的架构
- **原因**:
  - SKILL 自包含，无 Hook 也能工作
  - 兼容所有 Agent
  - 简化实现复杂度
```

### 创建 ADR 时机

- 选择特定技术栈
- 确定架构模式
- 做出重要权衡决策
- 改变既有决策

---

## 文档模板

项目提供三种文档模板：

| 模板 | 用途 |
|------|------|
| `claude-md.template.md` | 创建新的项目记忆文件 |
| `api-doc.template.md` | 创建 API 文档 |
| `module-doc.template.md` | 创建模块文档 |

使用方法：复制模板到目标位置，根据实际情况填写。

---

## 文档索引系统

项目使用双格式索引系统，位于 `Docs/index/` 目录：

| 文件 | 格式 | 用途 |
|------|------|------|
| `_tree.json` | JSON | 机器可读的结构化索引 |
| `index.md` | Markdown | 人类可读的文档导航 |

### 索引分类

| 分类 | 路径 | 说明 |
|------|------|------|
| API 文档 | `Docs/api/` | 项目 API 接口文档 |
| 模块文档 | `Docs/module/` | 项目模块和组件文档 |
| 设计文档 | `Docs/` | 架构和设计决策文档 |
| SKILL 文档 | `.claude/skills/` | Claude Code SKILL 定义 |

### 索引维护

- 新增文档时，在 `_tree.json` 对应分类的 `documents` 数组中添加条目
- 同步更新 `index.md` 保持一致性
- 更新 `last_updated` 时间戳

---

## 最佳实践

### 推荐做法

- 每次重要变更后更新 `CLAUDE.md`
- 为架构决策创建 ADR
- 保持文档索引与实际文件同步
- 使用增量更新而非重写
- 更新时同步修改时间戳

### 避免事项

- 在 `CLAUDE.md` 中存储敏感信息
- 频繁重写整个文档
- 忽略文档索引的维护
- 忘记更新时间戳

---

## 故障排除

### CLAUDE.md 没有自动加载？

确保已安装 `memory-loading.md` Rule 到 `~/.claude/rules/`。

### 会话结束没有提醒？

Hook 需要手动配置到 `~/.claude/settings.json`，参见 [Hook 配置文档](Docs/hook.md)。

### 如何手动更新文档？

使用 `/update-memory` 命令手动触发更新检查。

### Prompt Hook 返回格式错误？

确保 LLM 返回纯 JSON 格式：
```json
{"ok": true}
{"ok": false, "reason": "解释原因"}
```

---

## 技术文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 实现方案 | `Docs/implementation-plan.md` | 项目实现方案总结 |
| 实现分析 | `Docs/implementation-analysis.md` | 多种实现方法利弊分析 |
| 架构参考 | `Docs/claude-code-architecture.md` | Claude Code 记忆系统架构 |
| Hook 配置 | `Docs/hook.md` | Stop Hook 详细配置 |

---

## 贡献指南

### 代码规范

- 文档使用 Markdown 格式
- 命名使用蛇形命名法 (snake_case)
- 注释使用中文

### 提交规范

使用约定式提交格式：

```
<type>: <description>

[optional body]
```

类型：`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

### 开发流程

1. Fork 本仓库
2. 创建特性分支
3. 进行修改
4. 提交 Pull Request

---

## 未来计划 (Roadmap)

- [ ] **向量 RAG 知识库** - 集成向量检索，实现功能描述到函数名的语义搜索
- [ ] **优化递归搜索** - 改进文档查找算法，提升大型项目检索效率

---

## 许可证

MIT License

---

## 相关链接

- [Claude Code 文档](https://docs.anthropic.com/en/docs/claude-code)
- [Claude Code Hooks 参考](https://code.claude.com/docs/zh-CN/hooks)

---

*版本: 1.0.0*
*最后更新: 2026-03-04*
