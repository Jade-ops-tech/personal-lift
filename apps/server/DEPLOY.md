# 后端部署到 AWS Lambda（SAM）

后端是个标准 Hono 应用，借 `hono/aws-lambda` 适配器跑在 Lambda 上，用 **Function URL** 对外暴露 HTTPS。
本地开发（`pnpm dev:server`，监听 3000）完全不受影响 —— 三个入口复用同一个 `src/app.ts`：

| 文件 | 用途 |
| --- | --- |
| `src/app.ts` | 纯 Hono 应用（CORS / 认证 / tRPC 路由） |
| `src/index.ts` | 本地：`@hono/node-server` 监听 3000 |
| `src/lambda.ts` | 云端：`export const handler = handle(app)` |

打包：`build-lambda.mjs` 用 esbuild 把 `src/lambda.ts` 及全部依赖（含 workspace 包源码）打成单文件
`dist-lambda/index.js`（CJS，自包含），SAM 直接 zip 上传，无需 `node_modules`。

---

## 0. 前置条件（只需一次）

1. **AWS 账号** + 一个有 Lambda/IAM/CloudFormation/S3 权限的 IAM 用户。
2. **配置凭证**：`aws configure`（填 Access Key / Secret / 默认区域 `us-east-1`）。
   验证：`aws sts get-caller-identity` 能返回你的账号 ID。
   > 当前这台机器跑该命令报 SSL 错，说明凭证未配或网络/代理拦了到 AWS 的连接，先解决这一步。
3. **安装 SAM CLI**：`brew install aws-sam-cli`，验证 `sam --version`。
4. 区域建议选 **us-east-1**（与现有 Neon 库同区，延迟最低）。

---

## 1. 构建 Lambda 包

```bash
pnpm --filter server build:lambda
# 产物：apps/server/dist-lambda/index.js
```

## 2. 首次部署

```bash
cd apps/server
sam deploy --guided
```

交互式提示按下面填（其余默认即可）：

- **Stack Name**：`personal-lift-api`
- **AWS Region**：`us-east-1`
- **Parameter DatabaseUrl**：你的 Neon 连接串（同 `apps/server/.env` 里的 `DATABASE_URL`）
- **Parameter BetterAuthSecret**：≥32 位随机串（可复用 `.env` 里的 `BETTER_AUTH_SECRET`）
- **Parameter CorsOrigin**：前端线上来源，如 `https://你的前端域名`（先本地测就先填 `http://127.0.0.1:5174`）
- **Parameter BetterAuthUrl**：先留默认 `http://localhost:3000`（下一步回填）
- 允许创建 IAM 角色：`Y`
- 保存配置到 samconfig.toml：`Y`

部署完成后，输出里会有 **`ApiUrl`**，形如：
`https://abcd1234.lambda-url.us-east-1.on.aws/`

## 3. 回填 BetterAuthUrl 再部署一次

better-auth 的 `baseURL` 必须等于后端公网地址。把上一步的 `ApiUrl`（**去掉结尾的 `/`**）回填：

```bash
sam deploy --parameter-overrides \
  "DatabaseUrl=...同上..." \
  "BetterAuthSecret=...同上..." \
  "CorsOrigin=...同上..." \
  "BetterAuthUrl=https://abcd1234.lambda-url.us-east-1.on.aws"
```

> 也可以直接编辑生成的 `samconfig.toml` 里的 `parameter_overrides`，然后 `sam deploy`。

## 4. 让前端指向 Lambda

```ini
# apps/web/.env
VITE_SERVER_URL=https://abcd1234.lambda-url.us-east-1.on.aws   # 注意：无尾斜杠
```

然后重新构建/部署前端（`pnpm --filter web build`）。
同时确保后端 `CorsOrigin` = 前端真正访问的来源，否则浏览器会被 CORS 拦。

## 5. 验证

```bash
curl https://abcd1234.lambda-url.us-east-1.on.aws/            # → OK
curl https://abcd1234.lambda-url.us-east-1.on.aws/trpc/healthCheck
# → {"result":{"data":"OK"}}
```

浏览器打开前端 → 首页「接口状态」应显示已连接 → 登录 / 记录流走通即成功。

---

## 日常更新

改完后端代码后：

```bash
pnpm --filter server build:lambda && (cd apps/server && sam deploy)
```

查看日志：`sam logs -n HonoFunction --stack-name personal-lift-api --tail`

---

## 说明与注意

- **AuthType: NONE**：Function URL 公网可访问，鉴权由应用层 better-auth 负责（与本地一致）。
- **CORS / Cookie**：`src/app.ts` 已设 `credentials: true`，better-auth 的 cookie 已配
  `sameSite:"none"; secure:true; httpOnly:true`，跨域登录开箱可用 —— 只要 `CorsOrigin` 填的是
  前端的精确来源（协议+域名+端口都要对）。
- **数据库连接**（可选优化）：现在用 `pg` 走 TCP 连 Neon，能用；高并发下 Lambda 冷启动会反复建连，
  生产建议换 Neon serverless 驱动（`@neondatabase/serverless` + `drizzle-orm/neon-serverless`）以
  复用连接、加快冷启动。作业阶段先不动。
- **拆栈**：本模板只部署后端。前端是纯静态（Vite 产物），可单独放 S3+CloudFront / Vercel / Netlify，
  把它的 `VITE_SERVER_URL` 指向这里的 `ApiUrl` 即可。
