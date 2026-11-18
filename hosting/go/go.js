import { parseSlug, slugToDocId, decodeLink, classify, createRedirectTimer } from './go-core.js';

// Keep PROJECT_ID / API_KEY in sync with admin/src/lib/firebase-config.js (tests/go checks drift).
const PROJECT_ID = 'tejitpabari-99';
const API_KEY = 'PLACEHOLDER_API_KEY';
const GA_ID = 'G-9NLS3NG63M';

const root = document.getElementById('content');

function show(title, text, opts = {}) {
	root.textContent = '';
	const h = document.createElement('h2');
	h.textContent = title;
	const p = document.createElement('p');
	if (opts.code) {
		p.append(opts.before || '');
		const c = document.createElement('code');
		c.textContent = opts.code;
		p.append(c, opts.after || '');
	} else {
		p.textContent = text;
	}
	root.append(h, p);
	if (opts.retry) {
		const a = document.createElement('a');
		a.href = '#';
		a.textContent = 'Retry';
		a.addEventListener('click', (e) => {
			e.preventDefault();
			location.reload();
		});
		root.append(a);
	}
	document.title = title;
}

// gtag.js starts loading now, in parallel with the Firestore request.
let gaState = 'loading'; // loading | ready | failed
let onGaSettled = () => {};
function startGa() {
	window.dataLayer = window.dataLayer || [];
	window.gtag = function () {
		window.dataLayer.push(arguments);
	};
	window.gtag('js', new Date());
	window.gtag('config', GA_ID, { send_page_view: false });
	const s = document.createElement('script');
	s.async = true;
	s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
	s.onload = () => {
		gaState = 'ready';
		onGaSettled();
	};
	s.onerror = () => {
		gaState = 'failed';
		onGaSettled();
	};
	document.head.append(s);
}

function redirect(slug, live) {
	const rt = createRedirectTimer({
		fire: () => location.replace(live.url),
		now: Date.now,
		setT: (f, ms) => setTimeout(f, ms),
		clearT: (id) => clearTimeout(id)
	});
	try {
		window.gtag('event', 'go_click', { slug, target_host: live.host, event_callback: rt.go });
	} catch {
		return rt.go();
	}
	rt.start(gaState);
	onGaSettled = () => rt.settled(gaState);
}

async function main() {
	const r = parseSlug(location.pathname);
	if (r.kind === 'empty') return show('URL Shortener', 'No slug provided.');
	if (r.kind === 'invalid') return notFound(decodedForDisplay());
	const slug = r.slug;
	startGa();
	let res;
	try {
		res = await fetch(
			`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/links/${encodeURIComponent(slugToDocId(slug))}?key=${encodeURIComponent(API_KEY)}`
		);
	} catch {
		return show("Couldn't load this link", 'Try again.', { retry: true });
	}
	if (res.status === 404) return notFound(slug);
	if (!res.ok) return show("Couldn't load this link", 'Try again.', { retry: true });
	let link;
	try {
		link = decodeLink(await res.json());
	} catch {
		return show("Couldn't load this link", 'Try again.', { retry: true });
	}
	const c = classify(link, new Date());
	if (c.kind === 'expired') return show('410 — Link expired', 'This link expired on ' + c.expiresAt + '.');
	if (c.kind === 'bad') return show('Link unavailable', 'This link is misconfigured.');
	if (c.kind === 'live') return redirect(slug, c);
	notFound(slug);
}

function decodedForDisplay() {
	try {
		return decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g, '')).slice(0, 100);
	} catch {
		return location.pathname.slice(0, 100);
	}
}

function notFound(slug) {
	show('404 — Link not found', '', {
		code: 'go.tejitpabari.com/' + slug,
		before: 'The short link ',
		after: ' does not exist.'
	});
}

main();
