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
echo '{"decision": "approve", "reason": "Hook executed"}'
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

### 方法二：Prompt Hook（实验性）

**注意**：Prompt Hook 需要 LLM 返回**纯 JSON**，不能有任何其他文字。如果 LLM 返回的内容不是有效 JSON，会触发 `JSON validation failed` 错误。

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if docs need updates. IMPORTANT: Return ONLY valid JSON, no other text. Format: {\"decision\":\"approve\"} or {\"decision\":\"block\",\"reason\":\"Run /update-memory\"}",
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

| 字段 | 值 | 说明 |
|------|-----|------|
| `decision` | `"approve"` | 允许会话结束 |
| `decision` | `"block"` | 阻止会话结束，AI 收到 reason 并继续 |
| `reason` | 字符串 | 给 AI 的指令（仅 block 时有效） |

---

## 常见问题

### JSON validation failed

**原因**：Prompt Hook 的 LLM 响应不是纯 JSON

**解决方案**：
1. 使用 Command Hook 代替 Prompt Hook
2. 或在 prompt 中强调 "Return ONLY valid JSON, no other text"

---

*此 Hook 配合 `persistent-context` SKILL 和 `memory-loading` Rule 使用*
