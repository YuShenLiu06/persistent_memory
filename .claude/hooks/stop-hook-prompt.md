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
            "prompt": "根据是否主动更新文档(执行/persistent-context)了评判此轮会话是否应该结束，概论对话状况如下: $ARGUMENTS. 如果有设计函数类型，参数，方法，新增函数、功能等内容没有被即使更新至文档，分析过后判断是否能退出，回复以下json内容\"{\\\"ok\\\": false|true, \\\"reason\\\": \\\"your explanation\\\"}\"false或者true由你自行判断是否文档处于最新状态能否结束对话来决定。这里提供一个例子{\\\"ok\\\": true, \\\"reason\\\": \\\"文档已经最新\\\"} 不要回复以外的任何词语，同时也不要解释"
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
            "prompt": "根据是否主动更新文档(执行/persistent-context)了评判此轮会话是否应该结束，概论对话状况如下: $ARGUMENTS. 如果有设计函数类型，参数，方法，新增函数、功能等内容没有被即使更新至文档，分析过后判断是否能退出，回复以下json内容\"{\\\"ok\\\": false|true, \\\"reason\\\": \\\"your explanation\\\"}\"false或者true由你自行判断是否文档处于最新状态能否结束对话来决定。这里提供一个例子{\\\"ok\\\": true, \\\"reason\\\": \\\"文档已经最新\\\"} 不要回复以外的任何词语，同时也不要解释"
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

```json
{
  "ok": true | false,
  "reason": "解释原因（当 ok 为 false 时必须提供）"
}
```

| 字段 | 类型 | 描述 |
|------|------|------|
| `ok` | boolean | `true` 允许结束会话，`false` 阻止结束 |
| `reason` | string | 当 `ok` 为 `false` 时**必须**提供，向 Claude 显示的解释 |

**正确示例**：
```json
{"ok": true}
{"ok": false, "reason": "请先执行 /persistent-context 更新文档"}
```

**错误示例**（不会生效）：
```json
{"decision": "approve"}
{"ok": "yes"}
```

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
│     └── 是否有未记录的架构决策？                     │
│         │                                          │
│         ▼                                          │
│  4. 返回判断结果：                                   │
│     ├── {"ok": true} → 允许结束                     │
│     └── {"ok": false, "reason": "..."} → 阻止结束   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 常见问题

### 会话无法结束？

**原因**：Hook 检测到会话中有未记录的变更

**解决方案**：
1. 执行 `/persistent-context` 更新文档
2. 然后再次尝试结束会话

### Schema validation failed: expected boolean, received undefined

**原因**：LLM 返回的 JSON 中 `ok` 字段缺失或类型错误

**解决方案**：
1. 确保 prompt 中明确要求返回 `{"ok": true}` 或 `{"ok": false, "reason": "..."}`
2. 强调 `ok` 必须是 boolean 类型（不是字符串）

### JSON validation failed

**原因**：Prompt Hook 的 LLM 响应不是纯 JSON

**解决方案**：
1. 在 prompt 中强调 "Return ONLY valid JSON, no other text"
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

*最后更新: 2026-03-04*
