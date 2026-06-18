import { db } from "@personal-lift/db";
import { record } from "@personal-lift/db/schema/record";
import { and, desc, eq, gte, type SQL } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { recognize } from "../recognition";
import { attachTags, setTags } from "../tags";

const categoryEnum = z.enum(["学习", "工作", "生活", "想法", "待办", "其他"]);
const statusEnum = z.enum(["normal", "pending", "done", "archived"]);
const todoStatusEnum = z.enum(["pending", "in_progress", "done", "cancelled"]);

const recordWithTags = {
	recordTags: { with: { tag: true } },
} as const;

function startOfToday(): Date {
	const start = new Date();
	start.setHours(0, 0, 0, 0);
	return start;
}

export const recordRouter = router({
	create: protectedProcedure
		.input(z.object({ content: z.string().trim().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const result = await recognize(input.content, new Date());
			const [row] = await db
				.insert(record)
				.values({
					userId: ctx.session.user.id,
					content: input.content,
					category: result.category,
					emotion: result.emotion,
					isTodo: result.is_todo,
					followUpRequired: result.follow_up_required,
					aiResult: result,
					status: result.is_todo ? "pending" : "normal",
					todoStatus: result.is_todo ? "pending" : null,
					plannedTime: result.planned_time
						? new Date(result.planned_time)
						: null,
					deadline: result.deadline ? new Date(result.deadline) : null,
				})
				.returning();
			if (!row) {
				throw new Error("创建记录失败");
			}
			await attachTags(row.id, result.tags);
			return db.query.record.findFirst({
				where: eq(record.id, row.id),
				with: recordWithTags,
			});
		}),

	listToday: protectedProcedure.query(({ ctx }) =>
		db.query.record.findMany({
			where: and(
				eq(record.userId, ctx.session.user.id),
				gte(record.createdAt, startOfToday())
			),
			orderBy: desc(record.createdAt),
			with: recordWithTags,
		})
	),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const row = await db.query.record.findFirst({
				where: and(
					eq(record.id, input.id),
					eq(record.userId, ctx.session.user.id)
				),
				with: recordWithTags,
			});
			return row ?? null;
		}),

	// 手动修改：不触发重新识别，保留用户修正
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				category: categoryEnum.optional(),
				tags: z.array(z.string()).optional(),
				isTodo: z.boolean().optional(),
				plannedTime: z.string().nullable().optional(),
				deadline: z.string().nullable().optional(),
				status: statusEnum.optional(),
				todoStatus: todoStatusEnum.nullable().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const owned = and(
				eq(record.id, input.id),
				eq(record.userId, ctx.session.user.id)
			) as SQL;
			const patch: Partial<typeof record.$inferInsert> = {};
			if (input.category) {
				patch.category = input.category;
			}
			if (typeof input.isTodo === "boolean") {
				patch.isTodo = input.isTodo;
			}
			if (input.status) {
				patch.status = input.status;
			}
			if (input.todoStatus !== undefined) {
				patch.todoStatus = input.todoStatus;
			}
			if (input.plannedTime !== undefined) {
				patch.plannedTime = input.plannedTime
					? new Date(input.plannedTime)
					: null;
			}
			if (input.deadline !== undefined) {
				patch.deadline = input.deadline ? new Date(input.deadline) : null;
			}
			if (Object.keys(patch).length > 0) {
				await db.update(record).set(patch).where(owned);
			}
			if (input.tags) {
				await setTags(input.id, input.tags);
			}
			return db.query.record.findFirst({ where: owned, with: recordWithTags });
		}),
});
