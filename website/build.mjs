import { mkdir, cp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const out = resolve(here, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(resolve(out, 'assets/vendor'), { recursive: true });
for (const file of [
  'index.html',
  'site.css',
  'site.mjs',
  'scene.mjs',
  'demo.html',
  '_ds_bundle.js',
  'styles.css',
]) {
  await cp(resolve(repo, 'docs', file), resolve(out, file));
}
for (const dir of ['assets', 'tokens'])
  await cp(resolve(repo, 'docs', dir), resolve(out, dir), { recursive: true });
await cp(
  resolve(here, 'node_modules/three/build/three.module.min.js'),
  resolve(out, 'assets/vendor/three.module.min.js'),
);
await cp(
  resolve(here, 'node_modules/three/LICENSE'),
  resolve(out, 'assets/vendor/THREE-LICENSE.txt'),
);
const pages = [
  ['index', 'Getting started', 'README.md'],
  ['configuration', 'Configuration', 'docs/CONFIGURATION.md'],
  ['modes', 'Interaction modes', 'docs/MODES.md'],
  ['providers', 'Providers', 'docs/PROVIDERS.md'],
  ['tools', 'Tools', 'docs/TOOLS.md'],
  ['contributing', 'Contributing', 'docs/CONTRIBUTING.md'],
];
const paths = new Map(pages.map(([slug, , source]) => [source, slug + '.html']));
function rewriteHref(href, source) {
  if (!href || /^(https?:|mailto:|#)/.test(href)) return href;
  const [path, hash] = href.split('#');
  const normalized = resolve(repo, dirname(source), path).slice(repo.length + 1);
  if (paths.has(normalized)) return paths.get(normalized) + (hash ? '#' + hash : '');
  return `https://github.com/Varun-SV/mrx/blob/main/${normalized}` + (hash ? '#' + hash : '');
}
await mkdir(resolve(out, 'guide'), { recursive: true });
for (const [slug, title, source] of pages) {
  const renderer = new marked.Renderer();
  renderer.link = function ({ href, title: tip, tokens }) {
    const url = rewriteHref(href, source).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    return `<a href="${url}"${tip ? ` title="${tip.replaceAll('"', '&quot;')}"` : ''}>${this.parser.parseInline(tokens)}</a>`;
  };
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const id = tokens
      .map((t) => t.text || '')
      .join('')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .trim()
      .replace(/\s+/g, '-');
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };
  const body = marked.parse(await readFile(resolve(repo, source), 'utf8'), { renderer });
  const nav = pages
    .map(([s, t]) => `<a href="./${s}.html"${s === slug ? ' aria-current="page"' : ''}>${t}</a>`)
    .join('');
  await writeFile(
    resolve(out, 'guide', slug + '.html'),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — mrx documentation</title><meta name="description" content="${title} for the MRX multi-role model orchestration CLI."><meta name="theme-color" content="#080c10"><link rel="icon" href="../assets/mrx-mark.svg"><link rel="stylesheet" href="../site.css"></head><body><a class="skip-link" href="#main">Skip to content</a><header class="nav"><a class="brand" href="../"><img src="../assets/mrx-mark.svg" width="30" height="30" alt="">mrx.</a><nav aria-label="Main navigation"><a href="../#playground">Playground</a><a href="./">Docs</a></nav><div class="nav-actions"><a class="button small" href="../#install">Get started →</a></div></header><div class="guide-layout"><nav class="guide-sidebar" aria-label="Documentation"><span>MRX / DOCUMENTATION</span>${nav}</nav><main class="guide-article" id="main"><a class="guide-back" href="../">← BACK TO MRX</a>${body}</main></div><footer><a class="brand" href="../">mrx.</a><span>MIT © Varun S V.</span><nav aria-label="Footer"><a href="../">Home</a><a href="https://github.com/Varun-SV/mrx">GitHub →</a></nav></footer></body></html>`,
  );
}
await writeFile(resolve(out, '.nojekyll'), '');
// Check every local HTML link/asset before publishing. Remote resources stay remote.
const failures = [];
async function check(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      await check(full);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    const html = await readFile(full, 'utf8');
    for (const [, url] of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
      if (/^(https?:|data:|mailto:|#)/.test(url)) continue;
      const target = resolve(dirname(full), url.split('#')[0]);
      try {
        if (url.endsWith('/')) await readFile(resolve(target, 'index.html'));
        else await readFile(target);
      } catch {
        failures.push(`${full}: ${url}`);
      }
    }
  }
}
await check(out);
if (failures.length) throw new Error('Broken local links:\n' + failures.join('\n'));
console.log(`Built MRX website + ${pages.length} guide pages; all local HTML links resolve.`);
