---
description: 命名、格式、import、TypeScript 风格规范，由 Biome/Ultracite 强制
---

# 代码风格

格式化与 lint 全部由 **Biome（Ultracite 预设）** 接管，提交前由 husky pre-commit 自动 `ultracite fix`。手写代码须与之一致，避免被自动改写。

## 格式（来自 biome.json）

- 缩进：**Tab**（非空格）
- 字符串：**双引号**
- import 自动排序（`organizeImports: on`），不要手动调整顺序
- Tailwind class 自动排序，作用于 `clsx` / `cva` / `cn`，class 字符串无需手排

## TypeScript

- 优先 `unknown` 而非 `any`；不可变值用 `as const`
- 不写可推断的显式类型（`noInferrableTypes`），但函数公共边界的参数/返回值类型保留以增强可读性
- 用类型收窄替代类型断言
- `const` 默认，`let` 仅在重新赋值时，禁止 `var`
- 禁止参数重新赋值（`noParameterAssign`）；默认参数放最后（`useDefaultParameterLast`）
- enum 必须显式初始化（`useEnumInitializers`）

## JS/TS 习惯

- 回调与短函数用箭头函数
- 用 `for...of` 替代 `.forEach()` 和索引 `for`
- 用 `?.` 和 `??` 做安全访问；模板字面量替代字符串拼接
- 用解构赋值；early return 替代深层嵌套
- 避免 barrel file（index 全量 re-export）；优先具名导入而非命名空间导入

## 命名

- 用描述性名称替代魔法数字，抽成具名常量
- 把复杂条件抽成语义化布尔变量
