# Stop Hook - 会话结束提醒

> 此 Hook 在会话结束时检查是否需要更新项目文档。

---

## 配置说明

### 当前使用的配置

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "根据是否主动更新文档(执行/persistent-context)了评判此轮会话是否应该结束，概论对话状况如下: $ARGUMENTS. 如果有设计函数类型，参数，方法、用户偏好、项目偏好、新增函数、功能等内容没有被即使更新至文档，分析过后判断是否能退出，如果可以退出回复以下json内容\"{\\\"ok\\\": true, \\\"reason\\\": \\\"文档已经最新\\\"}\"如果需要更新的话回复\"{\\\"ok\\\": false, \\\"reason\\\": \\\"/persistent-context <需要更新的部分>\\\"}\"不要回复以外的任何词语，同时也不要解释"
          }
        ]
      }
    ]
  }
}
```

### 配置位置

项目级：`.claude/settings.local.json`

---

## 安装方法

### 方法一：使用安装脚本（推荐）

```bash
# 运行安装脚本
node scripts/install-hook.js

# 预览更改
node scripts/install-hook.js --dry-run

# 强制重新安装
node scripts/install-hook.js --force
```

### 方法二：手动配置

将以下内容添加到 `.claude/settings.local.json`：

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "根据是否主动更新文档(执行/persistent-context)了评判此轮会话是否应该结束，概论对话状况如下: $ARGUMENTS. 如果有设计函数类型，参数，方法、用户偏好、项目偏好、新增函数、功能等内容没有被即使更新至文档，分析过后判断是否能退出，如果可以退出回复以下json内容\"{\\\"ok\\\": true, \\\"reason\\\": \\\"文档已经最新\\\"}\"如果需要更新的话回复\"{\\\"ok\\\": false, \\\"reason\\\": \\\"/persistent-context <需要更新的部分>\\\"}\"不要回复以外的任何词语，同时也不要解释"
          }
        ]
      }
    ]
  }
}
```

---

## 响应格式

Prompt Hook 必须返回纯 JSON 格式，使用 `ok` 字段（boolean 类型）：

**可以退出会话**：
```json
{"ok": true, "reason": "文档已经最新"}
```

**需要更新文档**：
```json
{"ok": false, "reason": "/persistent-context <需要更新的部分>"}
```

| 字段 | 类型 | 描述 |
|------|------|------|
| `ok` | boolean | `true` 允许结束会话，`false` 阻止结束 |
| `reason` | string | 解释原因；`ok` 为 `false` 时包含需要执行的命令 |

---

## 检查项目

Hook 会检查以下内容是否已更新到文档：

| 检查项 | 说明 |
|--------|------|
| 函数类型 | 新增或修改的函数类型定义 |
| 参数 | 函数/方法的参数变化 |
| 方法 | 新增或修改的方法 |
| 用户偏好 | 用户表达的使用偏好 |
| 项目偏好 | 项目级别的配置偏好 |
| 新增函数 | 新添加的函数 |
| 功能 | 新增或修改的功能 |

---

## 工作原理

```
┌─────────────────────────────────────────────────────┐
│              Stop Hook 工作流程                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. 用户请求结束会话                                 │
│         │                                          │
│         ▼                                          │
│  2. Hook 触发，传入会话摘要 ($ARGUMENTS)             │
│         │                                          │
│         ▼                                          │
│  3. LLM 分析会话内容：                               │
│     ├── 是否执行了 /persistent-context？            │
│     ├── 是否有未记录的函数/方法变更？                │
│     ├── 是否有未记录的用户/项目偏好？                │
│     └── 是否有未记录的架构决策？                     │
│         │                                          │
│         ▼                                          │
│  4. 返回判断结果：                                   │
│     ├── {"ok": true, "reason": "文档已经最新"}       │
│     └── {"ok": false, "reason": "/persistent-context │
│           <需要更新的部分>"}                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 常见问题

### 会话无法结束？

**原因**：Hook 检测到会话中有未记录的变更

**解决方案**：
1. 执行 Hook 提示的命令，如 `/persistent-context 用户偏好`
2. 然后再次尝试结束会话

### Schema validation failed: expected boolean, received undefined

**原因**：LLM 返回的 JSON 中 `ok` 字段缺失或类型错误

**解决方案**：
1. 确保 prompt 中明确要求返回 `{"ok": true}` 或 `{"ok": false, ...}`
2. 强调 `ok` 必须是 boolean 类型（不是字符串）

### JSON validation failed

**原因**：Prompt Hook 的 LLM 响应不是纯 JSON

**解决方案**：
1. 在 prompt 中强调 "不要回复以外的任何词语，同时也不要解释"
2. 检查 prompt 内容是否正确配置

---

## 与其他组件的配合

| 组件 | 类型 | 职责 |
|------|------|------|
| persistent-context | SKILL | 定义文档维护工作流程 |
| memory-loading | Rule | 强制加载 CLAUDE.md |
| stop-hook-prompt | Hook | 会话结束提醒更新（本文件）|

**配合方式**：
1. **Rule** 确保会话开始时加载 CLAUDE.md
2. **SKILL** 提供文档更新能力
3. **Hook** 确保会话结束前文档已更新

---

## 参考文档

- [Claude Code Hooks 参考](https://code.claude.com/docs/zh-CN/hooks)
- [安装脚本说明](../scripts/README.md)
- [SKILL 文档](../skills/persistent-context/SKILL.md)

---

*此 Hook 配合 `persistent-context` SKILL 和 `memory-loading` Rule 使用*

*最后更新: 2026-03-05*
