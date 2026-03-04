#!/bin/bash
# Stop Hook - 检查是否需要更新项目文档
# 读取 hook 输入
INPUT=$(cat)

# 提取会话信息
STOP_REASON=$(echo "$INPUT" | jq -r '.stop_reason // "unknown"')

# 检查是否有需要记录的变更
# 这里可以添加更复杂的逻辑，目前简单返回 approve
echo '{"decision": "approve", "reason": "Hook executed successfully"}'
exit 0
