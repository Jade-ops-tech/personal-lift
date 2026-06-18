// NEURAL_OS 还原页共用：分类视觉映射 + 时间格式化。
// 真实分类来自后端：学习 / 工作 / 生活 / 想法 / 待办 / 其他。

export interface CategoryStyle {
	/** Material Symbols 图标名 */
	icon: string;
	/** 图标底色类 */
	iconWrap: string;
	/** 记录卡左侧霓虹边框类 */
	neon: string;
	/** 文本/图标强调色类 */
	text: string;
}

const FALLBACK: CategoryStyle = {
	icon: "more_horiz",
	text: "text-on-surface-variant",
	neon: "border-outline-variant/40 border-l-2",
	iconWrap: "bg-surface-variant/50",
};

const CATEGORY_STYLE: Record<string, CategoryStyle> = {
	工作: {
		icon: "work",
		text: "text-primary-fixed",
		neon: "neon-border-work",
		iconWrap: "bg-[#e1fdff]/10",
	},
	学习: {
		icon: "school",
		text: "text-tertiary-container",
		neon: "neon-border-study",
		iconWrap: "bg-tertiary-container/10",
	},
	生活: {
		icon: "self_improvement",
		text: "text-secondary-fixed-dim",
		neon: "neon-border-personal",
		iconWrap: "bg-secondary-container/10",
	},
	想法: {
		icon: "lightbulb",
		text: "text-secondary-fixed-dim",
		neon: "neon-border-personal",
		iconWrap: "bg-secondary-container/10",
	},
	待办: {
		icon: "checklist",
		text: "text-primary-fixed",
		neon: "neon-border-work",
		iconWrap: "bg-[#e1fdff]/10",
	},
	其他: FALLBACK,
};

export function categoryStyle(category: string): CategoryStyle {
	return CATEGORY_STYLE[category] ?? FALLBACK;
}

type DateInput = Date | string | null | undefined;

/** HH:mm（24 小时制） */
export function formatHM(value: DateInput): string {
	if (!value) {
		return "--:--";
	}
	return new Date(value).toLocaleTimeString("zh-CN", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

/** YYYY-MM-DD HH:mm:ss */
export function formatTimestamp(value: DateInput): string {
	if (!value) {
		return "-- --";
	}
	const d = new Date(value);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** 距离截止时间的可读倒计时；逾期返回「已逾期」，无截止返回「无期限」 */
export function dueCountdown(deadline: DateInput): string {
	if (!deadline) {
		return "无期限";
	}
	const diff = new Date(deadline).getTime() - Date.now();
	if (diff <= 0) {
		return "已逾期";
	}
	if (diff >= DAY_MS) {
		const days = Math.floor(diff / DAY_MS);
		const hours = Math.floor((diff % DAY_MS) / HOUR_MS);
		return `${days}天 ${String(hours).padStart(2, "0")}小时`;
	}
	const hours = Math.floor(diff / HOUR_MS);
	const minutes = Math.floor((diff % HOUR_MS) / (60 * 1000));
	return `${hours}小时 ${String(minutes).padStart(2, "0")}分`;
}

/** 是否逾期未完成 */
export function isOverdue(
	deadline: DateInput,
	todoStatus: string | null
): boolean {
	if (!deadline || todoStatus === "done" || todoStatus === "cancelled") {
		return false;
	}
	return new Date(deadline).getTime() < Date.now();
}
