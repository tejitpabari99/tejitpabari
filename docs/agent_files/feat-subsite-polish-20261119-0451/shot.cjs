const { chromium } = require('playwright');
const out = __dirname + '/screenshots/';
(async () => {
  const b = await chromium.launch({executablePath:'/root/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell'});
  for (const [site, port] of [['main',5197],['nonprofit',5199]])
  for (const [w,h,n] of [[390,800,'mobile'],[1440,900,'desktop']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
    await p.screenshot({ path: out + `${site}-${n}-closed.png`, clip:{x:0,y:0,width:w,height:260} });
    const btn = p.getByRole('button', { name: 'Open menu' });
    if (await btn.isVisible()) { await btn.click(); await p.waitForTimeout(200);
      await p.screenshot({ path: out + `${site}-${n}-open.png`, clip:{x:0,y:0,width:w,height:460} }); }
    else console.log(site, n, 'hamburger hidden');
  }
  await b.close();
})();
