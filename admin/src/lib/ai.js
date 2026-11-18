// AI interface backed by Gemini via Firebase AI Logic (Gemini Developer API) + App Check.
// Plain data in/out: pages never call Firebase AI directly. Callers own slug generation
// (slugifyTitle), markdown rendering (renderMarkdown) and persistence (ideas.js).
// All functions are admin-only, async, and throw Error(userFacingMessage) on failure.
import { app } from './firebase.js';
import { currentRole } from './auth-core.js';
import { buildParsePrompt, buildEnhancePrompt, buildRankPrompt } from './ai-prompts.js';
import {
	MalformedOutputError,
	buildSchema,
	parseSchemaDescriptor,
	rankSchemaDescriptor,
	validateParse,
	validateEnhance,
	validateRank
} from './ai-shape.js';
import { CooldownError, toUserMessage } from './ai-errors.js';

// Single place to change the model (retirement is mapped to a "not set up" message).
export const GEMINI_MODEL = 'gemini-3.5-flash-lite';

// Client-side throttle: one call in flight, min interval between call starts.
// Client safety net; the server quota is 5 requests/minute per user.
export const AI_COOLDOWN_MS = 12_000;

let inFlight = false;
let lastStart = -Infinity;

const now = () => performance.now();

// Ms until the next call may start (0 if allowed now). Lets bulk callers wait instead of failing.
export function cooldownRemainingMs() {
	return Math.max(0, lastStart + AI_COOLDOWN_MS - now());
}

// Throws CooldownError if blocked; otherwise marks a call as started.
function acquire() {
	if (inFlight) throw new CooldownError(0);
	const wait = lastStart + AI_COOLDOWN_MS - now();
	if (wait > 0) throw new CooldownError(wait);
	inFlight = true;
	lastStart = now();
}

let aiPromise;
// Lazy: firebase/ai stays out of the initial bundle. Memoized; a failed import is not cached.
function loadAI() {
	if (!aiPromise) {
		aiPromise = import('firebase/ai')
			.then((sdk) => ({
				sdk,
				ai: sdk.getAI(app, { backend: new sdk.GoogleAIBackend(), useLimitedUseAppCheckTokens: true })
			}))
			.catch((err) => {
				aiPromise = undefined;
				throw err;
			});
	}
	return aiPromise;
}

function requireAdmin() {
	if (currentRole() !== 'admin') throw new Error('Admin only');
}

// Runs one generation + validation, retrying once on malformed output only.
// The retry is part of the same call, so the cooldown is checked once, up front.
async function run({ prompt, schemaDescriptor, validate }) {
	let acquired = false;
	try {
		acquire();
		acquired = true;
		const { sdk, ai } = await loadAI();
		const generationConfig = schemaDescriptor
			? { responseMimeType: 'application/json', responseSchema: buildSchema(sdk.Schema, schemaDescriptor) }
			: undefined;
		const model = sdk.getGenerativeModel(ai, { model: GEMINI_MODEL, ...(generationConfig && { generationConfig }) });
		let lastErr;
		for (let attempt = 0; attempt < 2; attempt++) {
			try {
				const result = await model.generateContent(prompt);
				return validate(result.response.text());
			} catch (err) {
				if (!(err instanceof MalformedOutputError)) throw err;
				lastErr = err;
			}
		}
		throw lastErr;
	} catch (err) {
		throw new Error(toUserMessage(err));
	} finally {
		if (acquired) inFlight = false;
	}
}

/**
 * Turn raw notes into a structured idea.
 * @param {string} rawText
 * @returns {Promise<{title: string, content: string, tags: string[], brief: string}>}
 *   title: 5 words max; content: polished markdown; tags: 1-3 from the allowed list; brief: 1-2 sentences.
 */
export async function parseIdea(rawText) {
	requireAdmin();
	return run({
		prompt: buildParsePrompt(rawText),
		schemaDescriptor: parseSchemaDescriptor(),
		validate: validateParse
	});
}

/**
 * Merge existing idea markdown with new notes.
 * @param {string} existing  current markdown body
 * @param {string} notes     new notes to fold in
 * @returns {Promise<{content: string}>}  merged markdown only (no code fences)
 */
export async function enhanceIdea(existing, notes) {
	requireAdmin();
	return run({ prompt: buildEnhancePrompt(existing, notes), validate: validateEnhance });
}

/**
 * Score an idea against ranking criteria (the `interest` criterion is skipped).
 * @param {{title: string, brief: string, content: string}} idea
 * @param {{id: string, label: string, weight: number, invert: boolean}[]} criteria
 * @returns {Promise<{scores: Record<string, number>, analysis: string}>}
 *   scores: integer 1-5 per rankable criterion id (raw, not inverted); analysis: 2-3 sentences.
 */
export async function rankIdea(idea, criteria) {
	requireAdmin();
	return run({
		prompt: buildRankPrompt(idea, criteria),
		schemaDescriptor: rankSchemaDescriptor(criteria),
		validate: (raw) => validateRank(raw, criteria)
	});
}
