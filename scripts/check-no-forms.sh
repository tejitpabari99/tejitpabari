#!/usr/bin/env bash
# scripts/check-no-forms.sh
# Run before adding any new entry to src/pages/live/registry.ts's
# HOSTED_LIVE_PAGES, and before every real deploy. Fails (nonzero exit) the
# moment any file under src/pages/live/ contains input-accepting markup —
# see the FRAGILITY GUARD comment in src/routes.tsx and PRD 05 §4.7.
set -euo pipefail

if grep -rEn '<(input|form|textarea)[ >]' src/pages/live; then
  echo ""
  echo "FRAGILITY GUARD FAILED: input-accepting markup found under src/pages/live/."
  echo "Both /privacy and /terms currently state this site has no forms. Before"
  echo "this ships, revise src/pages/PrivacyPage.tsx and src/pages/TermsPage.tsx"
  echo "(their \"no forms\" sections + LAST_UPDATED) — see PRD 05 §4.7."
  exit 1
fi

echo "check:no-forms passed — no input-accepting markup under src/pages/live/."
