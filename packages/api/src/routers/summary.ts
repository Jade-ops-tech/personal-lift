import { db } from "@personal-lift/db";
import { record } from "@personal-lift/db/schema/record";
import { summary } from "@personal-lift/db/schema/summary";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { summarizeDaily, summarizeWeekly } from "../summarize";

type DayRecord = typeof record.$inferSelect;
type TaggedRecord = DayRecord & { recordTags: { tag: { name: string } }[] };

const TOP_N = 5;

/** ISO 周键，如 2026-W25 */
function isoWeekKey(input: Date): string {
	const d = new Date(
		Date.UTC(input.getFullYear(), input.getMonth(), input.getDate())
	);
	const dayNum = (d.getUTCDay() + 6) % 7;
	d.setUTCDate(d.getUTCDate() - dayNum + 3);
	const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
	const week =
		1 +
		Math.round(
			((d.getTime() - firstThursday.getTime()) / 86_400_000 -
				3 +
				((firstThursday.getUTCDay() + 6) % 7)) /
				7
		);
	return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** 本地周一 ~ 周日区间 */
function weekBounds(input: Date): [Date, Date] {
	const day = input.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	const monday = new Date(input);
	monday.setDate(input.getDate() + diff);
	monday.setHours(0, 0, 0, 0);
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	sunday.setHours(23, 59, 59, 999);
	return [monday, sunday];
}

function topCounts(
	counter: Record<string, number>
): { name: string; count: number }[] {
	return Object.entries(counter)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, TOP_N);
}

function buildWeeklyStats(records: TaggedRecord[], monday: Date) {
	const categoryCounter: Record<string, number> = {};
	const tagCounter: Record<string, number> = {};
	const trendCounter: Record<string, number> = {};
	const newIdeas: { id: string; content: string }[] = [];
	const completed: { id: string; content: string }[] = [];

	for (const r of records) {
		categoryCounter[r.category] = (categoryCounter[r.category] ?? 0) + 1;
		trendCounter[dateKey(r.createdAt)] =
			(trendCounter[dateKey(r.createdAt)] ?? 0) + 1;
		for (const rt of r.recordTags) {
			tagCounter[rt.tag.name] = (tagCounter[rt.tag.name] ?? 0) + 1;
		}
		if (r.category === "想法") {
			newIdeas.push({ id: r.id, content: r.content });
		}
		if (r.isTodo && r.todoStatus === "done") {
			completed.push({ id: r.id, content: r.content });
		}
	}

	const dailyTrend = Array.from({ length: 7 }, (_, i) => {
		const day = new Date(monday);
		day.setDate(monday.getDate() + i);
		const key = dateKey(day);
		return { date: key, count: trendCounter[key] ?? 0 };
	});

	return {
		dailyTrend,
		topCategories: topCounts(categoryCounter),
		topTags: topCounts(tagCounter),
		newIdeas,
		completed,
	};
}

function dateKey(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function parseDateKey(key?: string): Date {
	return key ? new Date(`${key}T00:00:00`) : new Date();
}

function dayBounds(d: Date): [Date, Date] {
	const start = new Date(d);
	start.setHours(0, 0, 0, 0);
	const end = new Date(d);
	end.setHours(23, 59, 59, 999);
	return [start, end];
}

function isOpenTodo(r: DayRecord): boolean {
	return r.isTodo && r.todoStatus !== "done" && r.todoStatus !== "cancelled";
}

/** 当天记录的确定性统计（不依赖 AI，保证准确） */
function buildStats(records: DayRecord[], now: Date) {
	const categoryCounts: Record<string, number> = {};
	const followUps: { id: string; content: string }[] = [];
	const overdue: { id: string; content: string }[] = [];
	const ideas: { id: string; content: string }[] = [];

	for (const r of records) {
		categoryCounts[r.category] = (categoryCounts[r.category] ?? 0) + 1;
		if (isOpenTodo(r)) {
			followUps.push({ id: r.id, content: r.content });
			if (r.deadline && r.deadline.getTime() < now.getTime()) {
				overdue.push({ id: r.id, content: r.content });
			}
		}
		if (r.category === "想法") {
			ideas.push({ id: r.id, content: r.content });
		}
	}

	return {
		recordCount: records.length,
		categoryCounts,
		followUps,
		overdue,
		ideas,
	};
}

/** 生成/重算今日总结（被 summary 与 admin 复用） */
export async function runDailySummary(userId: string, target: Date) {
	const now = new Date();
	const periodKey = dateKey(target);
	const [start, end] = dayBounds(target);

	const records = await db
		.select()
		.from(record)
		.where(
			and(
				eq(record.userId, userId),
				gte(record.createdAt, start),
				lte(record.createdAt, end)
			)
		);

	const stats = buildStats(records, now);
	const narrative = await summarizeDaily(records.map((r) => r.content));
	const content = {
		...stats,
		keywords: narrative.keywords,
		overview: narrative.overview,
	};

	const [row] = await db
		.insert(summary)
		.values({ userId, type: "daily", periodKey, content })
		.onConflictDoUpdate({
			target: [summary.userId, summary.type, summary.periodKey],
			set: { content, generatedAt: now, edited: false },
		})
		.returning();
	return row;
}

/** 生成/重算本周总结（被 summary 与 admin 复用） */
export async function runWeeklySummary(userId: string, target: Date) {
	const now = new Date();
	const periodKey = isoWeekKey(target);
	const [monday, sunday] = weekBounds(target);

	const records = await db.query.record.findMany({
		where: and(
			eq(record.userId, userId),
			gte(record.createdAt, monday),
			lte(record.createdAt, sunday)
		),
		with: { recordTags: { with: { tag: true } } },
	});

	const stats = buildWeeklyStats(records, monday);
	const openTexts = records.filter((r) => isOpenTodo(r)).map((r) => r.content);
	const narrative = await summarizeWeekly(
		records.map((r) => r.content),
		openTexts
	);
	const content = {
		...stats,
		mainContent: narrative.mainContent,
		nextWeekFollowUps: narrative.nextWeekFollowUps,
	};

	const [row] = await db
		.insert(summary)
		.values({ userId, type: "weekly", periodKey, content })
		.onConflictDoUpdate({
			target: [summary.userId, summary.type, summary.periodKey],
			set: { content, generatedAt: now, edited: false },
		})
		.returning();
	return row;
}

export const summaryRouter = router({
	generateDaily: protectedProcedure
		.input(z.object({ date: z.string().optional() }))
		.mutation(({ ctx, input }) =>
			runDailySummary(ctx.session.user.id, parseDateKey(input.date))
		),

	getDaily: protectedProcedure
		.input(z.object({ date: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const periodKey = input.date ?? dateKey(new Date());
			const [row] = await db
				.select()
				.from(summary)
				.where(
					and(
						eq(summary.userId, ctx.session.user.id),
						eq(summary.type, "daily"),
						eq(summary.periodKey, periodKey)
					)
				);
			return row ?? null;
		}),

	generateWeekly: protectedProcedure
		.input(z.object({ date: z.string().optional() }))
		.mutation(({ ctx, input }) =>
			runWeeklySummary(ctx.session.user.id, parseDateKey(input.date))
		),

	getWeekly: protectedProcedure
		.input(z.object({ date: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const periodKey = isoWeekKey(parseDateKey(input.date));
			const [row] = await db
				.select()
				.from(summary)
				.where(
					and(
						eq(summary.userId, ctx.session.user.id),
						eq(summary.type, "weekly"),
						eq(summary.periodKey, periodKey)
					)
				);
			return row ?? null;
		}),
});
