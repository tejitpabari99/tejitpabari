import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildParsePrompt, buildEnhancePrompt, buildRankPrompt, ALLOWED_TAGS } from '../../admin/src/lib/ai-prompts.js';

const criteria = [
	{ id: 'feasibility', label: 'Feasibility', weight: 1, invert: false },
	{ id: 'ttb', label: 'Time to build', weight: 1, invert: true },
	{ id: 'interest', label: 'Interest', weight: 1, invert: false }
];
const idea = { title: 'My Idea', brief: 'A brief', content: 'Body text' };

test('parse prompt keeps verbatim steps, drops JSON-only line, embeds raw text', () => {
	const p = buildParsePrompt('raw stuff');
	assert.match(p, /You are helping organize project ideas\. Given the following raw notes, do these things:/);
	assert.match(p, /1\. Write a short, clear title \(5 words max\)/);
	assert.match(p, /Polish the English — fix grammar, clarity, flow\. Do NOT add new ideas or content that wasn't already there\./);
	assert.match(p, /4\. Suggest 1-3 tags from this list: AI, productivity, social, B2B, mobile, web, extension, health, finance, food, travel, education, tools/);
	assert.match(p, /Raw notes:\nraw stuff$/);
	assert.doesNotMatch(p, /Return ONLY/);
	assert.doesNotMatch(p, /no markdown/);
	assert.equal(ALLOWED_TAGS.length, 13);
});

test('enhance prompt verbatim', () => {
	const p = buildEnhancePrompt('EXISTING', 'NOTES');
	assert.match(p, /You are helping expand a project idea\. Below is the existing description and new notes added by the author\./);
	assert.match(p, /Do NOT invent new content — only incorporate what is already written\. Keep the existing structure where possible\./);
	assert.match(p, /Return ONLY the merged markdown content \(no JSON, no explanation, no code fences\)\./);
	assert.match(p, /Existing content:\nEXISTING\n\nNew notes:\nNOTES$/);
});

test('rank prompt: inverted note present, interest absent, verbatim text', () => {
	const p = buildRankPrompt(idea, criteria);
	assert.ok(p.includes('- Time to build (lower is better — score the raw difficulty, not inverted): id="ttb"'));
	assert.ok(p.includes('- Feasibility: id="feasibility"'));
	assert.doesNotMatch(p, /interest/i);
	assert.match(p, /Score each criterion from 1 \(worst\) to 5 \(best\)\. Use the full range — don't default to middle scores\./);
	assert.match(p, /Idea title: My Idea\nBrief: A brief/);
	assert.match(p, /Idea content:\nBody text/);
});

test('rank prompt omits brief line when empty', () => {
	const p = buildRankPrompt({ ...idea, brief: '' }, criteria);
	assert.doesNotMatch(p, /Brief:/);
});
