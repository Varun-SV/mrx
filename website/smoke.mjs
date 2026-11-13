import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
const root = resolve(process.env.SITE_ROOT || 'dist');
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.mjs': 'text/javascript',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(
      /^\/mrx/,
      '',
    );
    const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
    if (!file.startsWith(root + '/')) throw new Error('Outside root');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
// Infinite CSS animations still playing, named by animation and element class.
const runningLoops = () =>
  document
    .getAnimations()
    .filter((a) => a.effect?.getTiming().iterations === Infinity && a.playState === 'running')
    .map((a) => `${a.animationName} @ ${a.effect.target?.className || a.effect.target?.tagName}`);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: [
    '--no-sandbox',
    '--enable-webgl',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/mrx/`);
  assert.equal(
    await page.getByRole('heading', { name: /A team of minds/ }).count(),
    1,
    'The split hero must exist',
  );
  console.log('PASS: hero');
  await mkdir('artifacts', { recursive: true });
  // the particle field renders once WebGL and the vendored three.js addons load
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, {
    timeout: 20000,
  });
  assert.ok((await page.evaluate(() => window.__mrx.count)) > 1000, 'Particle field is populated');
  assert.match(await page.locator('#hud-pts').innerText(), /PTS \d/);
  // skip the cinematic intro so floating labels are placed immediately in slow CI renderers
  await page.evaluate(() => window.__mrx.intro(true));
  await page.locator('[data-core-role=executor].on').waitFor({ timeout: 15000 });
  await page.locator('[data-core-role=executor]').click();
  assert.equal(await page.locator('#scene-status').innerText(), 'EXECUTOR / SELECTED');
  assert.equal(
    await page.locator('[data-role=executor]').getAttribute('aria-pressed'),
    'true',
    'Scene labels and role cards stay in sync',
  );
  await page.waitForFunction(
    () => Number(getComputedStyle(document.querySelector('#gl')).opacity) > 0.99,
  );
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'artifacts/hero.png' });
  console.log('PASS: WebGL particle stage, labels and role sync');
  // scrolling drives the chapters: HUD, rail and the pinned roles story
  await page.evaluate(() => {
    const roles = document.querySelector('#roles');
    const top = roles.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: top + (roles.offsetHeight - innerHeight) * 0.5, behavior: 'instant' });
  });
  await page.waitForFunction(() => document.querySelector('#hud-name').textContent === 'THE CAST');
  await page.waitForFunction(
    () => document.querySelector('[data-role=executor]').getAttribute('aria-pressed') === 'true',
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'artifacts/roles.png' });
  await page.locator('#providers').scrollIntoViewIfNeeded();
  await page.evaluate(() =>
    window.scrollTo({ top: document.querySelector('#providers').offsetTop, behavior: 'instant' }),
  );
  await page.waitForFunction(() => document.querySelector('#hud-name').textContent === 'PROVIDERS');
  assert.equal(await page.locator('[data-rail="3"]').getAttribute('class'), 'on');
  console.log('PASS: scroll chapters, HUD, rail and pinned roles story');
  await page.getByRole('button', { name: 'Run simulation' }).click();
  await page.getByText('COMPLETE', { exact: true }).waitFor({ timeout: 8000 });
  assert.match(await page.locator('#demo-log').innerText(), /GET \/todos/);
  console.log('PASS: default simulation completes');
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/desktop.png' });
  await page.getByRole('tab', { name: /Plan → execute/ }).click();
  await page.getByRole('button', { name: 'Run simulation' }).click();
  await page.getByText('COMPLETE', { exact: true }).waitFor({ timeout: 8000 });
  assert.match(await page.locator('#demo-log').innerText(), /WAVE 2/);
  await page.locator('#playground').screenshot({ path: 'artifacts/playground.png' });
  await page.getByRole('tab', { name: /Manual routing/ }).click();
  await page.getByRole('button', { name: /@tool_caller/ }).click();
  await page.getByRole('button', { name: 'Run simulation' }).click();
  await page.getByText('COMPLETE', { exact: true }).waitFor({ timeout: 8000 });
  assert.match(await page.locator('#demo-log').innerText(), /No tools are executed/);
  await page.getByRole('button', { name: 'Replay simulation' }).click();
  await page.getByRole('tab', { name: /Think → answer/ }).click();
  await page.waitForTimeout(1100);
  assert.equal(
    await page.locator('.log-entry').count(),
    0,
    'Switching mode cancels stale simulation steps',
  );
  await page.getByRole('tab', { name: /Think → answer/ }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(
    await page.getByRole('tab', { name: /Plan → execute/ }).getAttribute('aria-selected'),
    'true',
  );
  await page.locator('[data-role=tool_caller]').click();
  assert.match(await page.locator('#role-description').innerText(), /does not dispatch tools/);
  await page.getByRole('button', { name: 'Pause motion' }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Resume motion' }).getAttribute('aria-pressed'),
    'true',
  );
  assert.deepEqual(
    await page.evaluate(runningLoops),
    [],
    'Pause motion stops every looping decorative animation',
  );
  await page.getByRole('button', { name: 'Run simulation' }).click();
  await page.getByText('COMPLETE', { exact: true }).waitFor();
  assert.ok(
    await page
      .locator('.log-entry')
      .evaluateAll((entries) =>
        entries.every((entry) => Number(getComputedStyle(entry).opacity) > 0.99),
      ),
    'Paused-motion simulation results remain visible',
  );
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy npm install command', exact: true }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'npm install -g mrx-ai');
  assert.deepEqual(errors, []);
  console.log(
    'PASS: three modes, replay, cancellation, keyboard tabs, roles, clipboard and motion',
  );
  await page.goto(`http://127.0.0.1:${server.address().port}/mrx/guide/configuration.html`);
  await page.getByRole('heading', { name: /Configuration/, level: 1 }).waitFor();
  await page.getByRole('link', { name: 'Interaction modes', exact: true }).click();
  assert.match(page.url(), /\/mrx\/guide\/modes.html$/);
  await page.screenshot({ path: 'artifacts/guide.png' });
  await page.goBack();
  assert.match(page.url(), /configuration.html$/);
  console.log('PASS: on-site guides and browser-back navigation');
  for (const width of [375, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`http://127.0.0.1:${server.address().port}/mrx/`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
      console.log(
        await page.evaluate(() =>
          [...document.querySelectorAll('body *')]
            .map((el) => ({
              tag: el.tagName,
              cls: el.className,
              left: el.getBoundingClientRect().left,
              right: el.getBoundingClientRect().right,
            }))
            .filter((x) => x.right > innerWidth + 1 || x.left < -1)
            .slice(0, 30),
        ),
      );
      await page.screenshot({ path: 'artifacts/overflow.png', fullPage: true });
    }
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `No overflow at ${width}px`,
    );
    await page.getByRole('button', { name: 'Run simulation' }).click();
    await page.getByText('COMPLETE', { exact: true }).waitFor({ timeout: 8000 });
    await page.getByRole('tab', { name: /Manual routing/ }).click();
    await page.getByRole('button', { name: /@executor/ }).click();
    if (width === 390) {
      for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += 700) {
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
        await page.waitForTimeout(100);
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForFunction(
        () => Number(getComputedStyle(document.querySelector('#gl')).opacity) > 0.99,
      );
      await page.waitForTimeout(900);
      await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
      await page.screenshot({ path: 'artifacts/mobile-hero.png' });
    }
  }
  console.log('PASS: mobile/tablet controls and widths');
  const reducedPage = await browser.newPage({
    reducedMotion: 'reduce',
    viewport: { width: 1280, height: 900 },
  });
  await reducedPage.goto(`http://127.0.0.1:${server.address().port}/mrx/`);
  await reducedPage.getByRole('button', { name: 'Resume motion' }).waitFor();
  assert.deepEqual(
    await reducedPage.evaluate(runningLoops),
    [],
    'Reduced motion leaves no looping decorative animation running',
  );
  await reducedPage.getByRole('button', { name: 'Run simulation' }).click();
  assert.equal(await reducedPage.locator('#demo-state').innerText(), 'COMPLETE');
  await reducedPage.screenshot({ path: 'artifacts/reduced-motion.png' });
  const noGL = await browser.newPage();
  await noGL.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/i.test(type) ? null : original.call(this, type, ...args);
    };
  });
  await noGL.goto(`http://127.0.0.1:${server.address().port}/mrx/`);
  await noGL.getByText('STATIC VIEW / WEBGL UNAVAILABLE').waitFor();
  await noGL.getByRole('button', { name: 'Run simulation' }).click();
  await noGL.getByText('COMPLETE', { exact: true }).waitFor({ timeout: 8000 });
  const noJS = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 },
  });
  await noJS.goto(`http://127.0.0.1:${server.address().port}/mrx/`);
  assert.equal(await noJS.getByRole('heading', { name: /A team of minds/ }).count(), 1);
  assert.ok(await noJS.getByRole('link', { name: 'Read the docs', exact: true }).isVisible());
  assert.ok(await noJS.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  console.log('PASS: reduced motion, WebGL fallback, no-JavaScript content');
} finally {
  await browser.close();
  server.close();
}
