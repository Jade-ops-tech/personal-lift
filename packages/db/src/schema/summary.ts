import { relations } from "drizzle-orm";
import {
	boolean,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const summaryTypeEnum = pgEnum("summary_type", ["daily", "weekly"]);

/**
 * 总结内容为结构化 jsonb：
 * - daily: { recordCount, categoryCounts, keywords[], overview, followUps[], overdue[], ideas[] }
 * - weekly: { dailyTrend[], topCategories[], topTags[], mainContent, newIdeas[], completed[], nextWeekFollowUps[] }
 */
export const summary = pgTable(
	"summary",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: summaryTypeEnum("type").notNull(),
		// 日期（daily, 如 2026-06-17）或 ISO 周（weekly, 如 2026-W25）
		periodKey: text("period_key").notNull(),
		content: jsonb("content").notNull(),
		generatedAt: timestamp("generated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		edited: boolean("edited").notNull().default(false),
	},
	(table) => [
		unique("summary_user_type_period_uq").on(
			table.userId,
			table.type,
			table.periodKey
		),
	]
);

export const summaryRelations = relations(summary, ({ one }) => ({
	user: one(user, {
		fields: [summary.userId],
		references: [user.id],
	}),
}));
