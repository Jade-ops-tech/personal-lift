import { serve } from "@hono/node-server";

import { app } from "./app";

// 本地开发入口：监听端口。云端 Lambda 走 src/lambda.ts。
serve(
	{
		fetch: app.fetch,
		hostname: "127.0.0.1",
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	}
);
