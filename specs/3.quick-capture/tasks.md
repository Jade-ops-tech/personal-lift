# quick-capture — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始任务 |

## 项目信息

- 项目名: personal-lift
- 架构类型: Turborepo monorepo
- specs 路径: specs/3.quick-capture/

## 任务列表

### 功能 1: 记录提交

- [x] T-001: `record.create` procedure（`packages/api/src/routers/record.ts`）：zod 校验 content 非空 → 调 recognize → 写 record + 标签关联（tags upsert + onConflictDoNothing）~30min
- [x] T-002: `record.listToday` procedure：当天记录倒序 + 标签关系查询（db.query.record.findMany with recordTags）~15min

### 功能 2: H5 记录页

- [x] T-003: `/h5` 输入框（`apps/web/src/routes/h5/index.tsx`，非空校验），提交清空 ~30min
- [x] T-004: 提交 mutation 联动 + 成功后 refetch listToday ~15min
- [x] T-005: 今日记录流列表（内容/分类/标签/待办/时间/状态展示 + 空态）~30min

### 集成与测试

- [ ] T-006: 集成验收：提交一条文字 → 自动分类/标签 → 即时出现在今日流；空内容不可提交（覆盖 AC-001/AC-002/AC-003/AC-004）~30min `[BLOCKED: 需 DB + ANTHROPIC_API_KEY 运行时]`

## 依赖关系

- T-002 依赖 T-001（共用记录读模型）
- T-004 依赖 T-001/T-003
- T-005 依赖 T-002
- T-006 依赖 T-004/T-005
- 跨 feature：T-001 依赖 1.T-005（tRPC 基础）、2.T-005（recognize 出口）

## 风险点

- 识别耗时影响提交体验 → 可加提交 loading 态或乐观插入，识别返回后回填。
- 「当天」边界（时区）→ 统一以服务器本地日界，验收时注意跨午夜样例。
