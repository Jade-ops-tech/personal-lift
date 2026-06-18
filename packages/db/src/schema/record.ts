import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { recordTag } from "./tag";

/** 固定分类（PRD 第一版分类固定，不建表） */
export const categoryEnum = pgEnum("category", [
	"学习",
	"工作",
	"生活",
	"想法",
	"待办",
	"其他",
]);

/** 记录生命周期状态 */
export const recordStatusEnum = pgEnum("record_status", [
	"normal",
	"pending",
	"done",
	"archived",
]);

/** 待办工作流状态（is_todo 时有值） */
export const todoStatusEnum = pgEnum("todo_status", [
	"pending",
	"in_progress",
	"done",
	"cancelled",
]);

/** AI 识别结果（结构契约由 2.ai-recognition 定义，此处宽松存储） */
export interface AiResult {
	category: string;
	deadline: string | null;
	emotion: string | null;
	follow_up_required: boolean;
	is_todo: boolean;
	planned_time: string | null;
	summary: string;
	tags: string[];
}

export const record = pgTable(
	"record",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		content: text("content").notNull(),
		category: categoryEnum("category").notNull().default("其他"),
		emotion: text("emotion"),
		isTodo: boolean("is_todo").notNull().default(false),
		followUpRequired: boolean("follow_up_required").notNull().default(false),
		aiResult: jsonb("ai_result").$type<AiResult>(),
		status: recordStatusEnum("status").notNull().default("normal"),
		todoStatus: todoStatusEnum("todo_status"),
		plannedTime: timestamp("planned_time", { withTimezone: true }),
		deadline: timestamp("deadline", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("record_user_id_idx").on(table.userId),
		index("record_is_todo_idx").on(table.isTodo),
		index("record_created_at_idx").on(table.createdAt),
	]
);

export const recordRelations = relations(record, ({ one, many }) => ({
	user: one(user, {
		fields: [record.userId],
		references: [user.id],
	}),
	recordTags: many(recordTag),
}));
