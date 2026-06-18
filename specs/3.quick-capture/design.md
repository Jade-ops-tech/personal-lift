# quick-capture — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始设计 |

## 项目架构

- 架构类型: Turborepo monorepo
- 涉及层: API（`packages/api`）、前端（`apps/web`，H5 路由 `/h5`）

## 功能模块设计

### 模块 1: 记录提交（API）

`packages/api` 新增 `records` 子 router，挂到 appRouter：

- `records.create`（protectedProcedure）：input `{ content: string(min 1) }`；流程：调用 `recognize(content, now)` → 组装记录（结构化列 + ai_result）→ 写库 → 返回完整记录。
- 识别失败走 2.ai-recognition 的降级，仍写库。

**涉及层及关键设计:**

- input 用 zod 校验，content 非空（trim 后 min 1）。
- planned_time/deadline/category/tags/is_todo 等取自识别结果；tags 写入 tags 表并建 record_tags 关联（已存在标签复用）。

### 模块 2: 今日记录流（API）

- `records.listToday`（protectedProcedure）：返回当天（按用户时区/服务器日界）创建的记录，按 created_at 倒序，含标签联表数据。

### 模块 3: H5 记录页与今日流（前端）

- 路由 `/h5`（首页）：输入框组件（TanStack React Form + zod，非空校验）+ 提交。
- 提交用 tRPC mutation（`@trpc/tanstack-react-query`）；成功后清空输入并 invalidate `listToday` 查询，使新记录出现在流顶部。
- 今日记录流列表组件：复用 `packages/ui` 基础组件，展示各字段与状态徽标。

## 接口契约

- `records.create({ content }) -> Record`
- `records.listToday() -> Record[]`

（`Record` 类型由 1.data-foundation schema 推断）

## 数据模型

复用 1.data-foundation 的 records / tags / record_tags，无新增表。

## 安全考虑

- create/listToday 均为 protectedProcedure，按会话归属用户写读（security.md）。
- content 经 zod 校验与 trim。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 识别同步还是异步 | 同步（提交时识别） | MVP 简单直观；失败有降级，不丢记录 |
| 列表刷新 | invalidate query | TanStack Query 标准做法，保持端到端类型安全 |
| 标签写入 | upsert 复用已有标签 | 避免重复标签，配合 9.admin 标签管理 |
