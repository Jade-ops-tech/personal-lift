import { db } from "@personal-lift/db";
import { record } from "@personal-lift/db/schema/record";
import { summary } from "@personal-lift/db/schema/summary";
import { recordTag, tag } from "@personal-lift/db/schema/tag";
import { and, count, desc, eq, inArray, type SQL } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { runDailySummary, runWeeklySummary } from "./summary";

const recordWithTags = { recordTags: { with: { tag: true } } } as const;
const todoStatusEnum = z.enum(["pending", "in_progress", "done", "cancelled"]);
const CATEGORIES = ["学习", "工作", "生活", "想法", "待办", "其他"] as const;

function parseDate(date?: string): Date {
	return date ? new Date(`${date}T00:00:00`) : new Date();
}

const adminTodosRouter = router({
	list: protectedProcedure.query(({ ctx }) =>
		db.query.record.findMany({
			where: and(
				eq(record.userId, ctx.session.user.id),
				eq(record.isTodo, true)
			),
			orderBy: desc(record.createdAt),
			with: recordWithTags,
		})
	),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				todoStatus: todoStatusEnum.optional(),
				plannedTime: z.string().nullable().optional(),
				deadline: z.string().nullable().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const owned = and(
				eq(record.id, input.id),
				eq(record.userId, ctx.session.user.id)
			) as SQL;
			const patch: Partial<typeof record.$inferInsert> = {};
			if (input.todoStatus) {
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
			return db.query.record.findFirst({ where: owned, with: recordWithTags });
		}),
});

const adminTagsRouter = router({
	list: protectedProcedure.query(() =>
		db
			.select({ id: tag.id, name: tag.name, count: count(recordTag.recordId) })
			.from(tag)
			.leftJoin(recordTag, eq(recordTag.tagId, tag.id))
			.groupBy(tag.id)
			.orderBy(tag.name)
	),

	create: protectedProcedure
		.input(z.object({ name: z.string().trim().min(1) }))
		.mutation(async ({ input }) => {
			const [row] = await db
				.insert(tag)
				.values({ name: input.name })
				.onConflictDoNothing({ target: tag.name })
				.returning();
			return row ?? null;
		}),

	// 合并：把 source 的关联迁到 target，再删除 source 标签
	merge: protectedProcedure
		.input(z.object({ sourceId: z.string(), targetId: z.string() }))
		.mutation(async ({ input }) => {
			await db.transaction(async (tx) => {
				const targetRecs = await tx
					.select({ recordId: recordTag.recordId })
					.from(recordTag)
					.where(eq(recordTag.tagId, input.targetId));
				const ids = targetRecs.map((r) => r.recordId);
				if (ids.length > 0) {
					await tx
						.delete(recordTag)
						.where(
							and(
								eq(recordTag.tagId, input.sourceId),
								inArray(recordTag.recordId, ids)
							)
						);
				}
				await tx
					.update(recordTag)
					.set({ tagId: input.targetId })
					.where(eq(recordTag.tagId, input.sourceId));
				await tx.delete(tag).where(eq(tag.id, input.sourceId));
			});
			return { ok: true };
		}),

	remove: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			await db.delete(tag).where(eq(tag.id, input.id));
			return { ok: true };
		}),
});

const adminCategoriesRouter = router({
	list: protectedProcedure.query(() => CATEGORIES),
});

const adminSummariesRouter = router({
	list: protectedProcedure
		.input(z.object({ type: z.enum(["daily", "weekly"]) }))
		.query(({ ctx, input }) =>
			db
				.select()
				.from(summary)
				.where(
					and(
						eq(summary.userId, ctx.session.user.id),
						eq(summary.type, input.type)
					)
				)
				.orderBy(desc(summary.periodKey))
		),

	regenerate: protectedProcedure
		.input(
			z.object({
				type: z.enum(["daily", "weekly"]),
				date: z.string().optional(),
			})
		)
		.mutation(({ ctx, input }) => {
			const target = parseDate(input.date);
			return input.type === "daily"
				? runDailySummary(ctx.session.user.id, target)
				: runWeeklySummary(ctx.session.user.id, target);
		}),

	update: protectedProcedure
		.input(z.object({ id: z.string(), content: z.unknown() }))
		.mutation(async ({ ctx, input }) => {
			const [row] = await db
				.update(summary)
				.set({ content: input.content, edited: true })
				.where(
					and(eq(summary.id, input.id), eq(summary.userId, ctx.session.user.id))
				)
				.returning();
			return row;
		}),
});

export const adminExtrasRouters = {
	todos: adminTodosRouter,
	tags: adminTagsRouter,
	categories: adminCategoriesRouter,
	summaries: adminSummariesRouter,
};
