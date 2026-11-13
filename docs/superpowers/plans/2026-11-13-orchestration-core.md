# MRX Orchestration Core Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Track completion below.

**Goal:** Build, verify and publish the cinematic Three.js MRX website.
**Architecture:** Semantic static HTML with a progressively enhanced Three.js stage and deterministic browser-only demo. An isolated website build copies public assets and renders existing Markdown into guide pages.
**Tech Stack:** HTML, CSS, browser ES modules, Three.js 0.170.0, marked 15.0.12, Node.js, Playwright.
**Spec:** docs/superpowers/specs/2026-11-13-orchestration-core-design.md

## Global Constraints
- Static GitHub Pages at /mrx/; relative asset and guide links.
- No model calls, credentials, invented metrics, or CLI behavior changes.
- Preserve MRX colors, logos, fonts and design-system showcase.
- Reduced motion, paused rendering, no-JS and unavailable-WebGL fallback.

## Review Focus
- Mobile widths: controls and text remain visible without horizontal overflow.
- Mode changes during a running simulation: stale steps cannot appear.
- Browser-back and guide links: local documentation stays usable under /mrx/.
- WebGL failure: readable role illustration and all site controls survive.
- Animation pause: automatic animation stays stopped with reduced motion.

### Task 1: Static website and build
**Files:** docs/index.html, docs/site.css, website/package.json, website/build.mjs.
**Interfaces:** Build produces website/dist; docs/index.html provides #scene, role/mode controls and a readable fallback.
- [x] Add browser smoke checks that require the new heading and /mrx/guide/configuration.html; run against baseline and see missing heading fail.
- [x] Implement semantic sections, responsive styling, local fonts, guide generation and prefix-correct build output.
- [x] Build, check internal links and capture desktop/mobile screenshots.

### Task 2: Scene and simulation
**Files:** docs/site.mjs, docs/scene.mjs, website/smoke.mjs.
**Interfaces:** site.mjs dispatches mrx:role, mrx:mode, mrx:step and mrx:motion custom events. scene.mjs consumes events and renders three cores using Three.js.
- [x] Extend browser checks for mode changes, replay, role inspection and motion pause; verify missing controls fail.
- [x] Implement deterministic demo, copy feedback, role inspection and Three.js stage.
- [x] Verify all modes, rapid switching, reduced motion, unavailable WebGL and no JavaScript.

### Task 3: Publication
**Files:** .github/workflows/pages.yml, README.md, website documentation.
**Interfaces:** Pages workflow builds website/dist and deploys that artifact on main pushes; pull requests build/test without deploying.
- [ ] Add workflow, deployment instructions and README website link.
- [ ] Run website checks and existing project tests/build/lint/format.
- [ ] Independent whole-branch review, address important findings and commit.
- [ ] Push feature branch, create PR, merge the verified change for requested publication, and verify live Pages output or report a concrete permission blocker.
