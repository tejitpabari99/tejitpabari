#!/usr/bin/env node
// scripts/check-no-em-dash.mjs
//
// Guard for SHARED-CONTEXT locked decision 7a / brief #12: no long em
// dashes (—), the HTML entity &mdash;, or the numeric entity &#8212;
// anywhere in USER-VISIBLE copy. Wired into `npm run check:launch`
// (package.json) so this can't silently regress once R6 lands. See PRD
// 06 §4.5 for the full scope reasoning.
//
// Deliberately does NOT flag: en dashes (a different character serving a
// different, legitimate role — numeric ranges — never banned by the
// owner's feedback, PRD 06 §4.1); &rsquo;/&ldquo;/&rdquo; (an unrelated
// apostrophe/quote-encoding convention); code comments (never part of the
// AST this script walks — comments are lexer trivia, not syntax-tree
// nodes); *.test.ts(x) (developer-facing test descriptions/fixtures, not
// rendered copy); anything outside the four scanned roots below.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = path.resolve(import.meta.dirname, '..');

const PATTERNS = [
  { name: 'em dash (—)', test: (s) => s.includes('—') },
  { name: '&mdash; entity', test: (s) => s.includes('&mdash;') },
  { name: '&#8212; entity', test: (s) => s.includes('&#8212;') },
];

export function findMatches(text) {
  return PATTERNS.filter((p) => p.test(text)).map((p) => p.name);
}

const failures = []; // { file, line, snippet, kinds }

function report(file, line, text) {
  const kinds = findMatches(text);
  if (kinds.length === 0) return;
  failures.push({ file: path.relative(ROOT, file), line, snippet: text.trim().slice(0, 90), kinds });
}

const COPY_ATTRS = new Set(['title', 'description', 'placeholder', 'aria-label', 'alt', 'label']);

/** Exported for the companion unit test — takes already-read source text so
 *  the test can exercise this against fixtures with no real filesystem I/O. */
export function scanTsxSource(file, source) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found = [];

  function at(node) {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  }

  function visit(node) {
    if (ts.isJsxText(node)) {
      if (findMatches(node.text).length > 0) found.push({ line: at(node), text: node.text });
    } else if (ts.isJsxAttribute(node) && node.name && COPY_ATTRS.has(node.name.getText(sourceFile))) {
      const init = node.initializer;
      if (init && ts.isStringLiteral(init)) {
        if (findMatches(init.text).length > 0) found.push({ line: at(init), text: init.text });
      } else if (init && ts.isJsxExpression(init) && init.expression) {
        const expr = init.expression;
        if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
          if (findMatches(expr.text).length > 0) found.push({ line: at(expr), text: expr.text });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

export function scanSiteConfigSource(file, source) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const found = [];

  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(sourceFile) === 'DEFAULT_DESCRIPTION' && node.initializer) {
      const text = node.initializer.getText(sourceFile);
      const line = sourceFile.getLineAndCharacterOfPosition(node.initializer.getStart(sourceFile)).line + 1;
      if (findMatches(text).length > 0) found.push({ line, text });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

function walkDir(dir, exts, fn) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkDir(full, exts, fn);
    else if (exts.some((e) => entry.endsWith(e))) fn(full);
  }
}

function main() {
  // 1. src/**/*.tsx, excluding *.test.tsx
  walkDir(path.join(ROOT, 'src'), ['.tsx'], (file) => {
    if (file.endsWith('.test.tsx')) return;
    const source = readFileSync(file, 'utf-8');
    for (const { line, text } of scanTsxSource(file, source)) report(file, line, text);
  });

  // 2. src/config/site.ts — DEFAULT_DESCRIPTION only
  const siteFile = path.join(ROOT, 'src/config/site.ts');
  for (const { line, text } of scanSiteConfigSource(siteFile, readFileSync(siteFile, 'utf-8'))) {
    report(siteFile, line, text);
  }

  // 3. src/content/**/*.md — whole file, line by line
  walkDir(path.join(ROOT, 'src/content'), ['.md'], (file) => {
    readFileSync(file, 'utf-8').split('\n').forEach((line, i) => report(file, i + 1, line));
  });

  // 4. index.html — whole file, line by line
  const htmlFile = path.join(ROOT, 'index.html');
  readFileSync(htmlFile, 'utf-8').split('\n').forEach((line, i) => report(htmlFile, i + 1, line));

  if (failures.length > 0) {
    console.error(`check-no-em-dash: found ${failures.length} offending line(s):\n`);
    for (const f of failures) {
      console.error(`  ${f.file}:${f.line}  [${f.kinds.join(', ')}]\n    ${f.snippet}`);
    }
    console.error(
      '\nRewrite with a period, colon, or parentheses instead — never a mechanical comma swap. ' +
        'See .dev/website-revamp-r2/06-voice-sweep-and-ship/PRD.md §4.4 for worked examples.',
    );
    process.exit(1);
  }

  console.log('check-no-em-dash passed — no em dashes found in user-visible copy.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
