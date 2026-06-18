# admin-management-extras — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始任务 |

## 项目信息

- 项目名: personal-lift
- 架构类型: Turborepo monorepo
- specs 路径: specs/9.admin-management-extras/

## 任务列表

### 功能 1: 后台待办管理

- [x] T-001: `admin.todos.list` + `admin.todos.update`（状态/计划时间/deadline）procedure（`packages/api/src/routers/admin-extras.ts`）~30min
- [x] T-002: `/admin/todos` 待办列表 + 状态 select / 计划时间编辑 / 逾期徽标 ~30min

### 功能 2: 分类与标签管理

- [x] T-003: `admin.tags` procedures：list（含用量计数）/create/merge（事务迁移关联 + 删源）/remove + `admin.categories.list`（固定枚举）~30min
- [x] T-004: `/admin/tags` 标签管理页（新增/合并/删除）~30min

### 功能 3: 总结管理

- [x] T-005: `admin.summaries` procedures：list/regenerate（复用 `runDailySummary`/`runWeeklySummary`）/update（置 edited=true）~30min
- [x] T-006: `/admin/summaries` 每日/每周列表 + 重新生成（日期）+ JSON 内容编辑器 ~30min

### 集成与测试

- [ ] T-007: 集成验收：后台改待办状态/时间；标签新增+合并验证关联迁移；查看并重新生成、编辑总结（覆盖 AC-001~AC-004）~30min `[BLOCKED: 需 DB + ANTHROPIC_API_KEY 运行时]`

## 依赖关系

- T-002 依赖 T-001
- T-004 依赖 T-003
- T-006 依赖 T-005
- T-007 依赖 T-002/T-004/T-006
- 跨 feature：依赖 6.admin-records（admin router 与登录守卫）、4.todo-center（待办操作）、5.daily-summary + 8.weekly-summary（生成能力）

## 风险点

- 标签合并的并发与关联迁移一致性 → 事务内完成，验收覆盖「合并后记录指向保留标签」。
- 总结手动编辑后又被重新生成覆盖 → 约定 regenerate 提示将覆盖 edited 内容，前端二次确认。
