// Route gate (UX only; Firestore rules are authoritative). Same semantics as the old hooks.server.js.
export const ADMIN_ONLY = ['/settings', '/ideas/rank'];
const PUBLIC_PATHS = ['/login'];

const matches = (path, p) => path === p || path.startsWith(p + '/');

export function canView(path, role, guestVisibility) {
	if (PUBLIC_PATHS.some((p) => matches(path, p))) return true;
	if (role === 'admin') return true;
	if (ADMIN_ONLY.some((p) => matches(path, p))) return false;
	return Object.entries(guestVisibility || {}).some(([p, v]) => v === true && matches(path, p));
}
