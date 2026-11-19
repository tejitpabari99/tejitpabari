const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({executablePath:'/root/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
  const sites = { mint: 'https://mint.onolys.com', onolys: 'https://onolys.com', 'juno-app': 'https://app.meetjuno.health/', 'juno-website': 'https://meetjuno.health/' };
  for (const [k, u] of Object.entries(sites)) {
    const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
    try { await p.goto(u, { waitUntil: 'networkidle', timeout: 30000 }); } catch (e) { console.log(k, 'err', e.message); }
    await p.waitForTimeout(1500);
    console.log('=====', k, p.url(), await p.title());
    console.log((await p.innerText('body')).slice(0, 1500));
    await p.screenshot({ path: `/tmp/shots/${k}.png` });
  }
  await b.close();
})();
