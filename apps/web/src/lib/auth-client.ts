import { env } from "@personal-lift/env/web";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: env.VITE_SERVER_URL,
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
		cachedSession = {
			expiresAt: Date.now() + SESSION_CACHE_MS,
			result,
		};
		pendingSession = null;
		return result;
	});
	return pendingSession;
}
