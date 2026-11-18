import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { marked } from 'marked';
import { db as defaultDb } from './firebase.js';
import { isValidIdeaSlug } from './slug.js';

// Testability: modules use the app `db` from firebase.js; node tests inject an emulator db via __setDb.
let db = defaultDb;
export function __setDb(d) {
	db = d;
}

const col = () => collection(db, 'ideas');
const ref = (slug) => doc(db, 'ideas', slug);

const RESERVED_SLUGS = ['rank'];
const RANK_SECTION_RE = /\n*## Ranking Analysis \(Auto-rank\)[\s\S]*$/;
const RANK_HEADING = '## Ranking Analysis (Auto-rank)';

function titleCaseTags(tags) {
	if (!Array.isArray(tags)) return [];
	return tags.map((tag) => String(tag).replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1)));
}

const stripRanking = (body) => body.replace(RANK_SECTION_RE, '').trimEnd();
const dateStr = (d) => (d ? String(d).slice(0, 10) : '');

function shape(slug, data) {
	return {
		slug,
		title: data.title || slug,
		status: data.status || 'new',
		tags: titleCaseTags(data.tags),
		link: data.link || '',
		github: data.github || '',
		brief: data.brief || '',
		ranked: data.ranked ?? false,
		scores: typeof data.scores === 'object' && data.scores !== null ? data.scores : {},
		date: dateStr(data.date)
	};
}

export function slugifyTitle(title) {
	return String(title)
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
		.slice(0, 60);
}

export function renderMarkdown(md) {
	return marked(md || '');
}

export function computeScore(scores, criteria) {
	if (!criteria || criteria.length === 0) return null;
	let weighted_sum = 0;
	let max_possible = 0;
	for (const c of criteria) {
		const raw = scores?.[c.id] ?? 0;
		const effective = raw > 0 ? (c.invert ? 6 - raw : raw) : 0;
		weighted_sum += effective * c.weight;
		max_possible += 5 * c.weight;
	}
	if (max_possible === 0) return null;
	return Math.round((weighted_sum / max_possible) * 100);
}

export async function listIdeas() {
	const snap = await getDocs(col());
	return snap.docs
		.map((d) => {
			const data = d.data();
			const body = data.body || '';
			const excerpt = body.replace(/^#+\s.*/gm, '').replace(/\n+/g, ' ').trim().slice(0, 150);
			return { ...shape(d.id, data), excerpt };
		})
		.sort((a, b) => {
			if (!a.date && !b.date) return a.title.localeCompare(b.title);
			if (!a.date) return 1;
			if (!b.date) return -1;
			return b.date.localeCompare(a.date);
		});
}

export async function getIdea(slug) {
	const snap = await getDoc(ref(slug));
	if (!snap.exists()) return null;
	const data = snap.data();
	const content = data.body || '';
	return { ...shape(slug, data), html: renderMarkdown(content), content };
}

export async function createIdea({ title, content, tags, brief }) {
	const base = slugifyTitle(title);
	if (!isValidIdeaSlug(base)) throw new Error('Invalid title');
	if (RESERVED_SLUGS.includes(base)) throw new Error(`Slug "${base}" is reserved`);
	let slug = base;
	for (let n = 2; (await getDoc(ref(slug))).exists(); n++) slug = `${base}-${n}`;
	await setDoc(ref(slug), {
		title,
		status: 'new',
		tags: titleCaseTags(tags),
		link: '',
		github: '',
		brief: brief || '',
		ranked: false,
		scores: {},
		date: new Date().toISOString().split('T')[0],
		body: content
	});
	return slug;
}

export async function saveIdeaMeta(slug, { status, tags, link, title, github, brief, ranked, scores }) {
	const upd = {};
	if (status !== undefined) upd.status = status;
	if (tags !== undefined) upd.tags = titleCaseTags(tags);
	if (link !== undefined) upd.link = link;
	if (title !== undefined) upd.title = title;
	if (github !== undefined) upd.github = github;
	if (brief !== undefined) upd.brief = brief;
	if (ranked !== undefined) upd.ranked = ranked;
	if (scores !== undefined) upd.scores = scores;
	if (Object.keys(upd).length === 0) return;
	await updateDoc(ref(slug), upd);
}

export async function saveIdeaContent(slug, body, meta = {}) {
	const data = { ...meta, body };
	if (data.tags !== undefined) data.tags = titleCaseTags(data.tags);
	// mergeFields replaces each given field whole (e.g. scores map) and creates the doc if missing.
	await setDoc(ref(slug), data, { mergeFields: Object.keys(data) });
}

export async function deleteIdea(slug) {
	await deleteDoc(ref(slug));
}

export async function setRanking(slug, { scores, analysis }) {
	for (const val of Object.values(scores || {})) {
		const n = parseInt(val, 10);
		if (isNaN(n) || n < 0 || n > 5) throw new Error('Invalid score value');
	}
	const upd = { scores, ranked: true };
	if (analysis) {
		const snap = await getDoc(ref(slug));
		if (!snap.exists()) throw new Error('Idea not found');
		upd.body = stripRanking(snap.data().body || '') + `\n\n${RANK_HEADING}\n\n` + analysis.trim();
	}
	await updateDoc(ref(slug), upd);
}

export async function resetRanking(slug) {
	const snap = await getDoc(ref(slug));
	if (!snap.exists()) throw new Error('Idea not found');
	const upd = { scores: {}, ranked: false };
	const body = snap.data().body || '';
	const stripped = stripRanking(body);
	if (stripped !== body.trimEnd()) upd.body = stripped;
	await updateDoc(ref(slug), upd);
}

export async function resetAllRankings(slugs) {
	const want = new Set(slugs);
	if (want.size === 0) return;
	const snap = await getDocs(col());
	const docs = snap.docs.filter((d) => want.has(d.id));
	for (let i = 0; i < docs.length; i += 400) {
		const batch = writeBatch(db);
		for (const d of docs.slice(i, i + 400)) {
			const upd = { scores: {}, ranked: false };
			const body = d.data().body || '';
			const stripped = stripRanking(body);
			if (stripped !== body.trimEnd()) upd.body = stripped;
			batch.update(d.ref, upd);
		}
		await batch.commit();
	}
}
