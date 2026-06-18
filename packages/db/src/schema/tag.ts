import { relations } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { record } from "./record";

export const tag = pgTable("tag", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull().unique(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const recordTag = pgTable(
	"record_tag",
	{
		recordId: uuid("record_id")
			.notNull()
			.references(() => record.id, { onDelete: "cascade" }),
		tagId: uuid("tag_id")
			.notNull()
			.references(() => tag.id, { onDelete: "cascade" }),
	},
	(table) => [
		primaryKey({ columns: [table.recordId, table.tagId] }),
		index("record_tag_tag_id_idx").on(table.tagId),
	]
);

export const tagRelations = relations(tag, ({ many }) => ({
	recordTags: many(recordTag),
}));

export const recordTagRelations = relations(recordTag, ({ one }) => ({
	record: one(record, {
		fields: [recordTag.recordId],
		references: [record.id],
	}),
	tag: one(tag, {
		fields: [recordTag.tagId],
		references: [tag.id],
	}),
}));
