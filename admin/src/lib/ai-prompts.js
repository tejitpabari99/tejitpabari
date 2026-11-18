// Pure prompt builders for ai.js. Text ported verbatim from the old cc-gateway Anthropic
// routes (2d95cfe), except: the parse prompt drops its "Return ONLY JSON / no markdown"
// line (responseSchema replaces it). No SDK imports, no env access.

export const ALLOWED_TAGS = [
	'AI', 'productivity', 'social', 'B2B', 'mobile', 'web', 'extension',
	'health', 'finance', 'food', 'travel', 'education', 'tools'
];

/** Criteria that are auto-scored. `interest` is personal and always skipped. */
export function rankableCriteria(criteria) {
	return (criteria || []).filter((c) => c.id !== 'interest');
}

export function buildParsePrompt(rawText) {
	return `You are helping organize project ideas. Given the following raw notes, do these things:
1. Write a short, clear title (5 words max)
2. Polish the English — fix grammar, clarity, flow. Do NOT add new ideas or content that wasn't already there.
3. Structure it with markdown headings where logical (## Overview, ## Features, ## Notes, etc.)
4. Suggest 1-3 tags from this list: ${ALLOWED_TAGS.join(', ')}
5. Write a brief: 1-2 plain English sentences summarizing the idea concisely enough to recognize on a card.

Raw notes:
${rawText}`;
}

export function buildEnhancePrompt(existing, notes) {
	return `You are helping expand a project idea. Below is the existing description and new notes added by the author.

Merge them into a single cohesive markdown document. Polish the English. Do NOT invent new content — only incorporate what is already written. Keep the existing structure where possible.

Return ONLY the merged markdown content (no JSON, no explanation, no code fences).

Existing content:
${existing}

New notes:
${notes}`;
}

export function buildRankPrompt(idea, criteria) {
	const rankable = rankableCriteria(criteria);
	const criteriaList = rankable
		.map((c) => `- ${c.label}${c.invert ? ' (lower is better — score the raw difficulty, not inverted)' : ''}: id="${c.id}"`)
		.join('\n');
	return `You are scoring a software/product project idea across evaluation criteria. Score each criterion from 1 (worst) to 5 (best). Use the full range — don't default to middle scores.

Criteria to score:
${criteriaList}

Idea title: ${idea.title}
${idea.brief ? `Brief: ${idea.brief}` : ''}

Idea content:
${idea.content}

Return ONLY a JSON object with this exact shape (no markdown, no explanation outside the JSON):
{
  "scores": {${rankable.map((c) => `"${c.id}": <1-5>`).join(', ')}},
  "analysis": "2-3 sentences explaining your reasoning for the key scores"
}`;
}
