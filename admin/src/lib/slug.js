// Shared pure slug helpers (browser SPA + node migration script).
// hosting/go/go-core.js keeps its own copy (no bundler); tests/go/go-guards.test.js checks drift.
// Slug: one or more segments joined by "/", each [a-z0-9-]+. Firestore doc id = slug with "/" -> "~"
// ("~" is never valid in a slug, so the mapping is reversible).

export const SLUG_RE = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

export const isValidSlug = (s) => typeof s === 'string' && SLUG_RE.test(s);
export const slugToDocId = (slug) => String(slug).replaceAll('/', '~');
export const docIdToSlug = (id) => String(id).replaceAll('~', '/');

// Idea slug: single segment [a-z0-9-]+ (Firestore doc id == slug). "rank" is a reserved route (enforced by callers/migration).
export const IDEA_SLUG_RE = /^[a-z0-9-]+$/;
export const isValidIdeaSlug = (s) => typeof s === 'string' && IDEA_SLUG_RE.test(s);
