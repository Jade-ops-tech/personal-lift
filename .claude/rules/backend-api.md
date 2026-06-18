---
description: 服务端与 API 层规范（Hono + tRPC + better-auth）
globs: apps/server/**, packages/api/**
---

# 后端 API 规范

适用：`apps/server`（Hono 运行时入口）与 `packages/api`（tRPC 路由与业务）。

## 技术栈

- 运行时：**Hono** + `@hono/node-server`，开发用 `tsx watch`，构建用 `tsdown`
- API：**tRPC v11**，通过 `@hono/trpc-server` 挂载
- 认证：**better-auth**（`@personal-lift/auth`）
- 数据：**Drizzle ORM**（`@personal-lift/db`）
- 校验：**zod**

## tRPC procedure

- 每个 procedure 用 zod 定义 `input`，校验后再进入业务逻辑
- 区分 `publicProcedure` 与需鉴权的 protected procedure；敏感操作必须在 procedure 内校验会话与授权
- 抛 `Error`（或 tRPC 的 `TRPCError`）并带明确 code/message，禁止抛字符串
- 业务逻辑放 `packages/api`，`apps/server` 只做运行时装配（中间件、CORS、挂载）
- 类型经 `@personal-lift/api` 导出供 web 端推断，保持端到端类型安全

## 错误与异步

- async 函数中始终 `await`，不在 Promise executor 里用 async
- 用 try-catch 有意义地处理错误，不要捕获后原样 rethrow
- early return 处理错误分支，减少嵌套

## 数据访问

- DB 操作经 `@personal-lift/db` 的 Drizzle 实例，参数化查询，禁止手拼 SQL
- DB schema 变更见 [database.md](database.md)
