---
template_name: index
description: |
  文档索引页面模板，用于生成 Docs/index/index.md。
  配合 _tree.json 数据自动生成文档导航索引。
variables:
  - name: categories_content
    description: 所有分类的文档列表内容，根据 _tree.json 自动生成
  - name: version
    description: 索引版本号
    default: "1.0"
  - name: last_updated
    description: 最后更新日期
---

# 文档索引

> 此索引提供项目文档的快速导航，配合 CLAUDE.md 使用。

---

## 索引结构

| 分类 | 路径 | 说明 |
|------|------|------|
| API 文档 | `Docs/api/` | 项目 API 接口文档 |
| 模块文档 | `Docs/module/` | 项目模块和组件文档 |
| 设计文档 | `Docs/` | 架构和设计决策文档 |
| SKILL 文档 | `.claude/skills/` | Claude Code SKILL 定义 |

---

<!-- 分类文档列表：根据 _tree.json 中的 categories 自动生成 -->

{categories_content}

---

## 索引元数据

- **版本**: {version}
- **最后更新**: {last_updated}
- **数据源**: `_tree.json`

---

*此索引由 persistent-context SKILL 自动维护*
