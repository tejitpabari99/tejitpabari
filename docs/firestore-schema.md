# Firestore schema

Project `tejitpabari-99`. Three collections. Dates are **strings** (lossless migration from the old files; trivial REST parse in SP04). `ideas` doc ids are single-segment slugs `[a-z0-9-]+`. Link slugs may be multi-segment (see `links` below). Rules do no field-shape validation (admin-only writer, Decision 9).

## `ideas/{slug}`

| Field | Type | Notes |
|---|---|---|
| `date` | string | `YYYY-MM-DD` |
| `title` | string | |
| `status` | string | default `new` |
| `tags` | array<string> | |
| `link` | string | |
| `ranked` | bool | |
| `scores` | map<string, number> | criterion id -> score |
| `github` | string | |
| `brief` | string | |
| `body` | string | markdown, including any `## Ranking Analysis` |

## `links/{docId}`

**Slug rule** (owner decision 2026-11-18): one or more segments joined by `/`, each `[a-z0-9-]+`; regex `^[a-z0-9-]+(\/[a-z0-9-]+)*$`; lowercased; no leading/trailing/double slashes. Examples: `meet`, `juno/pitch-deck`, `juno/founder/fred`.

**Doc id** = slug with `/` replaced by `~` (`juno/pitch-deck` -> `juno~pitch-deck`). `~` is never valid in a slug, so the mapping is reversible. Single-segment slugs: id == slug. Shared helper: `admin/src/lib/slug.js` (`SLUG_RE`, `isValidSlug`, `slugToDocId`, `docIdToSlug`); `hosting/go/go-core.js` keeps a drift-tested copy.

| Field | Type | Notes |
|---|---|---|
| `slug` | string | real slash form (`juno/pitch-deck`); doc id is `slugToDocId(slug)` |
| `url` | string | |
| `tags` | array<string> | |
| `description` | string | optional; `''` ok |
| `created` | string | `YYYY-MM-DD` |
| `expiresAt` | string \| null | ISO date, or `null` for no expiry |

Dropped from the old model: `clicks`, `lastClicked`, `redirectType`.

## `settings/main`

| Field | Type | Notes |
|---|---|---|
| `guestVisibility` | map<string, bool> | keys `'/'`, `'/ideas'`, `'/links'` |
| `ranker.criteria` | array<map> | each: `id` string, `label` string, `weight` int >= 1, `invert` bool |

`guestVisibility['/']` is **UI/route-guard only** (home is a static launcher with no data); rules never reference it. Prefix semantics: `/ideas` also covers `/ideas/[slug]`. `/ideas/rank` and `/settings` stay admin-only in the UI.

## Access (see `firestore.rules`)

- Admin = `email_verified == true` and email in the admin list.
- `ideas`: read admin or `guestVisibility['/ideas']`; write admin.
- `links`: `get` always public (go. redirects); `list` admin or `guestVisibility['/links']`; write admin.
- `settings/main`: public read; write admin. Other `settings/*` docs denied.
- Everything else denied. If `settings/main` is missing, guest reads of `ideas`/`links` list are denied (safe default; seed it first).

## Changing the admin email (single-edit procedure)

The email lives in two places because rules cannot import JS. Edit both, then run `npm run test:rules` (the drift test fails if they differ):

1. `admin/src/lib/config.js` -> `ADMIN_EMAILS`
2. `firestore.rules` -> the list in `isAdmin()`
3. Deploy rules: `firebase deploy --only firestore:rules`

## Read-cost note

A rules `get()` bills one extra document read per evaluated request (cached within a request). A `list` query evaluates the rule once, not per document, so a guest page load = N docs + 1. Admin reads short-circuit on `isAdmin()` and pay nothing extra. Spark limit is 50k reads/day; this is far below it.
