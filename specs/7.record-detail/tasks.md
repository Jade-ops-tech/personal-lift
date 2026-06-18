# record-detail — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始任务 |

## 项目信息

- 项目名: personal-lift
- 架构类型: Turborepo monorepo
- specs 路径: specs/7.record-detail/

## 任务列表

### 功能 1: 详情查询与更新（API）

- [x] T-001: `record.getById` procedure（全字段 + 标签 + ai_result，归属校验）~15min
- [x] T-002: `record.update` procedure（分类/标签/待办/计划时间/deadline/状态/todoStatus，标签走 setTags 重建，不重新识别）~30min

### 功能 2: H5 详情页（前端）

- [x] T-003: `/h5/records/$id` 详情展示 + 可编辑表单（分类/状态 select、待办 checkbox、标签、datetime-local 时间）+ AI 结果只读；今日流标题加 Link 入口 ~30min

### 集成与测试

- [ ] T-004: 集成验收：从列表进入详情查看全字段与 AI 结果 → 修改字段保存 → 返回列表同步更新（覆盖 AC-001/AC-002/AC-003）~30min `[BLOCKED: 需 DB 运行时]`

## 依赖关系

- T-002 依赖 T-001
- T-003 依赖 T-001/T-002
- T-004 依赖 T-003
- 跨 feature：依赖 1.data-foundation；列表入口依赖 3.quick-capture（及 4.todo-center 列表）

## 风险点

- 标签编辑的合并/新建与 9.admin 标签管理口径需一致 → 共用 tags upsert 逻辑。
