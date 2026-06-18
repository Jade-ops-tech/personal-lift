# record-detail — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始设计 |

## 项目架构

- 架构类型: Turborepo monorepo
- 涉及层: API（`packages/api`）、前端（`apps/web`，`/h5/records/$id`）

## 功能模块设计

### 模块 1: 详情查询与更新（API）

`records` 子 router 扩展（沿用 3.quick-capture 的 router）：

- `records.getById`（id）：返回完整记录 + 标签 + ai_result。
- `records.update`（id, `{ category?, tagIds?, isTodo?, plannedTime?, deadline?, status?, todoStatus? }`）：手动修改并更新 updated_at；标签变更走 tags upsert + record_tags 重建。

### 模块 2: H5 详情页（前端）

- 路由 `/h5/records/$id`：展示全字段 + AI 识别结果（ai_result 只读展示）。
- 可编辑字段用表单控件（分类下拉、标签编辑、待办开关、时间选择器、状态下拉）。
- 保存用 tRPC mutation，成功后 invalidate 详情与相关列表（listToday / todos.list）。
- 列表项（今日流、待跟进）点击跳转到详情。

## 接口契约

- `records.getById(id) -> Record`
- `records.update(id, patch) -> Record`

## 数据模型

复用 records / tags / record_tags（1.data-foundation），无新增。

## 安全考虑

- protectedProcedure，按会话归属读写（security.md）。
- 手动修改不触发重新 AI 识别（保留用户修正），ai_result 仅展示历史识别。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 修改是否重识别 | 否 | 手动修正应覆盖 AI，避免被再次覆盖 |
| update 归属 | 与 records router 同层 | 复用记录读写，避免重复 procedure |
| 标签编辑 | upsert + 重建关联 | 与 quick-capture 标签写入一致 |
