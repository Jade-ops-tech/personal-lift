# data-foundation — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始设计 |

## 项目架构

- 架构类型: Turborepo monorepo
- 涉及层: 数据库（`packages/db`）、API（`packages/api`）、认证（`packages/auth`）

## 功能模块设计

### 模块 1: 记录数据模型（records）

在 `packages/db/src/schema/` 新增 `record.ts`（沿用既有 `todo.ts` 的写法，最终从 `schema/index.ts` 导出）。

**涉及层及关键设计（Drizzle / Postgres）:**

`records` 表字段：

| 列 | 类型 | 说明 |
| -- | ---- | ---- |
| id | uuid pk | 主键 |
| user_id | text fk→better-auth user | 归属用户（单用户也保留，便于后续多用户） |
| content | text not null | 原始内容，非空 |
| category | enum | 学习/工作/生活/想法/待办/其他 |
| emotion | text nullable | 情绪/状态 |
| is_todo | boolean default false | 是否待办 |
| follow_up_required | boolean default false | 是否值得跟进 |
| ai_result | jsonb nullable | 完整 AI 识别结果（见 2.ai-recognition 契约） |
| status | enum default 'normal' | 记录状态：normal/pending/done/archived |
| todo_status | enum nullable | 待办状态：pending/in_progress/done/cancelled（is_todo 时有值） |
| planned_time | timestamptz nullable | 计划时间 |
| deadline | timestamptz nullable | 截止时间 |
| created_at | timestamptz default now | |
| updated_at | timestamptz default now | |

枚举集中定义为 pgEnum：`categoryEnum`、`recordStatusEnum`、`todoStatusEnum`。是否逾期（overdue）不落库，由 `deadline < now() && todo_status != 'done'` 计算。

### 模块 2: 标签模型（tags / record_tags）

- `tags`：id(uuid pk)、name(text unique not null)、created_at。
- `record_tags`：record_id、tag_id 复合主键，外键级联删除。

### 模块 3: 总结模型（summaries）

- `summaries`：id、user_id、type(enum daily/weekly)、period_key(text，如 `2026-06-17` 或 `2026-W25`)、content(jsonb 结构化)、generated_at、edited(boolean default false)。`(user_id, type, period_key)` 唯一。

### 模块 4: tRPC 基础设施

在 `packages/api`：

- `trpc.ts`：初始化 tRPC，定义 context（`{ db, session }`）、`publicProcedure`、`protectedProcedure`（无 session 抛 `TRPCError({ code: 'UNAUTHORIZED' })`）。
- `root.ts`：`appRouter`，聚合各子 router（后续 feature 往里挂 records/todos/summaries/tags/admin）。
- 导出 `AppRouter` 类型供 web 端推断。
- `apps/server` 通过 `@hono/trpc-server` 挂载 `appRouter`，context 注入 better-auth 会话。

### 模块 5: 后台会话（better-auth）

- 在 `packages/auth` 配置 better-auth（邮箱+密码，单用户），复用既有 `schema/auth.ts`。
- tRPC context 解析请求中的会话；`protectedProcedure` 据此鉴权。

## 接口契约

本 feature 不暴露业务 procedure，仅提供 `appRouter` 骨架、`protectedProcedure` 与 context 类型，供 3-9 号 feature 挂载子 router。

## 数据模型

见上述模块 1-3。分类为固定枚举不建表（PRD 8.3：第一版分类固定）。认证表复用 better-auth。

## 安全考虑

- DB 连接串经 `@personal-lift/env` 读取（security.md）。
- `protectedProcedure` 统一在服务端鉴权，后台数据访问不依赖前端隐藏入口。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 待办是否独立表 | 复用 records + is_todo/todo_status | PRD 待办字段全部可由记录派生，避免双写与同步 |
| 分类是否建表 | 固定枚举 | PRD 第一版分类固定、不支持新增 |
| 标签是否建表 | 建 tags 表 | 标签需新增/合并/删除（PRD 8.3） |
| AI 结果存储 | jsonb 列 ai_result | 结构可能演进，jsonb 灵活且可查询 |
