# todo-center — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始设计 |

## 项目架构

- 架构类型: Turborepo monorepo
- 涉及层: API（`packages/api`）、前端（`apps/web`，`/h5/todos`）

## 功能模块设计

### 模块 1: 待办查询（API）

`packages/api` 新增 `todos` 子 router：

- `todos.list`（protectedProcedure）：input `{ filter: 'today'|'tomorrow'|'thisWeek'|'overdue'|'noTime'|'all' }`，对 `is_todo=true` 记录按筛选维度查询。
  - today/tomorrow/thisWeek：按 planned_time 或 deadline 落在对应区间。
  - overdue：deadline < now 且 todo_status != 'done'/'cancelled'。
  - noTime：planned_time 与 deadline 均为 null。
- 筛选区间以服务器本地日界 + now 计算。

### 模块 2: 待办操作（API）

- `todos.complete`（id）：todo_status='done'，同步 record status。
- `todos.cancel`（id）：todo_status='cancelled'。
- `todos.updatePlannedTime`（id, plannedTime|null）。
- `todos.updateDeadline`（id, deadline|null）。
- `todos.convertFromRecord`（recordId）：设 is_todo=true、todo_status='pending'。

所有 mutation 校验记录归属当前用户，更新 updated_at。

### 模块 3: H5 待跟进中心（前端）

- 路由 `/h5/todos`：顶部筛选 tab（6 个维度）+ 待办列表。
- 每项展示内容/分类/标签/计划时间/deadline/是否逾期徽标/待办状态。
- 行内操作：完成、改时间（时间选择器）、转待办（对普通记录入口可放今日流）、取消。
- 操作用 tRPC mutation，成功后 invalidate `todos.list` 与 `records.listToday`。

## 接口契约

- `todos.list({ filter }) -> Record[]`
- `todos.complete/cancel/updatePlannedTime/updateDeadline/convertFromRecord -> Record`

## 数据模型

复用 records（is_todo / todo_status / planned_time / deadline）。逾期为计算值，不落库。

## 安全考虑

- 全部 protectedProcedure，按会话归属操作（security.md）。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 待办与记录关系 | 同表 is_todo 视图 | 见 1.data-foundation 决策，避免双写 |
| 逾期判定 | 查询期计算 | 时间敏感，落库会过期 |
| 转待办入口 | 复用 records 更新 | 普通记录与待办同表，仅切 is_todo |
