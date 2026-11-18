#!/usr/bin/env node
// One-shot migration: migration/cc-content/ (markdown + json) -> Firestore. See SP02 PRD.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import matter from 'gray-matter';
import {
	transformIdea,
	transformLink,
	transformSettings,
	validateIdeas,
	validateLinks,
	validateSettings
} from './lib/migrate-transform.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_CONTENT_DIR = resolve(HERE, '../migration/cc-content');
export const DEFAULT_PROJECT = 'tejitpabari-99';

export function parseArgs(argv) {
	const o = { dryRun: false, yes: false, forceOverwrite: false, project: DEFAULT_PROJECT, contentDir: DEFAULT_CONTENT_DIR };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--dry-run') o.dryRun = true;
		else if (a === '--yes') o.yes = true;
		else if (a === '--force-overwrite') o.forceOverwrite = true;
		else if (a === '--project') o.project = argv[++i];
		else if (a === '--content-dir') o.contentDir = resolve(argv[++i]);
		else throw new Error(`unknown argument: ${a}`);
	}
	if (!o.project) throw new Error('--project needs a value');
	return o;
}

export function resolveMode(env) {
	if (env.FIRESTORE_EMULATOR_HOST) return { kind: 'emulator', target: env.FIRESTORE_EMULATOR_HOST };
	if (env.GOOGLE_APPLICATION_CREDENTIALS) return { kind: 'real', target: env.GOOGLE_APPLICATION_CREDENTIALS };
	return null;
}

export function loadContent(contentDir) {
	const ideasDir = join(contentDir, 'ideas');
	const files = readdirSync(ideasDir).filter((f) => f.endsWith('.md')).sort();
	const ideasRaw = files.map((f) => {
		const g = matter(readFileSync(join(ideasDir, f), 'utf8'));
		return { slug: f.slice(0, -3), data: g.data, body: g.content };
	});
	const linksRaw = JSON.parse(readFileSync(join(contentDir, 'links.json'), 'utf8'));
	const settingsRaw = JSON.parse(readFileSync(join(contentDir, 'settings.json'), 'utf8'));
	return { ideasRaw, linksRaw, settingsRaw };
}

export function buildPlan(content) {
	const { ideasRaw, linksRaw, settingsRaw } = content;
	const ideas = [];
	const links = [];
	const warnings = [];
	for (const r of ideasRaw) {
		const t = transformIdea(r.slug, r.data, r.body);
		ideas.push({ id: t.id, doc: t.doc });
		warnings.push(...t.warnings);
	}
	for (const r of linksRaw) {
		const t = transformLink(r);
		links.push({ id: t.id, doc: t.doc });
		warnings.push(...t.warnings);
	}
	const settings = transformSettings(settingsRaw);
	const vi = validateIdeas(ideas, ideasRaw.length);
	const vl = validateLinks(links, linksRaw.length);
	const vs = validateSettings(settings);
	const info = [];
	const scored = ideas.filter((e) => e.doc.scores && typeof e.doc.scores === 'object' && Object.keys(e.doc.scores).length > 0);
	const noInterest = scored.filter((e) => !('interest' in e.doc.scores)).length;
	if (noInterest > 0) info.push(`${noInterest} ideas with scores missing "interest" (stored as-is)`);
	return {
		ideas,
		links,
		settings,
		errors: [...vi.errors, ...vl.errors, ...vs.errors],
		warnings: [...warnings, ...vi.warnings, ...vl.warnings, ...vs.warnings],
		info
	};
}

export function formatReport(plan, opts, mode) {
	const out = [];
	out.push(`mode: ${mode.kind} (${mode.target})`);
	out.push(`project: ${opts.project}`);
	out.push(`settings: 1 docs [main]`);
	out.push(`links: ${plan.links.length} docs [${plan.links.map((e) => e.id).join(', ')}]`);
	out.push(`ideas: ${plan.ideas.length} docs [${plan.ideas.map((e) => e.id).join(', ')}]`);
	out.push(`errors: ${plan.errors.length}`);
	for (const e of plan.errors) out.push(`  ERROR ${e}`);
	out.push(`warnings: ${plan.warnings.length}`);
	for (const w of plan.warnings) out.push(`  WARN ${w}`);
	for (const i of plan.info) out.push(`info: ${i}`);
	return out.join('\n');
}

export async function main(argv, env, io = { log: console.log, error: console.error }) {
	let opts;
	try {
		opts = parseArgs(argv);
	} catch (e) {
		io.error(e.message);
		return 2;
	}
	const mode = resolveMode(env);
	if (!mode) {
		io.error(
			'No Firestore target. Set FIRESTORE_EMULATOR_HOST (emulator) or GOOGLE_APPLICATION_CREDENTIALS (path to a service account key JSON for real mode).'
		);
		return 2;
	}
	const plan = buildPlan(loadContent(opts.contentDir));
	io.log(formatReport(plan, opts, mode));
	if (opts.dryRun) {
		io.log(`DRY RUN: no writes made. ${plan.errors.length ? 'FAILED validation.' : 'Validation passed.'}`);
		return plan.errors.length ? 1 : 0;
	}
	if (plan.errors.length) {
		io.error('Aborting before any write: validation errors above.');
		return 1;
	}
	if (mode.kind === 'real') {
		io.log(`REAL MODE: project ${opts.project}, credentials ${mode.target}`);
		if (!opts.yes) {
			io.error(`Refusing to write to real project ${opts.project} without --yes.`);
			return 1;
		}
	}
	const db = await (io.getDb ?? defaultGetDb)(opts, mode);
	if (mode.kind === 'real' && !opts.forceOverwrite) {
		const existing = await findExisting(db, plan);
		if (existing.length) {
			io.error(
				`Refusing to overwrite: ${existing.length} target doc(s) already exist (e.g. ${existing.slice(0, 3).join(', ')}). ` +
					'Firestore may hold newer edits than migration/cc-content/. Re-run with --force-overwrite to clobber them.'
			);
			return 1;
		}
	}
	await writeAll(db, plan);
	const res = await verifyAll(db, plan);
	for (const i of res.info) io.log(`info: ${i}`);
	if (!res.ok) {
		io.error('VERIFY FAILED:');
		for (const d of res.diffs) io.error(`  ${d}`);
		return 1;
	}
	io.log(`OK ideas ${plan.ideas.length}/${plan.ideas.length}, links ${plan.links.length}/${plan.links.length}, settings 1/1`);
	return 0;
}

// ---- Firestore side (Admin SDK; db is injectable for tests) ----

async function defaultGetDb(opts) {
	const { initializeApp, getApps } = await import('firebase-admin/app');
	const { getFirestore } = await import('firebase-admin/firestore');
	const app = getApps()[0] ?? initializeApp({ projectId: opts.project });
	return getFirestore(app);
}

const BATCH_MAX = 400;
const COLLECTIONS = ['settings', 'links', 'ideas'];

function planDocs(plan) {
	return {
		settings: [{ id: 'main', doc: plan.settings }],
		links: plan.links,
		ideas: plan.ideas
	};
}

export async function findExisting(db, plan) {
	const found = [];
	const docs = planDocs(plan);
	for (const col of COLLECTIONS) {
		for (let i = 0; i < docs[col].length; i += 50) {
			const chunk = docs[col].slice(i, i + 50);
			const snaps = await Promise.all(chunk.map((e) => db.collection(col).doc(e.id).get()));
			snaps.forEach((s, j) => s.exists && found.push(`${col}/${chunk[j].id}`));
		}
	}
	return found;
}

export async function writeAll(db, plan) {
	const docs = planDocs(plan);
	for (const col of COLLECTIONS) {
		for (let i = 0; i < docs[col].length; i += BATCH_MAX) {
			const batch = db.batch();
			for (const e of docs[col].slice(i, i + BATCH_MAX)) batch.set(db.collection(col).doc(e.id), e.doc);
			await batch.commit();
		}
	}
}

export function canonical(v) {
	if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
	if (v !== null && typeof v === 'object') {
		return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
	}
	return JSON.stringify(v) ?? 'undefined';
}

export async function verifyAll(db, plan) {
	const diffs = [];
	const info = [];
	const docs = planDocs(plan);
	for (const col of COLLECTIONS) {
		const snap = await db.collection(col).get();
		const actual = new Map(snap.docs.map((d) => [d.id, d.data()]));
		const planned = new Set(docs[col].map((e) => e.id));
		for (const e of docs[col]) {
			if (!actual.has(e.id)) diffs.push(`missing ${col}/${e.id}`);
			else if (canonical(actual.get(e.id)) !== canonical(e.doc)) {
				diffs.push(`mismatch ${col}/${e.id}\n    expected ${canonical(e.doc).slice(0, 300)}\n    actual   ${canonical(actual.get(e.id)).slice(0, 300)}`);
			}
		}
		const extra = [...actual.keys()].filter((id) => !planned.has(id));
		if (extra.length) info.push(`${extra.length} extra doc(s) in ${col} not in source (left untouched): ${extra.slice(0, 5).join(', ')}`);
	}
	return { ok: diffs.length === 0, diffs, info };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main(process.argv.slice(2), process.env).then((c) => process.exit(c));
}
