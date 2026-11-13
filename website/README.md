# MRX website

Static GitHub Pages website with a self-hosted Three.js 0.170.0 scene and illustrative mode playground. The CLI and its npm package have no new runtime dependency.

## Develop and verify

```sh
npm ci --prefix website
npm run build --prefix website
cd website
npx playwright install chromium --only-shell
npm test
python -m http.server 8080 --directory dist
```

Open http://localhost:8080/. Tests serve the same build under `/mrx/`, matching the GitHub Pages repository prefix. Set `CHROMIUM_PATH` to use an existing compatible Chromium executable. Browser screenshots are written to `website/artifacts/` and uploaded by CI.

Sources are `docs/index.html`, `docs/site.css`, `docs/site.mjs`, and `docs/scene.mjs`. The build copies existing logos/fonts, vendors Three.js with its MIT license, and generates on-site guide pages from Markdown. Local HTML links are validated at build time. The existing design-system demo is preserved separately.

The playground never calls an LLM or executes a tool. Its static examples distinguish the implemented routing modes. Reduced-motion visitors start with motion paused; WebGL failure shows a CSS/SVG fallback; core content and guides work without JavaScript.

## Publish

In repository Settings → Pages, set **Source: GitHub Actions**. The `MRX website` workflow builds and checks pull requests, then deploys main pushes or a manual workflow run. The production URL is https://varun-sv.github.io/mrx/.

GitHub Pages must be enabled by someone with repository administration access. The workflow uses only `contents: read` for builds and `pages: write` plus `id-token: write` in the deployment job. Never add provider API keys to this website.
