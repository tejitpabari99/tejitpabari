import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

// Browser-only: server-side/prerender contexts must not execute init.
// Idempotent: reuses an existing app on repeat import.
let app, auth, db;

if (typeof window !== 'undefined') {
	const isReuse = getApps().length > 0;
	app = isReuse ? getApp() : initializeApp(firebaseConfig);

	// SP05: initAppCheck(app)
	// SP05: no getAI here (SP05 Decision 7) - AI is lazy-imported in admin/src/lib/ai.js

	auth = getAuth(app);
	db = getFirestore(app);

	// Dev-only. Flag is explicit, never set in production builds; the inline
	// check lets the bundler drop this block (and its localhost literals) from
	// prod. Only on first init: connect*Emulator throws if called after the
	// service has been used.
	if (!isReuse) {
		if (import.meta.env.VITE_USE_EMULATORS === 'true') {
			connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
			connectFirestoreEmulator(db, '127.0.0.1', 8080);
		}
	}
}

export { app, auth, db };
