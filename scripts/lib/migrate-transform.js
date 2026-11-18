// Pure transform + validation for the Firestore migration. No firebase imports, no fs.

import { isValidSlug, isValidIdeaSlug, slugToDocId } from '../../admin/src/lib/slug.js';

export const DEFAULT_CRITERIA = [
	{ id: 'interest', label: 'Interest', weight: 1, invert: false },
	{ id: 'feasibility', label: 'Feasibility', weight: 1, invert: false },
	{ id: 'time_to_build', label: 'Time to Build', weight: 1, invert: true },
	{ id: 'learning_value', label: 'Learning Value', weight: 1, invert: false },
	{ id: 'impact', label: 'Impact', weight: 1, invert: false },
	{ id: 'originality', label: 'Originality', weight: 1, invert: false }
];

export const IDEA_KEYS = ['date', 'title', 'status', 'tags', 'link', 'ranked', 'scores', 'github', 'brief'];
export const GUEST_KEYS = ['/', '/ideas', '/links'];
const MAX_BODY_BYTES = 900 * 1024;
const MAX_ID_BYTES = 1500;

const isNil = (v) => v === undefined || v === null;
const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

function titleCase(tag) {
	return String(tag).replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}
// Non-arrays are kept as-is so the validator can flag them.
function normTags(tags) {
	if (isNil(tags)) return [];
	return Array.isArray(tags) ? tags.map((t) => (typeof t === 'string' ? titleCase(t) : t)) : tags;
}
function normDate(d) {
	if (isNil(d) || d === '') return '';
	return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
}

export function transformIdea(slug, data, body) {
	const warnings = [];
	for (const k of Object.keys(data ?? {})) {
		if (!IDEA_KEYS.includes(k)) warnings.push(`idea ${slug}: unknown frontmatter key "${k}" dropped`);
	}
	const d = data ?? {};
	const doc = {
		date: normDate(d.date),
		title: isNil(d.title) || d.title === '' ? slug : d.title,
		status: d.status || 'new',
		tags: normTags(d.tags),
		link: isNil(d.link) ? '' : d.link,
		ranked: isNil(d.ranked) ? false : d.ranked,
		scores: isNil(d.scores) ? {} : d.scores,
		github: isNil(d.github) ? '' : d.github,
		brief: isNil(d.brief) ? '' : d.brief,
		body: body ?? ''
	};
	return { id: slug, doc, warnings };
}

export function transformLink(raw) {
	const slug = String(raw.slug ?? '').toLowerCase();
	const id = slugToDocId(slug);
	const doc = {
		slug,
		url: raw.url,
		tags: normTags(raw.tags),
		description: isNil(raw.description) ? '' : raw.description,
		created: raw.created,
		expiresAt: isNil(raw.expiresAt) ? null : raw.expiresAt
	};
	return { id, doc, warnings: [] };
}

export function transformSettings(raw) {
	const r = raw ?? {};
	const criteria = Array.isArray(r.ranker?.criteria)
		? r.ranker.criteria.map((c) => {
				const w = Math.trunc(Number(c.weight));
				return { id: c.id, label: c.label, weight: Number.isFinite(w) && w >= 1 ? w : 1, invert: Boolean(c.invert) };
			})
		: DEFAULT_CRITERIA.map((c) => ({ ...c }));
	return { guestVisibility: { ...(r.guestVisibility ?? {}) }, ranker: { criteria } };
}

// ---- validation ----

function checkId(label, id, errors) {
	const bytes = Buffer.byteLength(String(id));
	if (id === '' || id === '.' || id === '..' || /^__.*__$/.test(id) || String(id).includes('/') || bytes > MAX_ID_BYTES) {
		errors.push(`${label} "${id}": invalid Firestore document id (empty, ".", "..", "__x__", contains "/", or > ${MAX_ID_BYTES} bytes)`);
	} else if (!isValidIdeaSlug(id)) {
		errors.push(`${label} "${id}": slug must match [a-z0-9-]+`);
	} else if (id === 'rank') {
		errors.push(`${label} "${id}": slug "rank" is reserved (route /ideas/rank)`);
	}
}
// Link doc id = slugToDocId(slug); slug (real slash form) must satisfy the shared rule.
function checkLink(id, doc, errors) {
	const L = `link "${id}"`;
	if (!isValidSlug(doc.slug)) errors.push(`${L}: slug ${JSON.stringify(doc.slug)} must be one or more [a-z0-9-]+ segments joined by "/"`);
	else if (id !== slugToDocId(doc.slug)) errors.push(`${L}: doc id must equal slug with "/" replaced by "~" (expected "${slugToDocId(doc.slug)}")`);
	if (Buffer.byteLength(String(id)) > MAX_ID_BYTES) errors.push(`${L}: doc id > ${MAX_ID_BYTES} bytes`);
}
function checkDuplicates(label, ids, errors) {
	const seen = new Set();
	for (const id of ids) {
		const k = String(id).toLowerCase();
		if (seen.has(k)) errors.push(`${label} "${id}": duplicate slug`);
		seen.add(k);
	}
}
const isStringArray = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');
const isDateStr = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isHttpUrl = (v) => {
	if (typeof v !== 'string') return false;
	try {
		const u = new URL(v);
		return u.protocol === 'http:' || u.protocol === 'https:';
	} catch {
		return false;
	}
};

export function validateIdeas(entries, expectedCount) {
	const errors = [];
	const warnings = [];
	checkDuplicates('idea', entries.map((e) => e.id), errors);
	for (const { id, doc } of entries) {
		const L = `idea "${id}"`;
		checkId('idea', id, errors);
		if (typeof doc.title !== 'string' || doc.title === '') errors.push(`${L}: title must be a non-empty string`);
		if (!isDateStr(doc.date)) errors.push(`${L}: date must be YYYY-MM-DD string (got ${JSON.stringify(doc.date)})`);
		if (typeof doc.status !== 'string') errors.push(`${L}: status must be a string`);
		if (!isStringArray(doc.tags)) errors.push(`${L}: tags must be an array of strings`);
		for (const k of ['link', 'github', 'brief']) if (typeof doc[k] !== 'string') errors.push(`${L}: ${k} must be a string`);
		if (typeof doc.ranked !== 'boolean') errors.push(`${L}: ranked must be a boolean`);
		if (typeof doc.body !== 'string') errors.push(`${L}: body must be a string`);
		else if (Buffer.byteLength(doc.body) > MAX_BODY_BYTES) errors.push(`${L}: body exceeds 900 KB`);
		if (!isPlainObject(doc.scores)) errors.push(`${L}: scores must be a map`);
		else {
			const vals = Object.entries(doc.scores);
			for (const [k, v] of vals) {
				if (typeof v !== 'number' || !Number.isFinite(v)) errors.push(`${L}: score "${k}" must be a number`);
				else if (v < 1 || v > 5) warnings.push(`${L}: score "${k}"=${v} outside 1-5`);
			}
			if (doc.ranked === true && vals.length === 0) warnings.push(`${L}: ranked:true with empty scores`);
			if (doc.ranked === false && vals.length > 0) warnings.push(`${L}: ranked:false but has scores`);
		}
	}
	if (entries.length !== expectedCount) errors.push(`idea count mismatch: ${expectedCount} source files, ${entries.length} docs planned`);
	return { errors, warnings };
}

export function validateLinks(entries, expectedCount) {
	const errors = [];
	const warnings = [];
	checkDuplicates('link', entries.map((e) => e.id), errors);
	for (const { id, doc } of entries) {
		const L = `link "${id}"`;
		checkLink(id, doc, errors);
		if (!isHttpUrl(doc.url)) errors.push(`${L}: url must be http(s)`);
		if (!isDateStr(doc.created)) errors.push(`${L}: created is required and must be YYYY-MM-DD (got ${JSON.stringify(doc.created)})`);
		if (!isStringArray(doc.tags)) errors.push(`${L}: tags must be an array of strings`);
		if (typeof doc.description !== 'string') errors.push(`${L}: description must be a string`);
		if (!(doc.expiresAt === null || typeof doc.expiresAt === 'string')) errors.push(`${L}: expiresAt must be string or null`);
	}
	if (entries.length !== expectedCount) errors.push(`link count mismatch: ${expectedCount} source entries, ${entries.length} docs planned`);
	return { errors, warnings };
}

export function validateSettings(doc) {
	const errors = [];
	const gv = doc?.guestVisibility;
	if (!isPlainObject(gv)) errors.push('settings: guestVisibility must be a map');
	else {
		for (const k of GUEST_KEYS) {
			if (!(k in gv)) errors.push(`settings: guestVisibility["${k}"] is required`);
			else if (typeof gv[k] !== 'boolean') errors.push(`settings: guestVisibility["${k}"] must be boolean`);
		}
	}
	const cr = doc?.ranker?.criteria;
	if (!Array.isArray(cr)) errors.push('settings: ranker.criteria must be an array');
	else {
		cr.forEach((c, i) => {
			if (typeof c.id !== 'string' || typeof c.label !== 'string') errors.push(`settings: criteria[${i}] id/label must be strings`);
			if (!Number.isInteger(c.weight) || c.weight < 1) errors.push(`settings: criteria[${i}] weight must be an int >= 1`);
			if (typeof c.invert !== 'boolean') errors.push(`settings: criteria[${i}] invert must be boolean`);
		});
	}
	return { errors, warnings: [] };
}
