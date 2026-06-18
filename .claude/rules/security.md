---
description: 密钥处理、环境变量、认证与前端安全禁止事项
---

# 安全规范

## 密钥与环境变量

- 禁止硬编码密钥、token、数据库连接串、API key
- 环境变量统一经 `@personal-lift/env` 包（zod 校验）读取，不要散落 `process.env.X` 直接访问
- `.env`、`.env*.local` 已在 `.gitignore`，禁止提交；新增敏感文件先确认被忽略

## 认证（better-auth）

- 认证逻辑集中在 `packages/auth`，业务代码通过其导出消费，不要在各处重复实现 session/token 校验
- 服务端在 tRPC procedure / Hono middleware 层校验会话，禁止仅靠前端隐藏入口做权限控制
- 涉及权限、敏感操作的 procedure 必须显式校验当前用户身份与授权

## 数据访问

- 一律用 Drizzle 参数化查询，禁止手拼 SQL 字符串
- 用 zod 校验并 sanitize 所有外部输入（API 入参、表单、URL 参数）

## 前端

- `target="_blank"` 链接必须加 `rel="noopener"`
- 避免 `dangerouslySetInnerHTML`，必要时先 sanitize
- 禁止 `eval()` 和直接给 `document.cookie` 赋值
