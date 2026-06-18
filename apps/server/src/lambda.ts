import { handle } from "hono/aws-lambda";

import { app } from "./app";

// AWS Lambda 入口。Function URL / API Gateway v2 事件都由 handle 适配。
export const handler = handle(app);
