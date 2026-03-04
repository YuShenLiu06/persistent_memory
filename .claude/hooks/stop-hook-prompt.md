# Stop Hook - 会话结束提醒

> 此 Hook 在会话结束时检查是否需要更新项目文档。

---

## 项目级安装

### 方法一：Command Hook（推荐，稳定）

**1. 创建脚本文件** `.claude/hooks/stop-hook.sh`：

```bash
#!/bin/bash
# Stop Hook - 检查是否需要更新项目文档
INPUT=$(cat)
STOP_REASON=$(echo "$INPUT" | jq -r '.stop_reason // "unknown"')

# 检查是否有需要记录的变更
# 可以添加更复杂的逻辑
echo '{"ok": true}'
exit 0
```

**2. 配置** `.claude/settings.local.json`：

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/stop-hook.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

### 方法二：Prompt Hook

**注意**：Prompt Hook 需要 LLM 返回**纯 JSON**，不能有任何其他文字。响应格式必须使用 `ok` 字段（boolean 类型）。

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "You are evaluating whether Claude should stop working. Context: $ARGUMENTS\n\nAnalyze the conversation and determine if:\n1. New architecture decisions (ADR) were made but not recorded in CLAUDE.md\n2. Significant code changes occurred that affect project structure\n3. Task status changed but CLAUDE.md was not updated\n4. New technical docs were created that should be indexed\n\nRespond with JSON: {\"ok\": true} to allow stopping, or {\"ok\": false, \"reason\": \"your explanation\"} to continue working.\n\nIMPORTANT: Return ONLY valid JSON - no markdown, no explanation, no code blocks.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

---

## 响应格式

**Prompt Hook 必须使用 `ok` 字段**（boolean 类型）：

```json
{
  "ok": true | false,
  "reason": "Explanation for the decision"
}
```

| 字段 | 类型 | 描述 |
|------|------|------|
| `ok` | boolean | `true` 允许操作，`false` 阻止操作 |
| `reason` | string | 当 `ok` 为 `false` 时**必须**提供。向 Claude 显示的解释 |

**正确示例**：
```json
{"ok": true}
{"ok": false, "reason": "Run /persistent-context to update docs"}
```

**错误示例**（不会生效）：
```json
{"decision": "approve"}
{"decision": "block", "reason": "..."}
```

---

## 常见问题

### Schema validation failed: expected boolean, received undefined

**原因**：LLM 返回的 JSON 中 `ok` 字段缺失或类型错误

**解决方案**：
1. 确保 prompt 中明确要求返回 `{"ok": true}` 或 `{"ok": false, "reason": "..."}`
2. 强调 `ok` 必须是 boolean 类型（不是字符串）
3. 使用 Command Hook 代替 Prompt Hook（更可控）

### JSON validation failed

**原因**：Prompt Hook 的 LLM 响应不是纯 JSON

**解决方案**：
1. 在 prompt 中强调 "Return ONLY valid JSON, no other text"
2. 使用 Command Hook 代替 Prompt Hook

---

## 参考文档

- [Claude Code Hooks 参考](https://code.claude.com/docs/zh-CN/hooks)
- 官方文档第 1579-1591 行确认 Prompt Hook 响应格式

---

*此 Hook 配合 `persistent-context` SKILL 和 `memory-loading` Rule 使用*
