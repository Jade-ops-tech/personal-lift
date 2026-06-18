---
description: 数据库 schema、migration 与查询规范（Drizzle ORM + Postgres）
globs: packages/db/**
---

# 数据库规范

适用：`packages/db`（Drizzle ORM + Postgres）。

## 技术栈

- ORM：**Drizzle ORM**，驱动 `pg`（Postgres）
- 工具：**drizzle-kit**，配置见 `packages/db/drizzle.config.ts`
- schema 位于 `packages/db/src/schema/`（如 `auth.ts`、`todo.ts`），由 `index.ts` 汇总

## Schema

- 表定义集中在 `src/schema/`，按领域拆文件，统一从 `schema/index.ts` 导出
- 与 better-auth 相关的表（`auth.ts`）遵循 better-auth 的 schema 约定，改动前确认兼容
- 列与表命名保持一致风格，新增表同步导出供 `@personal-lift/api` 消费

## Migration 流程（在仓库根运行）

- `pnpm db:generate` — 由 schema 变更生成 migration
- `pnpm db:migrate` — 应用 migration
- `pnpm db:push` — 直接推送 schema（开发期快速迭代，慎用于生产）
- `pnpm db:studio` — 打开 Drizzle Studio 查看数据

约定：schema 改动 → `db:generate` 生成 migration 并提交，不要手写 migration SQL；生产环境走 `db:migrate`，避免直接 `db:push`。

## 查询

- 一律用 Drizzle query builder，参数化，禁止字符串拼接 SQL
- 连接串等敏感配置经 `@personal-lift/env` 读取，禁止硬编码
