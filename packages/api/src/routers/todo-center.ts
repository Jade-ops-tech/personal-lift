import { db } from "@personal-lift/db";
import { record } from "@personal-lift/db/schema/record";
import {
	and,
	desc,
	eq,
	gte,
	isNull,
	lt,
	lte,
	notInArray,
	or,
	type SQL,
} from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const recordWithTags = { recordTags: { with: { tag: true } } } as const;

const filterSchema = z.enum([
	"today",
	"tomorrow",
	"thisWeek",
	"overdue",
	"noTime",
	"all",
]);

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function endOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d;
}

/** 本周（周一 ~ 周日）区间 */
function weekRange(now: Date): [Date, Date] {
	const day = now.getDay();
	const diffToMonday = day === 0 ? -6 : 1 - day;
	const monday = startOfDay(new Date(now.getTime() + diffToMonday * DAY_MS));
	return [monday, endOfDay(new Date(monday.getTime() + 6 * DAY_MS))];
}

/** plannedTime 或 deadline 落在 [start, end] 区间 */
function inRange(start: Date, end: Date): SQL | undefined {
	return or(
		and(gte(record.plannedTime, start), lte(record.plannedTime, end)),
		and(gte(record.deadline, start), lte(record.deadline, end))
	);
}

function filterCondition(
	filter: z.infer<typeof filterSchema>,
	now: Date
): SQL | undefined {
	if (filter === "today") {
		return inRange(startOfDay(now), endOfDay(now));
	}
	if (filter === "tomorrow") {
		const tomorrow = new Date(now.getTime() + DAY_MS);
		return inRange(startOfDay(tomorrow), endOfDay(tomorrow));
	}
	if (filter === "thisWeek") {
		const [start, end] = weekRange(now);
		return inRange(start, end);
	}
	if (filter === "overdue") {
		return and(
			lt(record.deadline, now),
			notInArray(record.todoStatus, ["done", "cancelled"])
		);
	}
	if (filter === "noTime") {
		return and(isNull(record.plannedTime), isNull(record.deadline));
	}
	return;
}

/** 校验记录归属当前用户的待办，返回更新后的记录 */
function ownTodo(userId: string, id: string): SQL {
	return and(
		eq(record.id, id),
		eq(record.userId, userId),
		eq(record.isTodo, true)
	) as SQL;
}

export const todoCenterRouter = router({
	list: protectedProcedure
		.input(z.object({ filter: filterSchema }))
		.query(({ ctx, input }) =>
			db.query.record.findMany({
				where: and(
					eq(record.userId, ctx.session.user.id),
					eq(record.isTodo, true),
					filterCondition(input.filter, new Date())
				),
				orderBy: desc(record.createdAt),
				with: recordWithTags,
			})
		),

	complete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [row] = await db
				.update(record)
				.set({ todoStatus: "done", status: "done" })
				.where(ownTodo(ctx.session.user.id, input.id))
				.returning();
			return row;
		}),

	cancel: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [row] = await db
				.update(record)
				.set({ todoStatus: "cancelled" })
				.where(ownTodo(ctx.session.user.id, input.id))
				.returning();
			return row;
		}),

	updatePlannedTime: protectedProcedure
		.input(z.object({ id: z.string(), plannedTime: z.string().nullable() }))
		.mutation(async ({ ctx, input }) => {
			const [row] = await db
				.update(record)
				.set({
					plannedTime: input.plannedTime ? new Date(input.plannedTime) : null,
				})
				.where(ownTodo(ctx.session.user.id, input.id))
				.returning();
			return row;
		}),

	updateDeadline: protectedProcedure
		.input(z.object({ id: z.string(), deadline: z.string().nullable() }))
		.mutation(async ({ ctx, input }) => {
			const [row] = await db
				.update(record)
				.set({ deadline: input.deadline ? new Date(input.deadline) : null })
				.where(ownTodo(ctx.session.user.id, input.id))
				.returning();
			return row;
		}),

	convertFromRecord: protectedProcedure
		.input(z.object({ recordId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [row] = await db
				.update(record)
				.set({ isTodo: true, todoStatus: "pending", status: "pending" })
				.where(
					and(
						eq(record.id, input.recordId),
						eq(record.userId, ctx.session.user.id)
					)
				)
				.returning();
			return row;
		}),
});
