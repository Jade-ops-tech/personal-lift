import { extractTags } from "./recognition";

/**
 * 总结的自然语言部分（第一版规则 mock）。统计型字段由 summary router 确定性计算，
 * 这里只产出关键词与概括文案；预留同接口便于后续替换为真实模型。
 */
export interface DailyNarrative {
	keywords: string[];
	overview: string;
}

export interface WeeklyNarrative {
	mainContent: string;
	nextWeekFollowUps: string[];
}

const TOP_KEYWORDS = 6;
const TOP_FOLLOWUPS = 5;

/** 跨多条文本提取高频标签作为关键词 */
function topKeywords(texts: string[]): string[] {
	const counter: Record<string, number> = {};
	for (const text of texts) {
		for (const tag of extractTags(text)) {
			counter[tag] = (counter[tag] ?? 0) + 1;
		}
	}
	return Object.entries(counter)
		.sort((a, b) => b[1] - a[1])
		.slice(0, TOP_KEYWORDS)
		.map(([name]) => name);
}

export function summarizeDaily(texts: string[]): Promise<DailyNarrative> {
	if (texts.length === 0) {
		return Promise.resolve({ keywords: [], overview: "" });
	}
	return Promise.resolve({
		keywords: topKeywords(texts),
		overview: `今天共记录 ${texts.length} 条。`,
	});
}

export function summarizeWeekly(
	texts: string[],
	pendingTexts: string[]
): Promise<WeeklyNarrative> {
	if (texts.length === 0) {
		return Promise.resolve({ mainContent: "", nextWeekFollowUps: [] });
	}
	return Promise.resolve({
		mainContent: `本周共记录 ${texts.length} 条，仍有 ${pendingTexts.length} 项待跟进。`,
		nextWeekFollowUps: pendingTexts.slice(0, TOP_FOLLOWUPS),
	});
}
