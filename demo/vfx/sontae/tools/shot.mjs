// 촬영 도구: node tools/shot.mjs <url> <out.png> [width] [height] [waitMs] [scrollY]
// 콘솔 오류·페이지 오류를 stdout 에 함께 찍는다.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw;
for (const p of ['/Users/sejin/.npm/_npx/705bc6b22212b352/node_modules/playwright', '/Users/sejin/.npm/_npx/06d4b2c446e40bbc/node_modules/playwright', 'playwright', 'playwright-core']) {
  try { pw = require(p); break; } catch {}
}
if (!pw) { console.error('playwright not found'); process.exit(2); }
const [url, out = 'shot.png', w = '1440', h = '900', wait = '1500', scrollY = '0'] = process.argv.slice(2);
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => errors.push('goto: ' + e.message));
if (+scrollY) await page.evaluate((y) => window.scrollTo(0, y), +scrollY);
await page.waitForTimeout(+wait);
await page.screenshot({ path: out });
console.log(JSON.stringify({ out, errors, title: await page.title() }));
await browser.close();
