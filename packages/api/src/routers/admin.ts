import { db } from "@personal-lift/db";
import { record } from "@personal-lift/db/schema/record";
import { recordTag } from "@personal-lift/db/schema/tag";
import {
	and,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	lte,
	type SQL,
} from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { setTags } from "../tags";
import { adminExtrasRouters } from "./admin-extras";

const recordWithTags = { recordTags: { with: { tag: true } } } as const;

const categoryEnum = z.enum(["学习", "工作", "生活", "想法", "待办", "其他"]);
const statusEnum = z.enum(["normal", "pending", "done", "archived"]);

const listInput = z.object({
	date: z.string().optional(),
	category: categoryEnum.optional(),
	tagId: z.string().optional(),
	isTodo: z.boolean().optional(),
	status: statusEnum.optional(),
	keyword: z.string().optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(20),
});

function dayBounds(dateKey: string): [Date, Date] {
	const start = new Date(`${dateKey}T00:00:00`);
	const end = new Date(`${dateKey}T00:00:00`);
	end.setHours(23, 59, 59, 999);
	return [start, end];
}

function buildwhere(userId: string, input: z.infer<typeof listInput>): SQL {
	const conds: SQL[] = [eq(record.userId, userId)];
	if (input.category) {
		conds.push(eq(record.category, input.category));
	}
	if (input.status) {
		conds.push(eq(record.status, input.status));
	}
	if (typeof input.isTodo === "boolean") {
		conds.push(eq(record.isTodo, input.isTodo));
	}
	if (input.keyword) {
		conds.push(ilike(record.content, `%${input.keyword}%`));
	}
	if (input.date) {
		const [start, end] = dayBounds(input.date);
		conds.push(gte(record.createdAt, start), lte(record.createdAt, end));
	}
	if (input.tagId) {
		conds.push(
			inArray(
				record.id,
				db
					.select({ id: recordTag.recordId })
					.from(recordTag)
					.where(eq(recordTag.tagId, input.tagId))
			)
		);
	}
	return and(...conds) as SQL;
}

const recordsRouter = router({
	list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
		const where = buildwhere(ctx.session.user.id, input);
		const items = await db.query.record.findMany({
			where,
			orderBy: desc(record.createdAt),
			limit: input.pageSize,
			offset: (input.page - 1) * input.pageSize,
			with: recordWithTags,
		});
		const [total] = await db
			.select({ value: count() })
			.from(record)
			.where(where);
		return { items, total: total?.value ?? 0 };
	}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				category: categoryEnum.optional(),
				status: statusEnum.optional(),
				tags: z.array(z.string()).optional(),
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
			if (input.status) {
				patch.status = input.status;
			}
			if (Object.keys(patch).length > 0) {
				await db.update(record).set(patch).where(owned);
			}
			if (input.tags) {
				await setTags(input.id, input.tags);
			}
			return db.query.record.findFirst({ where: owned, with: recordWithTags });
		}),

	remove: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await db
				.delete(record)
				.where(
					and(eq(record.id, input.id), eq(record.userId, ctx.session.user.id))
				);
			return { ok: true };
		}),
});

export const adminRouter = router({
	records: recordsRouter,
	...adminExtrasRouters,
});
