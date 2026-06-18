import { protectedProcedure, publicProcedure, router } from "../index";
import { adminRouter } from "./admin";
import { recordRouter } from "./record";
import { summaryRouter } from "./summary";
import { todoRouter } from "./todo";
import { todoCenterRouter } from "./todo-center";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	privateData: protectedProcedure.query(({ ctx }) => ({
		message: "This is private",
		user: ctx.session.user,
	})),
	todo: todoRouter,
	record: recordRouter,
	todoCenter: todoCenterRouter,
	summary: summaryRouter,
	admin: adminRouter,
});
export type AppRouter = typeof appRouter;
