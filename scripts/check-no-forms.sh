#!/usr/bin/env bash
# scripts/check-no-forms.sh
# Run before adding any new entry to src/pages/live/registry.ts's
# HOSTED_LIVE_PAGES, and before every real deploy. Fails (nonzero exit) the
# moment any file under src/pages/live/ contains input-accepting markup —
# see the FRAGILITY GUARD comment in src/routes.tsx and PRD 05 §4.7.
set -euo pipefail

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
