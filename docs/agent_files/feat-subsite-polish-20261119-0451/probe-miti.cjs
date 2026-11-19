const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({executablePath:'/root/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await p.goto('https://miti.onolys.com', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500); await p.evaluate(()=>window.scrollTo(0,500)); await p.waitForTimeout(2500);
  await p.screenshot({ path: '/tmp/shots/miti.png' });
  await b.close();
})();
