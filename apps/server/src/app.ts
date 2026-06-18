import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@personal-lift/api/context";
import { appRouter } from "@personal-lift/api/routers/index";
import { auth } from "@personal-lift/auth";
import { corsOrigins } from "@personal-lift/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// 纯 Hono 应用定义（不绑定运行时）。本地用 @hono/node-server，
// 云端用 hono/aws-lambda 适配器，二者复用同一个 app。
export const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: (origin) =>
			corsOrigins.includes(origin) ? origin : corsOrigins[0],
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: [
			"Content-Type",
			"Authorization",
			"trpc-accept",
			"x-trpc-source",
		],
		credentials: true,
	})
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => createContext({ context }),
	})
);

app.get("/", (c) => c.text("OK"));
