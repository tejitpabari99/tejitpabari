const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch({executablePath: process.env.CH});
  for (const w of [390, 768, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    const xs = await p.$$eval('h2', (hs) => hs.map((h) => [h.textContent, Math.round(h.getBoundingClientRect().left)]));
    console.log(w, JSON.stringify(xs));
    await p.screenshot({ path: `docs/agent_files/feat-subsite-polish-20261119-0451/screenshots/home-${w}.png`, fullPage: true });
  }
  await b.close();
})();
