import { env } from "@personal-lift/env/web";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: env.VITE_SERVER_URL,
	fetchOptions: {
		credentials: "include",
	},
});

type SessionResult = Awaited<ReturnType<typeof authClient.getSession>>;

const SESSION_CACHE_MS = 5 * 60 * 1000;
let cachedSession: { expiresAt: number; result: SessionResult } | null = null;
let pendingSession: Promise<SessionResult> | null = null;

export function clearCachedSession(): void {
	cachedSession = null;
	pendingSession = null;
}

export function getCachedSession(): Promise<SessionResult> {
	const now = Date.now();
	if (cachedSession && cachedSession.expiresAt > now) {
		return cachedSession.result;
	}
	if (pendingSession) {
		return pendingSession;
	}

	pendingSession = authClient.getSession().then((result) => {
		if (result.data) {
			cachedSession = {
				expiresAt: Date.now() + SESSION_CACHE_MS,
				result,
			};
		}
		pendingSession = null;
		return result;
	});
	return pendingSession;
}

export async function waitForSession(): Promise<SessionResult> {
	clearCachedSession();
	for (let attempt = 0; attempt < 5; attempt += 1) {
		const result = await authClient.getSession();
		if (result.data) {
			cachedSession = {
				expiresAt: Date.now() + SESSION_CACHE_MS,
				result,
			};
			return result;
		}
		await new Promise((resolve) => setTimeout(resolve, 150));
	}
	return authClient.getSession();
}
