# Persistent Context Skill

> AI 自主维护项目记忆文件，实现跨会话知识持久化。

---

## 概述

此 SKILL 提供完整的文档维护工作流程，使 Claude Code 能够：

- 自动维护 CLAUDE.md 项目记忆文件
- 记录架构决策 (ADR)
- 维护技术文档索引
- 在会话结束时提醒更新

---

## 组件结构

```
persistent-context/
├── SKILL.md                    # 核心 SKILL 文件（必需）
├── README.md                   # 本说明文档
└── templates/                  # 文档模板
    ├── claude-md.template.md   # CLAUDE.md 模板
    ├── api-doc.template.md     # API 文档模板
    └── module-doc.template.md  # 模块文档模板
```

---

## 安装

### 1. 安装 SKILL

```bash
# 复制 SKILL 到 Claude Code 配置目录
cp -r .claude/skills/persistent-context ~/.claude/skills/
```

### 2. 安装 Rule (推荐)

```bash
# 复制强制加载规则
cp .claude/rules/memory-loading.md ~/.claude/rules/
```

### 3. 安装 Hook (可选)

```bash
# 复制会话结束提醒
cp .claude/hooks/stop-hook-prompt.md ~/.claude/hooks/

# 然后手动配置 settings.json (参见 Hook 文件内容)
```

---

## 使用方式

### 自动触发

当 AI 识别到以下情况时，会自动使用此 SKILL：

- 需要更新 CLAUDE.md
- 需要记录架构决策
- 需要维护文档索引

### 手动触发

用户可以使用以下命令：

| 命令 | 说明 |
|------|------|
| `/update-memory` | 手动触发文档更新检查 |
| `/record-refactor` | 记录大型重构变更 |

---

## CLAUDE.md 结构

SKILL 维护的 CLAUDE.md 包含以下标准章节：

1. **约束条件/禁止项** - 项目限制
2. **项目偏好** - 技术偏好和规范
3. **用户偏好** - 用户个人偏好
4. **常用工具/指令** - 项目特定命令
5. **项目结构概览** - 目录结构
6. **技术文档索引** - 文档导航
7. **架构决策记录** - ADR 列表
8. **当前任务状态** - 进行中的工作

---

## 架构决策记录 (ADR)

### ADR 格式

```markdown
### ADR-{序号}: {决策标题}
- **日期**: {YYYY-MM-DD}
- **状态**: {提议/已接受/已废弃/已取代}
- **决策**: {决策内容简述}
- **原因**: {为什么做出这个决策}
```

### 创建 ADR 时机

- 选择特定技术栈
- 确定架构模式
- 做出重要权衡决策
- 改变既有决策

---

## 文档模板

### 使用模板

1. 从 `templates/` 目录复制模板
2. 根据项目实际情况填写
3. 放置到项目相应位置

### 可用模板

| 模板 | 用途 |
|------|------|
| `claude-md.template.md` | 创建新的 CLAUDE.md |
| `api-doc.template.md` | 创建 API 文档 |
| `module-doc.template.md` | 创建模块文档 |

---

## 增量更新策略

SKILL 默认使用增量更新策略：

1. **最小改动** - 只修改必要的部分
2. **保持结构** - 不改变文档整体格式
3. **追加优先** - 新内容追加到对应章节末尾
4. **时间戳更新** - 每次更新修改最后更新时间

---

## 最佳实践

### ✅ 推荐

- 每次重要变更后更新 CLAUDE.md
- 为架构决策创建 ADR
- 保持文档索引与实际文件同步
- 使用增量更新而非重写

### ❌ 避免

- 在 CLAUDE.md 中存储敏感信息
- 频繁重写整个文档
- 忽略文档索引的维护
- 忘记更新时间戳

---

## 与其他组件的关系

| 组件 | 类型 | 职责 |
|------|------|------|
| persistent-context | SKILL | 维护工作流程（本文件）|
| memory-loading | Rule | 强制加载 CLAUDE.md |
| stop-hook-prompt | Hook | 会话结束提醒 |

---

## 示例项目结构

```
my-project/
├── CLAUDE.md                    # 主记忆文件
├── Docs/
│   ├── index/
│   │   ├── _tree.json          # 结构化索引
│   │   └── index.md            # 可读索引
│   ├── api/
│   │   └── rest-api.md
│   └── architecture/
│       └── system-design.md
└── src/
    └── ...
```

---

## 故障排除

### Q: CLAUDE.md 没有自动加载？

确保已安装 `memory-loading.md` Rule 到 `~/.claude/rules/`。

### Q: 会话结束没有提醒？

Hook 需要手动配置到 `settings.json`，参见 `stop-hook-prompt.md`。

### Q: 如何手动更新文档？

使用 `/update-memory` 命令手动触发更新检查。

---

*版本: 1.0.0*
*最后更新: 2026-03-04*
