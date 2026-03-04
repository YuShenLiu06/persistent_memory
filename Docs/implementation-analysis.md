# 持久上下文系统 - 实现考虑文档

## 1. 需求分析

基于 `简要.canvas` 中的规划，系统需要实现以下核心功能：

### 1.1 持久加载上下文
- **目的**：自动为 Agent 提供正在编写文件相关文件的文档
- **内容**：
  - 整个项目结构
  - 各个结构功能
  - 初级索引（API 文档位置，各个文档地址）
  - 必须遵循规则
  - 强制要求（如某些位置不能进行更改）

### 1.2 向量知识库
- **目的**：支持语义搜索，通过关键词或功能查找相关函数
- **功能**：
  - 通过功能查找函数/API
  - 通过函数/API 查找说明
- **技术选型**：Canvas 中提到使用 Qdrant 进行向量储存

### 1.3 文档创建与更新
- **触发时机**：
  - 用户要求生成文档
  - 接口进行了更新
  - 用户主动要求进行文档更新
- **内容**：
  - 新增的功能/函数
  - 更改的功能/函数
  - 删除的功能/函数

---

## 2. 实现方案对比

### 方案 A：纯 Hook + Markdown 文件系统

#### 架构设计
```
~/.claude/projects/<project-id>/memory/
├── MEMORY.md                    # 主记忆文件（自动加载）
├── tree-index.json              # 树状索引结构
├── docs/
│   ├── api/                     # API 文档
│   │   ├── _index.md            # 索引文件
│   │   ├── auth.md              # 认证相关
│   │   └── users.md             # 用户相关
│   ├── rules/                   # 规则文档
│   │   ├── coding-standards.md
│   │   └── project-constraints.md
│   └── structure/               # 结构文档
│       ├── overview.md
│       └── modules.md
└── vectors/                     # 向量索引（可选）
    └── embeddings.jsonl
```

#### 工作流程
1. **SessionStart Hook**：读取 `MEMORY.md` 并注入上下文
2. **PostToolUse Hook**：检测文件修改，触发文档更新
3. **SKILL**：提供文档更新、搜索的提示词模板

#### 实现代码（脚本部分）
```javascript
// scripts/hooks/session-start.js
const fs = require('fs');
const path = require('path');

function loadPersistentContext(projectDir) {
    const memoryFile = path.join(projectDir, 'memory', 'MEMORY.md');
    if (fs.existsSync(memoryFile)) {
        const content = fs.readFileSync(memoryFile, 'utf-8');
        // 返回前 200 行（避免上下文过长）
        const lines = content.split('\n').slice(0, 200).join('\n');
        return `# 项目持久上下文\n\n${lines}`;
    }
    return null;
}
```

#### 优点
- ✅ **简单可靠**：纯文件系统，无外部依赖
- ✅ **易于调试**：直接查看 Markdown 文件
- ✅ **版本可控**：可纳入 Git 管理
- ✅ **跨平台**：Node.js 脚本兼容所有系统
- ✅ **符合 Claude Code 现有模式**：与 session 持久化一致

#### 缺点
- ❌ **无语义搜索**：需要手动实现或配合外部工具
- ❌ **文件大小限制**：MEMORY.md 限制 200 行可能丢失信息
- ❌ **索引维护**：树状索引需要手动更新

---

### 方案 B：Hook + SKILL + 本地向量数据库

#### 架构设计
```
~/.claude/projects/<project-id>/memory/
├── MEMORY.md                    # 主记忆文件
├── docs/                        # 文档目录（树状结构）
│   └── ... (同方案 A)
├── qdrant/                      # 本地 Qdrant 数据
│   └── collection/
└── scripts/
    ├── embed.js                 # 向量化脚本
    ├── search.js                # 搜索脚本
    └── update-index.js          # 索引更新脚本
```

#### 工作流程
1. **文档更新时**：运行 `embed.js` 生成向量
2. **搜索时**：通过 SKILL 调用 `search.js` 进行语义搜索
3. **上下文加载**：MEMORY.md + 语义搜索结果

#### 实现代码（脚本部分）
```javascript
// scripts/embed.js
const { QdrantClient } = require('@qdrant/js-client-rest');
const fs = require('fs');

async function embedDocuments(docsPath, collectionName) {
    const client = new QdrantClient({ url: 'http://localhost:6333' });

    // 读取文档
    const docs = readAllMarkdown(docsPath);

    // 调用嵌入模型（需要配置）
    const embeddings = await getEmbeddings(docs);

    // 存储到 Qdrant
    await client.upsert(collectionName, {
        points: embeddings.map((emb, i) => ({
            id: docs[i].id,
            vector: emb,
            payload: { content: docs[i].content, path: docs[i].path }
        }))
    });
}
```

#### 优点
- ✅ **语义搜索**：支持通过功能描述查找相关代码
- ✅ **精确匹配**：向量搜索比关键词搜索更智能
- ✅ **上下文优化**：只加载相关文档片段

#### 缺点
- ❌ **外部依赖**：需要运行 Qdrant 服务
- ❌ **嵌入模型**：需要调用嵌入 API（成本）
- ❌ **复杂度高**：需要维护向量索引同步
- ❌ **资源消耗**：Qdrant 需要内存和存储

---

### 方案 C：Hook + SKILL + MCP Server（推荐）

#### 架构设计
```
~/.claude/
├── mcp-configs/
│   └── memory-server.json       # MCP 服务器配置
└── projects/<project-id>/memory/
    ├── MEMORY.md                # 主记忆文件
    ├── docs/                    # 树状文档结构
    │   ├── _tree.json           # 树状索引
    │   ├── api/
    │   ├── rules/
    │   └── structure/
    └── cache/                   # 本地缓存
        └── search-index.json    # 轻量级搜索索引
```

#### 树状索引结构
```json
// _tree.json
{
  "version": "1.0",
  "updated": "2026-03-04T10:00:00Z",
  "root": {
    "name": "project-docs",
    "type": "folder",
    "children": [
      {
        "name": "api",
        "type": "folder",
        "description": "API 接口文档",
        "children": [
          {
            "name": "auth",
            "type": "document",
            "path": "docs/api/auth.md",
            "description": "认证相关接口",
            "keywords": ["login", "token", "session"],
            "functions": ["authenticate", "refreshToken", "logout"]
          }
        ]
      },
      {
        "name": "rules",
        "type": "folder",
        "description": "项目规则与约束",
        "children": [...]
      }
    ]
  }
}
```

#### MCP Server 设计
```python
# memory-server.py
from mcp.server import Server
import json
import os

server = Server("memory-server")

@server.tool()
def search_docs(query: str, project_id: str) -> list:
    """搜索项目文档"""
    # 1. 加载树状索引
    tree = load_tree_index(project_id)

    # 2. 关键词匹配
    results = keyword_search(tree, query)

    # 3. 返回相关文档片段
    return [load_doc_segment(r['path']) for r in results]

@server.tool()
def update_doc_index(project_id: str, changes: list) -> bool:
    """更新文档索引"""
    tree = load_tree_index(project_id)

    for change in changes:
        if change['type'] == 'add':
            add_to_tree(tree, change)
        elif change['type'] == 'remove':
            remove_from_tree(tree, change)
        elif change['type'] == 'update':
            update_in_tree(tree, change)

    save_tree_index(project_id, tree)
    return True
```

#### SKILL 提示词模板
```markdown
# 持久上下文管理 SKILL

## 触发时机
- 会话开始时自动加载 MEMORY.md
- 用户询问项目结构、API 用法时
- 文件修改后需要更新文档时

## 搜索流程
1. 解析用户查询意图
2. 调用 MCP 工具 `search_docs`
3. 获取相关文档片段
4. 组装上下文返回

## 文档更新流程
1. 检测代码变更（通过 PostToolUse Hook）
2. 分析变更内容
3. 调用 MCP 工具 `update_doc_index`
4. 更新 MEMORY.md 摘要
```

#### 优点
- ✅ **原生集成**：MCP 是 Claude Code 的标准扩展方式
- ✅ **无外部服务**：MCP Server 作为本地进程运行
- ✅ **灵活搜索**：可实现关键词 + 轻量级语义搜索
- ✅ **树状结构清晰**：`_tree.json` 提供完整导航
- ✅ **可扩展**：未来可添加向量搜索而不改变接口

#### 缺点
- ❌ **需要维护 MCP Server**：额外的代码维护
- ❌ **启动依赖**：需要 MCP Server 正常启动
- ❌ **搜索精度有限**：无向量嵌入时依赖关键词

---

### 方案 D：纯提示词 + Rules（最轻量）

#### 架构设计
```
~/.claude/
├── CLAUDE.md                    # 全局规则
└── projects/<project-id>/
    ├── CLAUDE.md                # 项目规则（含上下文加载要求）
    └── memory/
        ├── MEMORY.md            # 主记忆文件
        └── docs/                # 文档目录
```

#### CLAUDE.md 配置
```markdown
# 项目规则

## 强制上下文加载

在开始任何任务前，必须：
1. 读取 `memory/MEMORY.md` 获取项目概览
2. 根据任务类型读取相关子文档
3. 遵循 `memory/docs/rules/` 中的所有规则

## 文档结构
- `docs/api/` - API 文档
- `docs/rules/` - 编码规则
- `docs/structure/` - 项目结构说明

## 自动更新
当检测到以下变更时，更新对应文档：
- 新增函数/API → 更新 `docs/api/`
- 修改项目结构 → 更新 `docs/structure/`
```

#### MEMORY.md 模板
```markdown
# 项目持久上下文

> 此文件在会话开始时自动加载（前 200 行）

## 项目结构
[项目目录树]

## 核心模块
| 模块 | 路径 | 说明 |
|------|------|------|

## API 索引
| 功能 | 文档路径 | 关键函数 |
|------|----------|----------|

## 必须遵循的规则
1. ...
2. ...

## 禁止修改的位置
- `path/to/protected/`
```

#### 优点
- ✅ **最轻量**：无任何脚本依赖
- ✅ **100% 可靠**：纯提示词，无运行时错误
- ✅ **易于理解**：Markdown 文件直观
- ✅ **立即可用**：无需配置

#### 缺点
- ❌ **无自动更新**：需要 AI 主动更新文档
- ❌ **无搜索能力**：需要手动浏览文档
- ❌ **上下文限制**：只能加载有限内容
- ❌ **依赖 AI 自律**：可能遗漏加载步骤

---

## 3. 方案对比矩阵

| 维度 | 方案 A (纯 Hook) | 方案 B (向量) | 方案 C (MCP) | 方案 D (纯提示词) |
|------|------------------|---------------|--------------|-------------------|
| **实现复杂度** | 低 | 高 | 中 | 极低 |
| **外部依赖** | 无 | Qdrant + 嵌入 API | MCP Server | 无 |
| **语义搜索** | ❌ | ✅ | ⚠️ (关键词) | ❌ |
| **自动更新** | ✅ (Hook) | ✅ (Hook) | ✅ (MCP) | ❌ |
| **可靠性** | 高 | 中 | 高 | 最高 |
| **可维护性** | 高 | 低 | 中 | 最高 |
| **扩展性** | 中 | 高 | 高 | 低 |
| **资源消耗** | 低 | 高 | 中 | 极低 |
| **上下文精度** | 低 | 高 | 中 | 低 |

---

## 4. 推荐实现路径

### 阶段一：基础实现（方案 A + D 混合）

**目标**：快速建立可用的持久上下文系统

1. **创建 MEMORY.md 结构**
   - 项目概览
   - 模块索引
   - 规则摘要

2. **创建树状文档结构**
   ```
   memory/
   ├── MEMORY.md
   ├── docs/
   │   ├── _tree.json        # 树状索引
   │   ├── api/
   │   │   └── *.md
   │   ├── rules/
   │   │   └── *.md
   │   └── structure/
   │       └── *.md
   ```

3. **编写 SKILL 提示词**
   - 文档更新流程
   - 上下文加载指南
   - 搜索指引

4. **配置 Rules**
   - 在 CLAUDE.md 中强制要求加载 MEMORY.md

### 阶段二：增强搜索（可选）

如果语义搜索是刚需，可考虑：

1. **使用 PageIndex 模式**（Canvas 中提到）
   - 将文档分页索引
   - 每页生成摘要
   - 通过摘要匹配定位

2. **或集成轻量级向量搜索**
   - 使用 `sqlite-vec` 或 `lancedb`
   - 无需外部服务
   - 本地运行

### 阶段三：MCP 集成（可选）

如需更强的搜索和索引能力：

1. 开发本地 MCP Server
2. 实现文档索引 API
3. 集成到 Claude Code

---

## 5. 关键技术决策

### 5.1 树状索引 vs 扁平索引

| 类型 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 树状索引 | 层级清晰、易于导航 | 更新复杂 | 大型项目、多模块 |
| 扁平索引 | 更新简单、搜索快 | 无结构 | 小型项目、单模块 |

**推荐**：树状索引，使用 `_tree.json` 存储

### 5.2 索引指向粒度

| 粒度 | 优点 | 缺点 |
|------|------|------|
| 整个文档 | 实现简单 | 上下文冗余 |
| 文档片段 | 上下文精确 | 需要分段逻辑 |
| 函数/类级别 | 最精确 | 维护成本高 |

**推荐**：文档级别索引 + 函数级元数据

### 5.3 上下文加载策略

| 策略 | 描述 | 适用场景 |
|------|------|----------|
| 全量加载 | 加载所有 MEMORY.md | 小项目 |
| 按需加载 | 根据任务加载相关文档 | 大项目 |
| 混合加载 | MEMORY.md 摘要 + 按需详情 | 推荐 |

---

## 6. 实现建议

### 6.1 必须实现
1. ✅ MEMORY.md 文件结构
2. ✅ 树状文档目录
3. ✅ `_tree.json` 索引
4. ✅ SKILL 提示词模板
5. ✅ CLAUDE.md 规则配置

### 6.2 建议实现
1. ⚠️ PostToolUse Hook 检测文档更新
2. ⚠️ 轻量级关键词搜索

### 6.3 可选实现
1. ❓ MCP Server
2. ❓ 向量嵌入
3. ❓ Qdrant 集成

---

## 7. 下一步行动

1. **确认实现方案**：选择 A/B/C/D 或组合
2. **设计文档结构**：确定树状层级和命名规范
3. **编写 SKILL 模板**：上下文管理和文档更新
4. **实现基础脚本**：索引更新、文档生成

---

---

## 8. AI 自主更新维护 CLAUDE.md 的实现方案

基于 [Claude Code CLAUDE.md 完全指南](https://easyclaude.com/post/claude-code-claude-md) 的加载机制分析：

### 8.1 CLAUDE.md 加载机制

| 特性 | 说明 |
|------|------|
| **自动读取** | Claude Code 启动时自动读取项目根目录的 CLAUDE.md |
| **上下文注入** | CLAUDE.md 内容注入到每次对话的上下文中 |
| **合并规则** | 子目录 CLAUDE.md 与父目录合并，子目录优先 |
| **实时更新** | 用户可通过 `#` 快捷键实时添加内容 |

### 8.2 AI 自主更新的核心挑战

1. **触发时机**：何时更新？（文件修改、功能新增、规则变更）
2. **更新内容**：更新什么？（API 索引、项目结构、规则列表）
3. **更新方式**：如何更新？（直接编辑、追加内容、重建索引）
4. **上下文限制**：CLAUDE.md 建议控制在 1000 字以内，如何平衡完整性与简洁性？

### 8.3 推荐架构：分层文档系统

```
项目根目录/
├── CLAUDE.md                    # 轻量级入口（自动加载）
│   └── 包含：项目概述 + 指向详细文档的链接
│
└── .claude/
    └── memory/
        ├── MEMORY.md            # 核心记忆（自动加载，如果配置）
        ├── index/
        │   ├── api-index.md     # API 索引
        │   ├── structure.md     # 结构索引
        │   └── rules.md         # 规则索引
        └── docs/
            ├── api/             # 详细 API 文档
            ├── modules/         # 模块文档
            └── decisions/       # 架构决策记录
```

### 8.4 实现方案：SKILL + Hook + Rules 组合

#### 方案 8.4.1：SKILL 提示词（核心）

```markdown
# 持久上下文管理 SKILL

## 触发条件
- 用户要求更新文档
- PostToolUse Hook 检测到重要文件变更
- 用户使用 `/update-memory` 命令

## 工作流程

### 1. 文档更新流程
当需要更新持久上下文时：

1. **分析变更内容**
   - 识别新增/修改/删除的函数和模块
   - 提取 API 接口变更
   - 识别项目结构变化

2. **确定更新目标**
   - API 变更 → 更新 `index/api-index.md`
   - 结构变更 → 更新 `index/structure.md`
   - 规则变更 → 更新 `index/rules.md`

3. **更新 CLAUDE.md（可选）**
   - 如果是重大变更，更新 CLAUDE.md 的概述部分
   - 保持 CLAUDE.md 简洁（< 1000 字）

4. **更新详细文档**
   - 在 `.claude/memory/docs/` 下创建/更新详细文档

### 2. 索引维护
索引文件格式：

```markdown
# API 索引

> 最后更新: 2026-03-04

## 认证模块
| 函数 | 文件 | 说明 |
|------|------|------|
| `authenticate()` | `src/auth/login.ts` | 用户登录认证 |
| `refreshToken()` | `src/auth/token.ts` | 刷新访问令牌 |

## 用户模块
| 函数 | 文件 | 说明 |
|------|------|------|
| `getUser()` | `src/api/users.ts` | 获取用户信息 |
```

### 3. 强制加载规则
在 CLAUDE.md 中添加：

```markdown
## ⚠️ 强制要求

在开始任何任务前，AI 必须：
1. 阅读本文件的全部内容
2. 根据任务类型，阅读 `.claude/memory/index/` 下的相关索引
3. 如需详细信息，查阅 `.claude/memory/docs/` 下的详细文档

违反此要求将导致上下文不完整，影响任务执行质量。
```

## 命令
- `/update-memory` - 手动触发文档更新
- `/search-api <keyword>` - 搜索 API 文档
- `/show-structure` - 显示项目结构索引
```

#### 方案 8.4.2：Hook 自动检测（可选增强）

```javascript
// .claude/hooks/post-tool-use.js
// 检测文件变更，触发文档更新建议

const CRITICAL_PATTERNS = [
  /src\/api\/.*\.ts$/,      // API 文件
  /src\/modules\/.*\.ts$/,  // 模块文件
  /CLAUDE\.md$/             // 配置文件本身
];

function shouldSuggestUpdate(filePath) {
  return CRITICAL_PATTERNS.some(p => p.test(filePath));
}

// 输出建议信息（不强制）
if (shouldSuggestUpdate(toolInput.file_path)) {
  console.log(`
  📝 检测到重要文件变更，建议更新持久上下文：
  - 使用 /update-memory 命令更新文档索引
  - 或手动编辑 .claude/memory/index/ 下的索引文件
  `);
}
```

#### 方案 8.4.3：Rules 配置

```markdown
# ~/.claude/rules/persistent-context.md

# 持久上下文规则

## 强制行为
1. 每次会话开始时，确认已阅读 CLAUDE.md
2. 修改 API 或核心模块后，提示用户是否需要更新文档
3. 创建新功能时，在 `.claude/memory/docs/` 下创建对应文档

## 文档结构约定
- CLAUDE.md：入口文件，保持简洁
- index/：索引文件，快速查找
- docs/：详细文档，完整说明

## 禁止行为
- 不要在 CLAUDE.md 中存储敏感信息
- 不要让 CLAUDE.md 超过 1000 字
- 不要跳过文档更新步骤
```

### 8.5 更新策略对比

| 策略 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| **实时更新** | 每次修改后立即更新 | 文档始终最新 | 频繁操作，可能打断工作流 |
| **批量更新** | 会话结束时批量更新 | 减少操作次数 | 可能遗漏细节 |
| **按需更新** | 用户或 AI 判断后更新 | 灵活可控 | 可能忘记更新 |
| **混合模式** | 关键变更实时 + 其他按需 | 平衡 | 实现复杂 |

**推荐**：混合模式
- API 接口变更：实时提示更新
- 项目结构变更：会话结束时更新
- 规则变更：立即更新

### 8.6 树状文档结构设计

```
.claude/memory/
│
├── MEMORY.md                    # 主记忆文件（摘要）
│   内容：
│   - 项目概述（100 字）
│   - 核心模块列表
│   - 关键规则摘要
│   - 索引文件链接
│
├── index/                       # 索引层（快速查找）
│   ├── _tree.json               # 树状结构元数据
│   ├── api-index.md             # API 快速索引
│   ├── structure-index.md       # 结构快速索引
│   └── rules-index.md           # 规则快速索引
│
├── docs/                        # 详细文档层
│   ├── api/                     # API 详细文档
│   │   ├── auth.md
│   │   ├── users.md
│   │   └── orders.md
│   │
│   ├── modules/                 # 模块详细文档
│   │   ├── core.md
│   │   └── utils.md
│   │
│   └── decisions/               # 架构决策记录
│       └── 2026-03-04-auth-strategy.md
│
└── templates/                   # 文档模板
    ├── api-doc.template.md
    └── module-doc.template.md
```

### 8.7 _tree.json 结构设计

```json
{
  "version": "1.0",
  "project": "persistent-memory",
  "updated": "2026-03-04T10:00:00Z",
  "root": {
    "name": "project-context",
    "type": "folder",
    "children": [
      {
        "name": "api",
        "type": "category",
        "description": "API 接口文档",
        "index": "index/api-index.md",
        "children": [
          {
            "name": "auth",
            "type": "document",
            "path": "docs/api/auth.md",
            "description": "认证相关接口",
            "keywords": ["login", "token", "session", "auth"],
            "functions": [
              {"name": "authenticate", "file": "src/auth/login.ts"},
              {"name": "refreshToken", "file": "src/auth/token.ts"}
            ],
            "lastModified": "2026-03-04T09:00:00Z"
          }
        ]
      },
      {
        "name": "modules",
        "type": "category",
        "description": "核心模块文档",
        "index": "index/structure-index.md",
        "children": [...]
      },
      {
        "name": "rules",
        "type": "category",
        "description": "项目规则与约束",
        "index": "index/rules-index.md",
        "children": [...]
      }
    ]
  },
  "searchIndex": {
    "byFunction": {
      "authenticate": "docs/api/auth.md",
      "refreshToken": "docs/api/auth.md"
    },
    "byKeyword": {
      "login": ["docs/api/auth.md"],
      "token": ["docs/api/auth.md"]
    }
  }
}
```

### 8.8 最终推荐实现路径

#### 阶段一：基础框架（必须实现）
1. ✅ 创建 `CLAUDE.md` 入口文件
2. ✅ 创建 `.claude/memory/` 目录结构
3. ✅ 创建 `_tree.json` 树状索引
4. ✅ 编写 SKILL 提示词模板
5. ✅ 配置 Rules 强制加载

#### 阶段二：自动更新（建议实现）
1. ⚠️ PostToolUse Hook 检测变更
2. ⚠️ SKILL 提供更新命令
3. ⚠️ AI 自主判断更新时机

#### 阶段三：增强搜索（可选实现）
1. ❓ 轻量级关键词搜索
2. ❓ 向量嵌入（如需语义搜索）
3. ❓ MCP Server 集成

---

*文档版本: 1.1*
*创建时间: 2026-03-04*
*更新时间: 2026-03-04*
