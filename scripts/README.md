# 脚本使用说明

> 本目录包含 persistent-context 系统的安装和维护脚本。

---

## 目录

- [install-hook.js](#install-hookjs) - Stop Hook 安装脚本

---

## install-hook.js

### 功能

将 persistent-context stop hook 自动注入到 `.claude/settings.local.json` 配置文件中。

### 特性

- 跨平台支持
- 幂等性（可重复运行）
- 自动备份原有配置
- 预览模式
- 强制重新安装模式

### 使用方法

```bash
# 基本安装
node scripts/install-hook.js

# 预览更改（不修改文件）
node scripts/install-hook.js --dry-run

# 强制重新安装
node scripts/install-hook.js --force

# 显示详细信息
node scripts/install-hook.js --verbose

# 显示帮助
node scripts/install-hook.js --help
```

### 命令行选项

| 选项 | 说明 |
|------|------|
| `--dry-run` | 预览更改，不实际修改文件 |
| `--force` | 强制重新安装（即使已存在） |
| `--verbose` | 显示详细输出 |
| `-h, --help` | 显示帮助信息 |

### 安装后的 Hook 配置

脚本会在 `settings.local.json` 中添加以下配置：

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "根据是否主动更新文档(执行/persistent-context)了评判此轮会话是否应该结束，概论对话状况如下: $ARGUMENTS. 如果有设计函数类型，参数，方法，新增函数、功能等内容没有被即使更新至文档，那么此轮会话不能被结束，而是发起一轮/persistent-context SKILL"
          }
        ]
      }
    ]
  }
}
```

### Hook 响应格式

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

> **注意**: 使用 `ok` 字段而非 `decision`。`ok` 必须是 boolean 类型（`true`/`false`），不是字符串。

### 工作流程

```
┌─────────────────────────────────────────┐
│         install-hook.js 工作流程          │
├─────────────────────────────────────────┤
│                                         │
│  1. 查找 settings.local.json            │
│     ├── 存在 → 读取并解析                 │
│     └── 不存在 → 创建默认结构             │
│                                         │
│  2. 检查 hooks.Stop 数组                 │
│     ├── 不存在 → 创建空数组               │
│     └── 存在 → 继续检查                  │
│                                         │
│  3. 检查目标 hook 是否已存在              │
│     ├── 已存在 + 无 --force → 跳过       │
│     ├── 已存在 + --force → 移除旧的      │
│     └── 不存在 → 继续                    │
│                                         │
│  4. 预览模式检查 (--dry-run)              │
│     ├── 是 → 显示预览并退出              │
│     └── 否 → 继续                       │
│                                         │
│  5. 备份现有文件（如果存在）              │
│                                         │
│  6. 写入新配置                           │
│                                         │
└─────────────────────────────────────────┘
```

### 错误处理

脚本会处理以下错误情况：

1. **JSON 解析错误** - 提示配置文件格式错误
2. **文件写入失败** - 显示错误信息，原有配置不会丢失
3. **目录创建失败** - 提示权限问题

### 备份文件

每次修改配置前，脚本会自动创建备份：

```
settings.local.json.backup.2026-03-04T12-30-45-123Z
```

备份文件包含时间戳，方便恢复。

### 常见问题

#### Q: 如何验证安装是否成功？

运行 `node scripts/install-hook.js --verbose`，查看详细输出。

#### Q: 如何恢复到安装前的状态？

找到备份文件（`.backup.*` 后缀），将其重命名为 `settings.local.json`。

#### Q: 安装后 Hook 不生效？

1. 确认 `settings.local.json` 格式正确
2. 重启 Claude Code
3. 检查 prompt 内容是否正确

#### Q: 如何卸载 Hook？

手动编辑 `settings.local.json`，移除 `hooks.Stop` 数组中的对应条目。

---

## 系统要求

- Node.js >= 12.0.0
- 无需额外依赖（仅使用内置模块）

---

## 相关文档

- [Stop Hook 说明](../.claude/hooks/stop-hook-prompt.md)
- [SKILL 文档](../.claude/skills/persistent-context/SKILL.md)
- [Hook 官方文档](https://code.claude.com/docs/zh-CN/hooks)

---

*最后更新: 2026-03-04 (更新 Hook 响应格式文档)*
