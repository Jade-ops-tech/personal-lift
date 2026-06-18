# admin-records — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-06-17 | v1 | 初始设计 |

## 项目架构

- 架构类型: Turborepo monorepo
- 涉及层: 认证（`packages/auth`）、API（`packages/api`）、前端（`apps/web`，`/admin`）

## 功能模块设计

### 模块 1: 后台登录（前端 + 认证）

- 路由 `/admin/login`：邮箱+密码表单（TanStack Form + zod），调用 better-auth 客户端登录。
- `/admin/*` 受保护：未登录重定向到登录页（路由 beforeLoad 校验会话）。
- 复用 1.data-foundation 已接入的 better-auth；本 feature 仅做前端登录页与守卫，必要时补单用户初始账号创建脚本/种子。

### 模块 2: 记录管理查询（API）

`packages/api` 新增 `admin` 子 router（全部 protectedProcedure）：

- `admin.records.list`：input `{ date?, category?, tagId?, isTodo?, status?, keyword?, page? }`，多维筛选 + 原始内容模糊搜索 + 分页，按 created_at 倒序，含标签联表。

### 模块 3: 记录操作（API）

- `admin.records.update`（id, `{ category?, tagIds?, status? }`）：编辑分类/标签/状态。
- `admin.records.remove`（id）：删除记录（级联 record_tags）。

### 模块 4: 后台记录管理页（前端）

- 路由 `/admin/records`：筛选区（日期/分类/标签/是否待办/状态）+ 搜索框 + 记录表格。
- 行操作：查看详情、编辑（分类/标签/状态）、删除（二次确认）。
- 操作用 tRPC mutation，成功后 invalidate 列表查询。

## 接口契约

- `admin.records.list({...filters}) -> { items: Record[], total }`
- `admin.records.update(id, patch) -> Record`
- `admin.records.remove(id) -> { ok }`

## 数据模型

复用 records / tags / record_tags（1.data-foundation）。

## 安全考虑

- `admin.*` 全部 protectedProcedure；前端 `/admin` 路由守卫 + 服务端鉴权双层（不依赖前端隐藏）。
- 删除为不可逆操作，前端二次确认（security.md / web-design）。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 后台位置 | apps/web `/admin` 路由分区 | 已确认端架构，复用同一 app 与 tRPC client |
| 鉴权层 | 路由守卫 + protectedProcedure | 前端体验 + 服务端强校验 |
| 列表分页 | 服务端分页 | 记录量增长后避免全量拉取 |
