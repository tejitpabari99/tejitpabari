const { chromium } = require('playwright');
const out = 'docs/agent_files/feat-subsite-polish-20261119-0451/screenshots/';
(async () => {
  const b = await chromium.launch({executablePath:'/root/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
  for (const [w,h,n] of [[390,844,'390'],[1440,900,'1440']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    for (const t of ['Accept all','Accept','Reject all','Decline']) { const l = p.getByRole('button',{name:t}); if (await l.count()) { await l.first().click().catch(()=>{}); break; } }
    await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,150));}window.scrollTo(0,0);}); await p.waitForTimeout(800);
    await p.screenshot({ path: out+`healthtech-home-${n}.png`, fullPage: true });
    if (n==='1440') {
      await p.goto('http://localhost:5173/projects/miti', { waitUntil: 'networkidle' });
      await p.waitForTimeout(800);
      await p.screenshot({ path: out+'healthtech-detail-miti-1440.png', fullPage: true });
    }
  }
  await b.close();
})();
