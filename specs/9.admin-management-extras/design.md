# admin-management-extras — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始设计 |

## 项目架构

- 架构类型: Turborepo monorepo
- 涉及层: API（`packages/api` 的 admin router）、前端（`apps/web`，`/admin/*`）

## 功能模块设计

### 模块 1: 后台待办管理

- API（admin router）：`admin.todos.list`（含是否逾期计算 + 筛选）、复用/包装 4.todo-center 的状态/时间操作为 admin 版（`admin.todos.update`）。
- 前端 `/admin/todos`：待办表格（全字段 + 逾期徽标）+ 状态/时间编辑、标记完成、取消。

### 模块 2: 分类与标签管理

- API：
  - `admin.categories.list`：返回固定分类枚举（只读）。
  - `admin.tags.list` / `admin.tags.create` / `admin.tags.merge`（sourceId→targetId，迁移 record_tags 后删除源标签）/ `admin.tags.remove`（仅允许删无关联或强制解关联）。
- 前端 `/admin/tags`：标签列表 + 新增/合并/删除操作。

### 模块 3: 总结管理

- API：
  - `admin.summaries.getDaily` / `admin.summaries.getWeekly`（按日期/周查看）。
  - `admin.summaries.regenerate`（type, periodKey）：复用 5/8 的 generateDaily/generateWeekly。
  - `admin.summaries.update`（id, content）：手动编辑总结内容，置 edited=true。
- 前端 `/admin/summaries`：按日期/周查看 + 重新生成按钮 + 内容编辑器。

## 接口契约

- `admin.todos.list / update`
- `admin.tags.list / create / merge / remove`
- `admin.categories.list`
- `admin.summaries.getDaily / getWeekly / regenerate / update`

## 数据模型

复用 records / tags / record_tags / summaries（1.data-foundation）。标签合并需在事务内迁移 record_tags 再删源标签。

## 安全考虑

- 全部挂在 6.admin-records 的 admin router（protectedProcedure）下，未登录拒绝（security.md）。
- 标签合并/删除、总结编辑为破坏性操作，前端二次确认。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 待办操作复用 | 包装 4.todo-center 逻辑 | 避免重复实现状态/时间流转 |
| 重新生成复用 | 调 5/8 生成 procedure | 单一生成来源，避免分叉 |
| 标签合并 | 事务迁移关联 + 删源 | 保证数据一致，无悬挂关联 |
| 分类管理 | 只读枚举 | PRD 第一版分类固定 |
