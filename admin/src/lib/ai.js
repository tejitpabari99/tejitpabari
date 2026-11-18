// AI interface (stub). SP05 replaces the bodies; signatures and return shapes are frozen.
// Plain data in/out: pages never call Firebase AI directly. Callers own slug generation
// (slugifyTitle), markdown rendering (renderMarkdown) and persistence (ideas.js).
// All functions are admin-only, async, and throw Error(userFacingMessage) on failure.

const NOT_CONFIGURED = 'AI is not configured yet';

/**
 * Turn raw notes into a structured idea.
 * @param {string} rawText
 * @returns {Promise<{title: string, content: string, tags: string[], brief: string}>}
 *   title: 5 words max; content: polished markdown; tags: 1-3 from the allowed list; brief: 1-2 sentences.
 */
export async function parseIdea(rawText) {
	throw new Error(NOT_CONFIGURED);
}

/**
 * Merge existing idea markdown with new notes.
 * @param {string} existing  current markdown body
 * @param {string} notes     new notes to fold in
 * @returns {Promise<{content: string}>}  merged markdown only (no code fences)
 */
export async function enhanceIdea(existing, notes) {
	throw new Error(NOT_CONFIGURED);
}

/**
 * Score an idea against ranking criteria (the `interest` criterion is skipped).
 * @param {{title: string, brief: string, content: string}} idea
 * @param {{id: string, label: string, weight: number, invert: boolean}[]} criteria
 * @returns {Promise<{scores: Record<string, number>, analysis: string}>}
 *   scores: integer 1-5 per rankable criterion id (raw, not inverted); analysis: 2-3 sentences.
 */
export async function rankIdea(idea, criteria) {
	throw new Error(NOT_CONFIGURED);
}
