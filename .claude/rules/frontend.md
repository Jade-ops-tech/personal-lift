---
description: Web 前端与 UI 组件库规范（Vite + React 19 + TanStack + shadcn/base-ui）
globs: apps/web/**, packages/ui/**
---

# 前端规范

适用：`apps/web`（应用）与 `packages/ui`（共享组件库）。

## 技术栈

- 构建：**Vite**（非 Next.js —— 不要引入 `next/*` API、Image、App Router 约定）
- UI：**React 19**，函数组件
- 路由：**TanStack Router**（文件/代码式路由，`routeTree.gen.ts` 为生成产物，已 gitignore，禁止手改）
- 数据：**TanStack Query** + **tRPC client**（`@trpc/tanstack-react-query`）
- 表单：**TanStack React Form** + `@hookform/resolvers` + zod 校验
- 样式：**Tailwind**（`@tailwindcss/vite`），组件库基于 **base-ui** + **shadcn**，`cva` + `clsx` + `tailwind-merge`（`cn`）
- 主题：`next-themes`；toast：`sonner`；图标：`lucide-react`

## React

- 仅在顶层调用 hooks，禁止条件调用；正确填写依赖数组
- 列表用稳定唯一 `key`（优先 ID 而非数组索引）
- children 用嵌套写法，不要当 prop 传
- 不在组件内部定义组件
- React 19：用 `ref` 作为 prop，不用 `React.forwardRef`

## 数据获取

- 服务端状态走 TanStack Query + tRPC，不要手写 fetch 散落各处
- 类型从 `@personal-lift/api` 推断，保持端到端类型安全

## 样式

- class 由 Biome 自动排序（`clsx`/`cva`/`cn`），无需手排
- 复用 `packages/ui` 已有组件，不要在 app 内重复造基础组件

## 可访问性

- 语义化 HTML（`<button>`/`<nav>`）替代带 role 的 div
- 图片有意义的 alt、表单 label、正确的标题层级、键盘事件与鼠标事件并存
