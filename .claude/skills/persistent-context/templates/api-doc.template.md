# {API 名称} API 文档

> {API 简述 - 说明此 API 的用途}

**版本**: {v1.0.0}
**基础路径**: `{/api/v1}`
**认证方式**: {Bearer Token / API Key / 无}

---

## 概述

{详细描述 API 的功能和用途}

### 设计原则

- {原则1：如 RESTful 设计}
- {原则2：如版本控制策略}
- {原则3：如错误处理规范}

---

## 认证

### 认证方式

```
{认证头部格式示例}
Authorization: Bearer <token>
```

### 获取令牌

```
POST /auth/token
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## 端点列表

### {资源名称1}

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/{resource}` | 获取资源列表 |
| GET | `/{resource}/{id}` | 获取单个资源 |
| POST | `/{resource}` | 创建资源 |
| PUT | `/{resource}/{id}` | 更新资源 |
| DELETE | `/{resource}/{id}` | 删除资源 |

### {资源名称2}

| 方法 | 端点 | 描述 |
|------|------|------|
| ... | ... | ... |

---

## 端点详情

### GET /{resource}

获取资源列表。

**请求参数**:

| 参数 | 类型 | 位置 | 必需 | 描述 |
|------|------|------|------|------|
| page | integer | query | 否 | 页码，默认 1 |
| limit | integer | query | 否 | 每页数量，默认 20 |
| sort | string | query | 否 | 排序字段 |
| order | string | query | 否 | 排序方向 asc/desc |

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### POST /{resource}

创建新资源。

**请求体**:

```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "created_at": "ISO8601"
  }
}
```

### GET /{resource}/{id}

获取单个资源详情。

**路径参数**:

| 参数 | 类型 | 描述 |
|------|------|------|
| id | string | 资源唯一标识 |

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

### PUT /{resource}/{id}

更新资源。

**路径参数**:

| 参数 | 类型 | 描述 |
|------|------|------|
| id | string | 资源唯一标识 |

**请求体**:

```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "updated_at": "ISO8601"
  }
}
```

### DELETE /{resource}/{id}

删除资源。

**路径参数**:

| 参数 | 类型 | 描述 |
|------|------|------|
| id | string | 资源唯一标识 |

**响应**:

```json
{
  "success": true,
  "message": "Resource deleted successfully"
}
```

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### 错误码

| HTTP 状态码 | 错误码 | 描述 |
|------------|--------|------|
| 400 | INVALID_REQUEST | 请求参数无效 |
| 401 | UNAUTHORIZED | 未认证 |
| 403 | FORBIDDEN | 无权限 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突 |
| 422 | VALIDATION_ERROR | 验证失败 |
| 429 | RATE_LIMITED | 请求过于频繁 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

---

## 速率限制

- **默认限制**: {100} 请求/分钟
- **响应头**:
  - `X-RateLimit-Limit`: 限制总数
  - `X-RateLimit-Remaining`: 剩余次数
  - `X-RateLimit-Reset`: 重置时间 (Unix 时间戳)

---

## 示例

### cURL

```bash
# 获取资源列表
curl -X GET "https://api.example.com/v1/resource" \
  -H "Authorization: Bearer <token>"

# 创建资源
curl -X POST "https://api.example.com/v1/resource" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Example"}'
```

### JavaScript

```javascript
// 使用 fetch
const response = await fetch('https://api.example.com/v1/resource', {
  headers: {
    'Authorization': 'Bearer <token>'
  }
});
const data = await response.json();
```

---

## 变更日志

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0.0 | {YYYY-MM-DD} | 初始版本 |

---

*文档生成日期: {YYYY-MM-DD}*
