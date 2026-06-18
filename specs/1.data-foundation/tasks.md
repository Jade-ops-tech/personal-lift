# data-foundation — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始任务 |

## 项目信息

- 项目名: personal-lift
- 架构类型: Turborepo monorepo
- specs 路径: specs/1.data-foundation/

## 任务列表

### 功能 1: 数据模型

- [x] T-001: 定义枚举与 `records` schema（`packages/db/src/schema/record.ts`：category/recordStatus/todoStatus 枚举 + 全字段）~30min
- [x] T-002: 定义 `tags` + `record_tags` schema 与关系 ~15min
- [x] T-003: 定义 `summaries` schema（含 user_id+type+period_key 唯一约束）~15min
- [x] T-004: 汇总导出 `schema/index.ts`，`db:generate` 生成 migration（`0000_green_miracleman.sql`）~15min

### 功能 2: tRPC 基础与会话

- [x] T-005: tRPC 基础已具备（`packages/api`：context 注入 better-auth 会话、publicProcedure、protectedProcedure、appRouter + AppRouter 类型，模板已搭好）~30min
- [x] T-006: server 挂载已具备（`apps/server/src/index.ts` 经 `@hono/trpc-server` 挂载 appRouter + better-auth handler + context）~30min

### 集成与测试

- [ ] T-007: 集成验收：跑 `db:migrate` 建表，启动 server，验证 protectedProcedure 无会话拒绝/有会话放行、web 端可推断 AppRouter 类型（覆盖 AC-001/AC-002/AC-003）~30min `[BLOCKED: 本地无 Postgres，待数据库就绪]`

## 依赖关系

- T-002、T-003 依赖 T-001（共享枚举）
- T-004 依赖 T-001/T-002/T-003
- T-006 依赖 T-005
- T-007 依赖 T-004/T-006

## 风险点

- better-auth 既有 `schema/auth.ts` 与新增表的 migration 冲突 → 生成前先 `db:studio` 确认现状，必要时合并到一次 generate。
- 既有示例 `todo.ts` 可能与新 `record.ts` 概念重叠 → 确认是否清理示例表，避免无用表残留。
