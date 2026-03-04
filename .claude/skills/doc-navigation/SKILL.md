---
name: doc-navigation
description: |
  教会 Agent 如何通过索引系统高效查找和定位项目文档。
  当需要查找技术文档、定位特定功能文档、浏览项目知识库时使用。
  触发关键词：查找文档, 文档索引, 找文档, 文档在哪, 如何使用
---

# 文档导航与查找 (Document Navigation)

## 适用场景

使用此 SKILL 当：

1. **需要查找特定文档** - 知道文档主题但不确定具体位置
2. **浏览项目知识库** - 了解项目有哪些可用文档
3. **定位功能相关文档** - 查找特定功能或模块的文档
4. **用户询问文档位置** - "API 文档在哪？"、"有没有关于 X 的文档？"
5. **新会话初始化** - 需要快速了解项目文档结构

---

## 文档查找流程

### 流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    文档查找工作流程                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 快速查找路径                                             │
│     └── CLAUDE.md 存在？                                    │
│         ├── 是 → 检查"技术文档索引"章节                     │
│         └── 否 → 进入完整查找流程                           │
│                                                             │
│  2. 完整查找流程                                             │
│     ├── 读取 Docs/index/index.md (可读索引)                 │
│     │   └── 找到目标文档的分类和路径                        │
│     │                                                       │
│     ├── 如需结构化数据                                       │
│     │   └── 读取 Docs/index/_tree.json                      │
│     │                                                       │
│     └── 加载具体文档                                         │
│         └── 按索引路径读取目标文档                          │
│                                                             │
│  3. 备用查找 (索引不存在时)                                  │
│     └── 使用 Grep/Glob 工具搜索文档内容                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 查找优先级

按以下优先级查找文档信息：

| 优先级 | 来源 | 文件路径 | 说明 |
|--------|------|----------|------|
| 1 (最高) | CLAUDE.md | `{项目根}/CLAUDE.md` | 主记忆文件，包含核心索引 |
| 2 | 可读索引 | `Docs/index/index.md` | 人类可读的文档目录 |
| 3 | 结构化索引 | `Docs/index/_tree.json` | 机器可读的 JSON 索引 |
| 4 | 具体文档 | `Docs/{category}/*.md` | 按索引路径加载 |
| 5 (最低) | 搜索工具 | 全局搜索 | 索引不存在时的备用方案 |

---

## 索引结构说明

### 目录结构

```
Docs/
├── index/
│   ├── _tree.json    # 结构化索引 (机器可读)
│   └── index.md      # 可读索引 (人类可读)
├── api/              # API 文档分类
│   └── *.md
├── module/           # 模块文档分类
│   └── *.md
├── architecture/     # 架构文档分类
│   └── *.md
└── guides/           # 指南文档分类
    └── *.md
```

### _tree.json 结构

```json
{
  "version": "1.0",
  "updated": "YYYY-MM-DD",
  "categories": [
    {
      "name": "分类名称",
      "path": "Docs/category/",
      "description": "分类描述",
      "documents": [
        {
          "name": "文档名称",
          "file": "filename.md",
          "description": "文档描述",
          "tags": ["tag1", "tag2"],
          "keywords": ["关键词1", "关键词2"]
        }
      ]
    }
  ]
}
```

**字段说明**：

| 字段 | 层级 | 说明 |
|------|------|------|
| `version` | 根 | 索引格式版本 |
| `updated` | 根 | 最后更新日期 |
| `categories` | 根 | 分类数组 |
| `name` | 分类 | 分类显示名称 |
| `path` | 分类 | 分类目录路径 |
| `description` | 分类 | 分类简要描述 |
| `documents` | 分类 | 文档数组 |
| `name` | 文档 | 文档显示名称 |
| `file` | 文档 | 文档文件名 |
| `description` | 文档 | 文档简要描述 |
| `tags` | 文档 | 标签数组 (可选) |
| `keywords` | 文档 | 关键词数组 (可选) |

### index.md 结构

```markdown
# 文档索引

> 最后更新: YYYY-MM-DD

---

## 分类名称

| 文档 | 路径 | 说明 |
|------|------|------|
| 文档名称 | Docs/category/filename.md | 文档描述 |

---

## 快速导航

- [按标签查找](#标签索引)
- [按关键词查找](#关键词索引)
```

---

## 示例场景

### 场景 1：查找 API 文档

**用户问题**："API 文档在哪里？"

**查找流程**：
1. 检查 CLAUDE.md 的"技术文档索引"章节
2. 找到 API 相关条目
3. 返回路径：`Docs/api/rest-api.md`

**响应示例**：
```
API 文档位于 Docs/api/rest-api.md
该文档包含 REST API 的完整说明。
```

### 场景 2：查找特定功能的文档

**用户问题**："有没有关于认证系统的文档？"

**查找流程**：
1. 检查 CLAUDE.md 索引
2. 如未找到，读取 `Docs/index/index.md`
3. 搜索包含"认证"关键词的文档
4. 找到：`Docs/architecture/authentication.md`

**响应示例**：
```
认证系统文档位于 Docs/architecture/authentication.md
该文档描述了认证流程、JWT 配置和安全最佳实践。
```

### 场景 3：浏览所有可用文档

**用户问题**："项目有哪些文档？"

**查找流程**：
1. 读取 `Docs/index/index.md`
2. 列出所有分类和文档

**响应示例**：
```
项目文档分类：

1. API 文档
   - REST API (Docs/api/rest-api.md)
   - GraphQL API (Docs/api/graphql.md)

2. 架构文档
   - 系统设计 (Docs/architecture/system-design.md)
   - 认证系统 (Docs/architecture/authentication.md)

3. 指南文档
   - 快速开始 (Docs/guides/quick-start.md)
   - 部署指南 (Docs/guides/deployment.md)
```

### 场景 4：索引不存在时的备用方案

**情况**：项目没有 `Docs/index/` 目录

**备用流程**：
1. 使用 Glob 工具搜索 `Docs/**/*.md`
2. 使用 Grep 工具搜索关键词
3. 直接列出找到的文档

**工具使用示例**：
```
# 列出所有文档
Glob: Docs/**/*.md

# 搜索包含关键词的文档
Grep: "关键词" in Docs/**/*.md
```

---

## 最佳实践

### DO (推荐)

- ✅ 优先检查 CLAUDE.md 的索引章节
- ✅ 使用 index.md 进行人类可读的导航
- ✅ 使用 _tree.json 进行程序化查询
- ✅ 按分类组织文档
- ✅ 为文档添加描述和关键词

### DON'T (避免)

- ❌ 直接搜索整个项目（效率低）
- ❌ 忽略索引直接猜测文档位置
- ❌ 加载所有文档（浪费上下文）
- ❌ 假设文档位置（可能不准确）
- ❌ 跳过索引检查步骤

---

## 与其他组件的关系

| 组件 | 类型 | 职责 |
|------|------|------|
| doc-navigation | SKILL | 文档查找和导航（本文件）|
| persistent-context | SKILL | 文档维护和更新 |
| memory-loading | Rule | 强制加载 CLAUDE.md |

**协作流程**：
1. **memory-loading** Rule 确保会话开始时加载 CLAUDE.md
2. **doc-navigation** SKILL 使用 CLAUDE.md 索引查找文档
3. **persistent-context** SKILL 在文档变更时更新索引

---

## 快速参考

### 常用查找命令

| 需求 | 操作 |
|------|------|
| 查找特定文档 | CLAUDE.md → index.md → 具体文档 |
| 浏览所有文档 | 直接读取 Docs/index/index.md |
| 按关键词搜索 | 读取 _tree.json，搜索 keywords 字段 |
| 按标签筛选 | 读取 _tree.json，搜索 tags 字段 |
| 索引不存在 | 使用 Glob 搜索 Docs/**/*.md |

### 索引文件对比

| 特性 | index.md | _tree.json |
|------|----------|------------|
| 格式 | Markdown | JSON |
| 可读性 | 优秀 | 良好 |
| 程序化查询 | 困难 | 容易 |
| 关键词搜索 | 手动 | 支持 |
| 标签筛选 | 手动 | 支持 |
| 推荐用途 | 浏览导航 | 精确查询 |

---

## 故障排除

### Q: 找不到索引文件怎么办？

使用备用方案：
1. 检查 `Docs/` 目录是否存在
2. 使用 Glob 搜索 `Docs/**/*.md`
3. 使用 Grep 搜索文档内容

### Q: 索引信息过时怎么办？

1. 使用 `persistent-context` SKILL 更新索引
2. 或手动触发 `/update-memory` 命令
3. 更新后索引将反映最新文档状态

### Q: 如何判断文档是否包含特定内容？

1. 先通过索引定位可能的目标文档
2. 使用 Grep 在目标文档中搜索关键词
3. 根据搜索结果决定是否加载完整文档

---

*此 SKILL 配合 persistent-context SKILL 和 memory-loading Rule 使用*
