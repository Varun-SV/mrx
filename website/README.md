# MRX website

Static GitHub Pages site built around **The Split**: one fixed, full-screen Three.js particle field that re-forms for every chapter of the page. A prompt enters as a blue beam, the orchestrator (a prism) refracts it into the three role colours, and the same particles become the cast, the relay, the provider constellation, a config file made of light, a convergence spiral and finally the `mrx` wordmark. The CLI and its npm package have no new runtime dependency.

| Chapter | Section | Formation |
| --- | --- | --- |
| 00 | `#top` | The split: beam → prism → reasoner / executor / tool caller |
| 01 | `#roles` | The cast: lattice, build stack, gyroscope (pinned scroll story) |
| 02 | `#playground` | The relay: reacts to the playground mode and each simulated step |
| 03 | `#providers` | Six provider nodes threading into one session |
| 04 | `#configure` | `mrx.config.yaml` sampled into particles |
| 05 | `#install` | Three arms converging |
| 06 | `#finale` | The `mrx` wordmark with a blinking cursor |

Sources are `docs/index.html`, `docs/site.css`, `docs/site.mjs` (page logic, scroll → chapter mapping, boot sequence, playground) and `docs/scene.mjs` (particle engine). The build copies logos/fonts, vendors Three.js 0.170.0 plus the post-processing addons it needs (bloom, output) with the MIT license, generates on-site guide pages from Markdown, and validates local HTML links. The page resolves `three` through an import map, so nothing loads from a CDN.

## Behaviour and fallbacks

- **Boot sequence:** a short terminal boot plays on first load, then the particles burst out of the prism. Any key, click or scroll skips it. It is skipped for reduced motion, deep links and reloads below the fold.
- **Interaction:** pointer movement bends the field, and a click or tap sends a shockwave plus a prompt pulse through the split. Floating labels are pinned to 3D anchors, and the hero labels select roles.
- **Performance:** 30k particles on desktop, 14k on small or touch screens, and 8k with `?fx=lite`. A frame-time watchdog drops bloom and pixel ratio, then halves the particle count, on slow hardware.
- **Accessibility:** reduced-motion visitors start with motion paused. Without WebGL, the page shows a static SVG of the split. All content, the playground and the guides work without the 3D scene, and core content works without JavaScript.
- **Honest simulation:** the playground never calls an LLM or executes a tool. Its static examples distinguish the implemented routing modes.

## Develop and verify

```sh
npm ci --prefix website
npm run build --prefix website
cd website
npx playwright install chromium --only-shell
npm test
python -m http.server 8080 --directory dist
```

Open http://localhost:8080/. Tests serve the same build under `/mrx/`, matching the GitHub Pages repository prefix. Set `CHROMIUM_PATH` to use an existing compatible Chromium executable. Browser screenshots are written to `website/artifacts/` and uploaded by CI. The page exposes `window.__mrx` (the scene controller) for the smoke test.

## Publish

In repository Settings → Pages, set **Source: GitHub Actions**. The `MRX website` workflow builds and checks pull requests, then deploys main pushes or a manual workflow run. The production URL is https://varun-sv.github.io/mrx/.

GitHub Pages must be enabled by someone with repository administration access. The workflow uses only `contents: read` for builds and `pages: write` plus `id-token: write` in the deployment job. Never add provider API keys to this website.
