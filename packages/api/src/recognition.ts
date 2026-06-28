import { env } from "@personal-lift/env/server";
import { z } from "zod";

/**
 * 统一识别接口（第一版用规则 mock，预留同接口便于后续替换为真实模型）。
 * 出口签名 recognize(text, now) 不变，调用方无需改动。
 */
export const recognitionResultSchema = z.object({
	category: z.enum(["学习", "工作", "生活", "想法", "待办", "其他"]),
	tags: z.array(z.string()),
	is_todo: z.boolean(),
	planned_time: z.string().nullable(),
	deadline: z.string().nullable(),
	emotion: z.string().nullable(),
	follow_up_required: z.boolean(),
	summary: z.string(),
});

export type RecognitionResult = z.infer<typeof recognitionResultSchema>;
type Category = RecognitionResult["category"];

export const aiRecognitionConfigSchema = z.object({
	apiKey: z.string().trim().optional(),
	baseUrl: z.string().trim().optional(),
	model: z.string().trim().optional(),
	provider: z.enum(["openai", "deepseek", "custom"]).optional(),
});

export type AiRecognitionConfig = z.infer<typeof aiRecognitionConfigSchema>;

const CATEGORY_KEYWORDS: Record<
	Exclude<Category, "待办" | "其他">,
	string[]
> = {
	学习: ["学习", "看书", "课程", "教程", "研究", "理解", "看了", "读", "笔记"],
	工作: [
		"项目",
		"需求",
		"代码",
		"页面",
		"测试",
		"客户",
		"会议",
		"改",
		"部署",
		"接口",
		"bug",
		"上线",
	],
	生活: [
		"吃饭",
		"运动",
		"家务",
		"朋友",
		"照片",
		"生活",
		"睡",
		"买",
		"锻炼",
		"做饭",
	],
	想法: ["想到", "可以做", "灵感", "想法", "以后做", "或许", "点子"],
};

const TODO_KEYWORDS = [
	"记得",
	"要做",
	"别忘了",
	"deadline",
	"截止",
	"之前",
	"明天",
	"后天",
	"周末",
	"下周",
	"完成",
	"提交",
	"跟进",
	"处理",
	"前",
];

const TAG_KEYWORDS = [
	"React",
	"Server Components",
	"缓存",
	"登录页",
	"按钮",
	"按钮样式",
	"测试验收",
	"项目",
	"Notion",
	"小红书",
	"工具",
	"会议",
	"部署",
	"接口",
	"样式",
];

const EMOTION_KEYWORDS: Record<string, string[]> = {
	困惑: ["没懂", "不懂", "困惑", "迷茫", "没完全"],
	开心: ["开心", "高兴", "不错", "搞定", "顺利"],
	疲惫: ["累", "疲惫", "好难"],
};

const DATE_FULL = /(\d{4})-(\d{1,2})-(\d{1,2})/;
const DATE_CN = /(\d{1,2})月(\d{1,2})[号日]/;
const DEADLINE_HINT = /前|截止|deadline/i;
const TRAILING_SLASH = /\/$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function classifyCategory(text: string): Category {
	let best: Category = "其他";
	let bestScore = 0;
	for (const [category, words] of Object.entries(CATEGORY_KEYWORDS)) {
		const score = words.filter((w) => text.includes(w)).length;
		if (score > bestScore) {
			bestScore = score;
			best = category as Category;
		}
	}
	return best;
}

/** 提取标签：命中预设标签词（供 summarize 复用） */
export function extractTags(text: string): string[] {
	return [...new Set(TAG_KEYWORDS.filter((t) => text.includes(t)))];
}

function detectEmotion(text: string): string | null {
	for (const [emotion, words] of Object.entries(EMOTION_KEYWORDS)) {
		if (words.some((w) => text.includes(w))) {
			return emotion;
		}
	}
	return null;
}

function applyHour(date: Date, text: string): Date {
	if (text.includes("下午")) {
		date.setHours(14);
	} else if (text.includes("上午")) {
		date.setHours(9);
	} else if (text.includes("晚上")) {
		date.setHours(20);
	}
	return date;
}

/** 解析文本中的时间，归一化为基于 now 的 Date，模糊或无时间返回 null */
function resolveDate(text: string, now: Date): Date | null {
	const full = text.match(DATE_FULL);
	if (full) {
		return new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3]));
	}
	const cn = text.match(DATE_CN);
	if (cn) {
		return new Date(now.getFullYear(), Number(cn[1]) - 1, Number(cn[2]));
	}

	const base = new Date(now);
	base.setHours(0, 0, 0, 0);
	if (text.includes("后天")) {
		return applyHour(new Date(base.getTime() + 2 * DAY_MS), text);
	}
	if (text.includes("明天")) {
		return applyHour(new Date(base.getTime() + DAY_MS), text);
	}
	if (text.includes("今天")) {
		return applyHour(base, text);
	}
	if (text.includes("下周")) {
		return new Date(base.getTime() + 7 * DAY_MS);
	}
	if (text.includes("周末")) {
		const add = (6 - base.getDay() + 7) % 7 || 6;
		return new Date(base.getTime() + add * DAY_MS);
	}
	if (text.includes("本周") || text.includes("这周")) {
		const add = (7 - base.getDay()) % 7;
		return new Date(base.getTime() + add * DAY_MS);
	}
	return null;
}

const OPENAI_COMPATIBLE_ENDPOINTS = {
	custom: "",
	deepseek: "https://api.deepseek.com/chat/completions",
	openai: "https://api.openai.com/v1/chat/completions",
} as const;

function normalizeEndpoint(config: AiRecognitionConfig): string | null {
	if (config.provider === "custom") {
		return config.baseUrl?.replace(TRAILING_SLASH, "") || null;
	}
	const provider = config.provider ?? "openai";
	return OPENAI_COMPATIBLE_ENDPOINTS[provider];
}

function shouldUseModel(
	config?: AiRecognitionConfig
): config is AiRecognitionConfig {
	return (
		env.NODE_ENV === "production" && Boolean(config?.apiKey && config.model)
	);
}

function recognizeByRules(text: string, now: Date): RecognitionResult {
	const isTodo = TODO_KEYWORDS.some((w) => text.includes(w));
	const category = classifyCategory(text);
	const resolved = resolveDate(text, now);
	const isDeadline = DEADLINE_HINT.test(text);

	const result: RecognitionResult = {
		category,
		tags: extractTags(text),
		is_todo: isTodo,
		planned_time: resolved && !isDeadline ? resolved.toISOString() : null,
		deadline: resolved && isDeadline ? resolved.toISOString() : null,
		emotion: detectEmotion(text),
		follow_up_required: isTodo || category === "想法",
		summary: text.slice(0, 50),
	};
	return result;
}

function buildPrompt(text: string, now: Date): string {
	return [
		"你是个人记录工具的内容识别器。请只返回 JSON，不要返回 Markdown。",
		"可选 category 只能是：学习、工作、生活、想法、待办、其他。",
		"字段必须完整：category, tags, is_todo, planned_time, deadline, emotion, follow_up_required, summary。",
		"planned_time 和 deadline 使用 ISO 字符串；没有则返回 null。",
		"tags 返回简短中文关键词数组；emotion 没有明显情绪时返回 null。",
		`当前时间：${now.toISOString()}`,
		`用户内容：${text}`,
	].join("\n");
}

function extractJson(raw: string): unknown {
	const trimmed = raw.trim();
	try {
		return JSON.parse(trimmed);
	} catch {
		const start = trimmed.indexOf("{");
		const end = trimmed.lastIndexOf("}");
		if (start === -1 || end === -1 || end <= start) {
			throw new Error("AI 识别结果不是 JSON");
		}
		return JSON.parse(trimmed.slice(start, end + 1));
	}
}

async function recognizeByModel(
	text: string,
	now: Date,
	config: AiRecognitionConfig
): Promise<RecognitionResult> {
	const endpoint = normalizeEndpoint(config);
	if (!(endpoint && config.apiKey && config.model)) {
		throw new Error("AI 识别配置不完整");
	}

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			authorization: `Bearer ${config.apiKey}`,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			messages: [
				{
					content:
						"你负责把个人随手记录识别成结构化数据。必须返回可解析 JSON。",
					role: "system",
				},
				{ content: buildPrompt(text, now), role: "user" },
			],
			model: config.model,
			response_format: { type: "json_object" },
			temperature: 0.1,
		}),
	});

	if (!response.ok) {
		throw new Error(`AI 识别请求失败：${response.status}`);
	}

	const payload = (await response.json()) as {
		choices?: Array<{ message?: { content?: string } }>;
	};
	const content = payload.choices?.[0]?.message?.content;
	if (!content) {
		throw new Error("AI 识别结果为空");
	}
	return recognitionResultSchema.parse(extractJson(content));
}

export async function recognize(
	text: string,
	now: Date,
	config?: AiRecognitionConfig
): Promise<RecognitionResult> {
	const fallback = recognizeByRules(text, now);
	if (!shouldUseModel(config)) {
		return fallback;
	}

	try {
		return await recognizeByModel(text, now, config);
	} catch {
		return fallback;
	}
}
