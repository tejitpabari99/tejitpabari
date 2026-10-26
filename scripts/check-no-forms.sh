#!/usr/bin/env bash
# scripts/check-no-forms.sh
# Round 3 (r3-01-schema-icons-content): the entire /live subsystem
# (src/pages/live/) was removed — there is no more hosted-page registry to
# guard. This script now exits 0 cleanly and harmlessly whenever
# src/pages/live/ doesn't exist, rather than erroring, so it stays a
# harmless no-op instead of a broken gate. It's kept (rather than deleted)
# and still wired into package.json/CI in case a hosted mini-project ever
# comes back under src/pages/live/ in the future.
#
# Original purpose, preserved for that future case: fail (nonzero exit) the
# moment any file under src/pages/live/ contains input-accepting markup —
# see PRD 05 §4.7 (pre-round-3 history).
set -euo pipefail

if [ ! -d src/pages/live ]; then
  echo "check:no-forms passed — src/pages/live/ does not exist (the /live subsystem was removed in round 3)."
  exit 0
fi

# -P/-z (PCRE + null-data, so the whole file is one match buffer instead of
# grep's normal line-at-a-time matching) with the (?s) inline flag makes
# this multiline-aware, catching a Prettier-wrapped self-closing tag like
# `<input\n  type="text"\n/>` (grep is line-based by default: nothing
# follows "input" on ITS OWN line, so a plain per-line pattern never sees
# the newline that comes right after it). The class also now includes "/"
# and end-of-tag so `<input/>` (no space before the slash) matches too —
# the previous `[ >]` class required either a space or ">" immediately
# after the tag name and missed both of these.
if grep -RPzl '(?s)<(input|form|textarea)[\s/>]' src/pages/live; then
  echo ""
  echo "FRAGILITY GUARD FAILED: input-accepting markup found under src/pages/live/."
  echo "Both /privacy and /terms currently state this site has no forms. Before"
  echo "this ships, revise src/pages/PrivacyPage.tsx and src/pages/TermsPage.tsx"
  echo "(their \"no forms\" sections + LAST_UPDATED) — see PRD 05 §4.7."
  exit 1
fi

echo "check:no-forms passed — no input-accepting markup under src/pages/live/."
