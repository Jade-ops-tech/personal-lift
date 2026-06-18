# data-foundation — 需求规格

## 概述

落地 Daily Inbox 的核心数据模型（记录/待办/标签/总结）、tRPC 服务端基础设施与后台会话，作为其余所有 feature 的横切基础。

## 项目信息

- 项目名: personal-lift
- 架构类型: Turborepo monorepo（pnpm + Vite + Hono + tRPC + Drizzle + better-auth）

## 需求版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始需求 |

## 用户故事

- 作为开发者，我想要统一的记录数据模型与 tRPC 基础，以便上层 feature 直接复用、保持端到端类型安全。

## 功能需求

1. [F-001] `records` 表：承载所有记录，待办为 `is_todo=true` 的记录（字段见数据模型）。
2. [F-002] `tags` + `record_tags` 表：标签及与记录的多对多关联。
3. [F-003] `summaries` 表：每日/每周总结存储。
4. [F-004] 固定分类枚举：学习/工作/生活/想法/待办/其他；记录状态与待办状态枚举。
5. [F-005] tRPC 基础设施：根 router、context（注入 db 与 better-auth 会话）、public/protected procedure。
6. [F-006] 后台会话接入：better-auth 配置，protected procedure 依据会话鉴权。

## 非功能需求

- 安全: 连接串与密钥经 `@personal-lift/env`（zod 校验）读取，禁止硬编码（见 .claude/rules/security.md）。
- 兼容性: 复用 better-auth 既有 schema（`packages/db/src/schema/auth.ts`），不破坏现有结构。
- 一致性: schema 改动经 `db:generate` 生成 migration 并提交，不手写 SQL（见 .claude/rules/database.md）。

## 验收标准

- [ ] [AC-001] 执行 `pnpm db:generate && pnpm db:migrate` 后，records/tags/record_tags/summaries 表成功建立。
- [ ] [AC-002] tRPC 根 router 可被 `apps/server` 挂载，`@personal-lift/api` 导出类型供 web 端推断。
- [ ] [AC-003] protected procedure 在无有效会话时拒绝，有会话时放行。

## 依赖

- 既有：`@personal-lift/db`（Drizzle+pg）、`@personal-lift/auth`（better-auth）、`@personal-lift/env`、`@personal-lift/api`。

## 开放问题

- 无（数据模型已在 PLAN.md 总览中固化）。
