# todo-center — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始任务 |

## 项目信息

- 项目名: personal-lift
- 架构类型: Turborepo monorepo
- specs 路径: specs/4.todo-center/

## 任务列表

### 功能 1: 待办查询与操作（API）

- [x] T-001: `todoCenter.list` 六维筛选 procedure（`packages/api/src/routers/todo-center.ts`：today/tomorrow/thisWeek/overdue/noTime/all，plannedTime 或 deadline 落区间）~30min
- [x] T-002: 待办状态操作 procedures：complete（done）/ cancel（cancelled）~15min
- [x] T-003: 时间操作 procedures：updatePlannedTime / updateDeadline / convertFromRecord ~30min

### 功能 2: H5 待跟进中心（前端）

- [x] T-004: `/h5/todos` 筛选 tab + 待办列表（todoStatus/逾期徽标/计划/截止）~30min
- [x] T-005: 行内操作（完成/取消 + 今日流「转待办」入口）+ mutation 刷新；改时间经 updatePlannedTime/updateDeadline API（UI 在 7.record-detail 编辑）~30min

### 集成与测试

- [ ] T-006: 集成验收：造含「明天/周末/6月30号前」的记录验证进入对应筛选；标记完成；转待办/取消（覆盖 AC-001/AC-002/AC-003/AC-004）~30min `[BLOCKED: 需 DB 运行时]`

## 依赖关系

- T-002、T-003 依赖 T-001（共用待办读模型）
- T-004 依赖 T-001
- T-005 依赖 T-002/T-003/T-004
- T-006 依赖 T-005
- 跨 feature：T-001 依赖 1.data-foundation；数据来源依赖 3.quick-capture 已能产生记录

## 风险点

- 筛选区间与时区边界 → 与 3.quick-capture 统一日界口径。
- planned_time 与 deadline 同时存在时归入哪个筛选 → 设计约定优先 deadline，验收覆盖。
