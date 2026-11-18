import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db as defaultDb } from './firebase.js';
import { SETTINGS_PATH } from './config.js';

// Testability: modules use the app `db` from firebase.js; node tests inject an emulator db via __setDb.
let db = defaultDb;
export function __setDb(d) {
	db = d;
	cache = null;
}

const defaultCriteria = [
	{ id: 'interest', label: 'Interest', weight: 1, invert: false },
	{ id: 'feasibility', label: 'Feasibility', weight: 1, invert: false },
	{ id: 'time_to_build', label: 'Time to Build', weight: 1, invert: true },
	{ id: 'learning_value', label: 'Learning Value', weight: 1, invert: false },
	{ id: 'impact', label: 'Impact', weight: 1, invert: false },
	{ id: 'originality', label: 'Originality', weight: 1, invert: false }
];

const ref = () => doc(db, SETTINGS_PATH);

// Memoized promise of settings/main data; cleared on write.
let cache = null;

export function getSettings() {
	if (!cache) {
		cache = getDoc(ref())
			.then((snap) => {
				const d = snap.exists() ? snap.data() : {};
				return { ...d, guestVisibility: d.guestVisibility || {} };
			})
			.catch((e) => {
				cache = null;
				throw e;
			});
	}
	return cache;
}

export async function saveGuestVisibility(map) {
	cache = null;
	// mergeFields replaces the whole guestVisibility map (plain merge would keep stale keys); other fields untouched.
	await setDoc(ref(), { guestVisibility: map }, { mergeFields: ['guestVisibility'] });
}

export async function getCriteria() {
	const s = await getSettings();
	return s.ranker?.criteria ?? defaultCriteria.map((c) => ({ ...c }));
}

export async function saveCriteria(list) {
	if (!Array.isArray(list) || list.length === 0) throw new Error('At least one criterion required');
	const criteria = [];
	for (const c of list) {
		if (!c || !c.id || !c.label) throw new Error('Each criterion needs id and label');
		const w = parseInt(c.weight, 10);
		if (isNaN(w) || w < 1) throw new Error(`Weight must be ≥ 1 (got "${c.weight}" for "${c.label}")`);
		criteria.push({ ...c, weight: w, invert: !!c.invert });
	}
	const ids = criteria.map((c) => c.id);
	if (new Set(ids).size !== ids.length) throw new Error('Duplicate criterion ids');
	cache = null;
	await setDoc(ref(), { ranker: { criteria } }, { merge: true });
}
