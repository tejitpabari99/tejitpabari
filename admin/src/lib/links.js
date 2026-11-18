import { collection, doc, getDoc, getDocs, deleteDoc, runTransaction } from 'firebase/firestore';
import { db as defaultDb } from './firebase.js';
import { isValidSlug, slugToDocId, docIdToSlug } from './slug.js';

// Testability: modules use the app `db` from firebase.js; node tests inject an emulator db via __setDb.
let db = defaultDb;
export function __setDb(d) {
	db = d;
}

const ref = (slug) => doc(db, 'links', slugToDocId(slug));

function titleCaseTags(tags) {
	if (!Array.isArray(tags)) return [];
	return tags.map((tag) => String(tag).replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1)));
}

function shape(id, d) {
	return {
		slug: d.slug || docIdToSlug(id),
		url: d.url,
		tags: d.tags || [],
		description: d.description || '',
		created: d.created || '',
		expiresAt: d.expiresAt || null
	};
}

// Returns an error message string, or null when valid. Slugs may be multi-segment (a/b).
export function validateLink({ slug, url }) {
	if (!slug || !url) return 'slug and url are required';
	if (!isValidSlug(slug)) {
		if (!/^[a-z0-9\-/]+$/.test(slug)) return 'Slug may only contain a-z, 0-9, -, /';
		return 'Slug cannot start/end with / or contain //';
	}
	if (!url.startsWith('http://') && !url.startsWith('https://')) return 'URL must start with http:// or https://';
	return null;
}

export async function listLinks() {
	const snap = await getDocs(collection(db, 'links'));
	return snap.docs
		.map((d) => shape(d.id, d.data()))
		.sort((a, b) => b.created.localeCompare(a.created) || a.slug.localeCompare(b.slug));
}

export async function getLink(slug) {
	const snap = await getDoc(ref(String(slug).toLowerCase()));
	return snap.exists() ? shape(snap.id, snap.data()) : null;
}

export async function saveLink({ slug, url, tags, description, expiresAt, existingSlug }) {
	const err = validateLink({ slug, url });
	if (err) throw new Error(err);
	const normalizedSlug = slug.toLowerCase();
	const newRef = ref(normalizedSlug);
	const oldRef = existingSlug ? ref(existingSlug.toLowerCase()) : null;
	const renamed = oldRef && oldRef.id !== newRef.id;
	const today = new Date().toISOString().split('T')[0];

	await runTransaction(db, async (tx) => {
		// all reads before writes
		const newSnap = !oldRef || renamed ? await tx.get(newRef) : null;
		const oldSnap = oldRef ? await tx.get(oldRef) : null;
		if (newSnap?.exists()) throw new Error(`Slug "${normalizedSlug}" already exists`);
		if (oldRef && !oldSnap.exists()) throw new Error('Link not found');
		const prev = oldSnap?.data();
		tx.set(newRef, {
			slug: normalizedSlug,
			url,
			tags: titleCaseTags(tags),
			description: description !== undefined ? description : prev?.description || '',
			created: prev?.created || today,
			expiresAt: expiresAt || null
		});
		if (renamed) tx.delete(oldRef);
	});
	return normalizedSlug;
}

export async function deleteLink(slug) {
	const r = ref(slug);
	if (!(await getDoc(r)).exists()) throw new Error('Link not found');
	await deleteDoc(r);
}
