import { db } from "@personal-lift/db";
import { recordTag, tag } from "@personal-lift/db/schema/tag";
import { eq, inArray } from "drizzle-orm";

/** 标签 upsert（按 name 复用已有）+ 建立与记录的关联 */
export async function attachTags(
	recordId: string,
	tagNames: string[]
): Promise<void> {
	if (tagNames.length === 0) {
		return;
	}
	await db
		.insert(tag)
		.values(tagNames.map((name) => ({ name })))
		.onConflictDoNothing({ target: tag.name });
	const rows = await db.select().from(tag).where(inArray(tag.name, tagNames));
	if (rows.length === 0) {
		return;
	}
	await db
		.insert(recordTag)
		.values(rows.map((row) => ({ recordId, tagId: row.id })))
		.onConflictDoNothing();
}

/** 重设记录的标签：清空原关联后重新关联 */
export async function setTags(
	recordId: string,
	tagNames: string[]
): Promise<void> {
	await db.delete(recordTag).where(eq(recordTag.recordId, recordId));
	await attachTags(recordId, tagNames);
}
