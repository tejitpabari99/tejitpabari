// Map any AI failure to one user-facing line. Match SDK code / HTTP status first,
// message substring second. AIError carries `code` and `customErrorData.status`.

export const MESSAGES = {
	appCheck: 'App Check blocked this request (reload; if it persists check App Check setup)',
	quota: 'Gemini quota reached, try again later',
	notSetUp: 'AI model or AI Logic not set up',
	declined: 'Gemini declined this content',
	malformed: 'AI returned malformed output, try again',
	busy: 'An AI request is already running, please wait',
	generic: 'AI request failed'
};

function statusOf(err) {
	const s = err?.customErrorData?.status ?? err?.status ?? err?.httpStatus;
	return typeof s === 'number' ? s : undefined;
}

// Thrown by the client-side cooldown in ai.js (no SDK call made).
export class CooldownError extends Error {
	constructor(retryAfterMs) {
		super('AI cooldown');
		this.name = 'CooldownError';
		this.retryAfterMs = retryAfterMs; // 0 = another request is in flight
	}
}

export function toUserMessage(err, { log = console.error } = {}) {
	const status = statusOf(err);
	const code = typeof err?.code === 'string' ? err.code : '';
	const msg = String(err?.message ?? '');
	const lower = msg.toLowerCase();

	if (err?.name === 'CooldownError') {
		if (!(err.retryAfterMs > 0)) return MESSAGES.busy;
		const n = Math.max(1, Math.ceil(err.retryAfterMs / 1000));
		return `Please wait ${n} ${n === 1 ? 'second' : 'seconds'} before the next AI request.`;
	}
	if (err?.name === 'MalformedOutputError' || code === 'parse-failed') return MESSAGES.malformed;
	if (status === 403) return MESSAGES.appCheck;
	if (status === 429) return MESSAGES.quota;
	if (status === 404 || code === 'api-not-enabled') return MESSAGES.notSetUp;
	if (code === 'no-api-key' || code === 'no-app-id' || code === 'no-project-id' || code === 'no-model') {
		return MESSAGES.notSetUp;
	}
	if (msg === 'Admin only') return msg;
	if (lower.includes('app check')) return MESSAGES.appCheck;
	if (lower.includes('quota') || lower.includes('resource_exhausted')) return MESSAGES.quota;
	if (lower.includes('safety') || lower.includes('blocked') || lower.includes('prohibited')) return MESSAGES.declined;
	if (lower.includes('not found')) return MESSAGES.notSetUp;
	try {
		log('AI request failed:', err);
	} catch {
		/* ignore */
	}
	return MESSAGES.generic;
}
