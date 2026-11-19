const { chromium } = require('playwright');
(async () => {
  const base = process.argv[2];
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell' });
  for (const [w,h] of [[390,844],[1440,900]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(base + '/'); await p.waitForTimeout(1000);
    for (const t of ['Accept','Decline','Reject','Got it']) { const l = p.getByRole('button',{name:new RegExp(t,'i')}).first(); if (await l.count()) { await l.click().catch(()=>{}); break; } }
    const h2 = p.getByText('All projects').first();
    if (await h2.count()) await h2.scrollIntoViewIfNeeded();
    await p.waitForTimeout(500);
    await p.screenshot({ path: 'docs/agent_files/feat-subsite-polish-20261119-0451/screenshots/nonprofit-projects-' + w + '.png' });
    if (w === 1440) {
      await p.goto(base + '/projects/auto-emailer'); await p.waitForTimeout(800);
      await p.screenshot({ path: 'docs/agent_files/feat-subsite-polish-20261119-0451/screenshots/nonprofit-projects-detail-auto-emailer.png', fullPage: true });
    }
  }
  await b.close();
})();
