import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import { ADMIN_EMAILS } from './config.js';

// Role is a UX hint only; Firestore rules are authoritative.
// Emails compared case-insensitively (Google emails are case-insensitive).
export function roleFor(user) {
	if (!user || user.emailVerified !== true || typeof user.email !== 'string') return 'guest';
	const email = user.email.toLowerCase();
	return ADMIN_EMAILS.some((a) => a.toLowerCase() === email) ? 'admin' : 'guest';
}

// Last-known role, readable outside React (SP03 ai.js guard).
let lastRole = 'guest';
export function currentRole() {
	return lastRole;
}

// Subscribe to auth changes. Injectable for tests. Returns the unsubscribe fn.
// cb receives the Firebase user (or null) on every change, including the first.
export function onAuth(cb, authInst = auth, onChange = onAuthStateChanged) {
	return onChange(authInst, (u) => {
		lastRole = roleFor(u);
		cb(u);
	});
}

export function signInWithGoogle() {
	return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signOutUser() {
	return signOut(auth);
}
