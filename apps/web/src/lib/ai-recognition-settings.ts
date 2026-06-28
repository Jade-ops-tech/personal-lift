export const AI_RECOGNITION_SETTINGS_KEY = "personal-lift.ai-recognition";

export const AI_PROVIDER_OPTIONS = [
	{ label: "OpenAI", value: "openai" },
	{ label: "DeepSeek", value: "deepseek" },
	{ label: "自定义", value: "custom" },
] as const;

export type AiProvider = (typeof AI_PROVIDER_OPTIONS)[number]["value"];

export interface AiRecognitionSettings {
	apiKey: string;
	baseUrl: string;
	model: string;
	provider: AiProvider;
}

export const DEFAULT_AI_RECOGNITION_SETTINGS: AiRecognitionSettings = {
	apiKey: "",
	baseUrl: "",
	model: "gpt-4o-mini",
	provider: "openai",
};

const DEFAULT_MODELS: Record<AiProvider, string> = {
	custom: "",
	deepseek: "deepseek-chat",
	openai: "gpt-4o-mini",
};

export function modelForProvider(provider: AiProvider): string {
	return DEFAULT_MODELS[provider];
}

function isAiProvider(value: string): value is AiProvider {
	return AI_PROVIDER_OPTIONS.some((option) => option.value === value);
}

export function loadAiRecognitionSettings(): AiRecognitionSettings {
	if (typeof window === "undefined") {
		return DEFAULT_AI_RECOGNITION_SETTINGS;
	}

	const raw = window.localStorage.getItem(AI_RECOGNITION_SETTINGS_KEY);
	if (!raw) {
		return DEFAULT_AI_RECOGNITION_SETTINGS;
	}

	try {
		const parsed = JSON.parse(raw) as Partial<AiRecognitionSettings>;
		const provider =
			parsed.provider && isAiProvider(parsed.provider)
				? parsed.provider
				: DEFAULT_AI_RECOGNITION_SETTINGS.provider;
		return {
			apiKey: parsed.apiKey ?? "",
			baseUrl: parsed.baseUrl ?? "",
			model: parsed.model ?? modelForProvider(provider),
			provider,
		};
	} catch {
		return DEFAULT_AI_RECOGNITION_SETTINGS;
	}
}

export function saveAiRecognitionSettings(
	settings: AiRecognitionSettings
): void {
	window.localStorage.setItem(
		AI_RECOGNITION_SETTINGS_KEY,
		JSON.stringify(settings)
	);
}
