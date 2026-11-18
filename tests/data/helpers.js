// Emulator-backed Firestore for SPA data-layer tests (permissive rules: rules are covered by tests/rules).
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, terminate } from 'firebase/firestore';

const OPEN = `rules_version = '2';
service cloud.firestore { match /databases/{d}/documents { match /{document=**} { allow read, write: if true; } } }`;

let n = 0;
export async function setup() {
	const env = await initializeTestEnvironment({
		projectId: 'tejitpabari-99',
		firestore: { rules: OPEN, host: '127.0.0.1', port: 8080 }
	});
	const app = initializeApp({ projectId: 'tejitpabari-99' }, `spa-test-${process.pid}-${n++}`);
	const db = getFirestore(app);
	connectFirestoreEmulator(db, '127.0.0.1', 8080);
	return { env, db };
}

export async function teardown({ env, db }) {
	await terminate(db);
	await env.cleanup();
}
