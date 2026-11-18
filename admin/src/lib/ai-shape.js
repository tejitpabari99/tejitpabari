// Pure schema descriptors + validators for ai.js. No SDK import: the Schema class is
// injected into buildSchema() by ai.js after its lazy `import('firebase/ai')`.
import { ALLOWED_TAGS, rankableCriteria } from './ai-prompts.js';

/** Thrown when model output is unusable; ai.js retries once, then maps it to a message. */
export class MalformedOutputError extends Error {
	constructor(message) {
		super(message);
		this.name = 'MalformedOutputError';
	}
}

// Descriptor nodes: {type:'object', properties, required} | {type:'array', items} | {type:'string'|'integer'}
export function parseSchemaDescriptor() {
	return {
		type: 'object',
		properties: {
			title: { type: 'string' },
			content: { type: 'string' },
			tags: { type: 'array', items: { type: 'string' } },
			brief: { type: 'string' }
		},
		required: ['title', 'content', 'tags', 'brief']
	};
}

export function rankSchemaDescriptor(criteria) {
	const ids = rankableCriteria(criteria).map((c) => c.id);
	return {
		type: 'object',
		properties: {
			scores: {
				type: 'object',
				properties: Object.fromEntries(ids.map((id) => [id, { type: 'integer' }])),
				required: ids
			},
			analysis: { type: 'string' }
		},
		required: ['scores', 'analysis']
	};
}

/** Turn a descriptor into an SDK Schema using the injected `Schema` class (or a fake). */
export function buildSchema(Schema, node) {
	if (node.type === 'string') return Schema.string();
	if (node.type === 'integer') return Schema.integer();
	if (node.type === 'array') return Schema.array({ items: buildSchema(Schema, node.items) });
	const properties = Object.fromEntries(
		Object.entries(node.properties).map(([k, v]) => [k, buildSchema(Schema, v)])
	);
	return Schema.object({ properties });
}

export function stripFence(text) {
	return String(text ?? '')
		.trim()
		.replace(/^```[a-zA-Z]*\n?/, '')
		.replace(/\n?```$/, '')
		.trim();
}

function toObject(raw) {
	if (raw && typeof raw === 'object') return raw;
	try {
		const v = JSON.parse(stripFence(raw));
		if (v && typeof v === 'object') return v;
	} catch {
		/* fall through */
	}
	throw new MalformedOutputError('Model output is not a JSON object');
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');

export function validateParse(raw) {
	const o = toObject(raw);
	const title = str(o.title);
	const content = str(o.content);
	if (!title) throw new MalformedOutputError('Empty title');
	if (!content) throw new MalformedOutputError('Empty content');
	const tags = (Array.isArray(o.tags) ? o.tags : []).filter((t) => ALLOWED_TAGS.includes(t)).slice(0, 3);
	return { title, content, tags, brief: str(o.brief) };
}

export function validateEnhance(raw) {
	const content = stripFence(raw);
	if (!content) throw new MalformedOutputError('Empty content');
	return { content };
}

export function validateRank(raw, criteria) {
	const o = toObject(raw);
	if (!o.scores || typeof o.scores !== 'object' || Array.isArray(o.scores)) {
		throw new MalformedOutputError('Missing scores');
	}
	const scores = {};
	for (const { id } of rankableCriteria(criteria)) {
		const n = parseInt(o.scores[id], 10);
		scores[id] = Number.isNaN(n) ? 3 : Math.max(1, Math.min(5, n));
	}
	return { scores, analysis: str(o.analysis) };
}
