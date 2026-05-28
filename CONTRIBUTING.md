# Contributing to mrx

Thank you for your interest in contributing! Please read this guide before opening a PR.

## Development Setup

```bash
git clone https://github.com/Varun-SV/mrx.git
cd mrx
npm install
npm run dev -- ask "hello"   # run from source
```

## Branch Conventions

```
main        ← production-ready, tagged releases
develop     ← integration branch, PRs merge here
feature/*   ← new features
fix/*       ← bug fixes
docs/*      ← documentation-only changes
chore/*     ← tooling, deps, CI changes
```

All PRs should target `develop`, not `main`.

## Commit Conventions

Format: `<type>(<scope>): <description>`

**Types:** `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`, `ci`

**Scopes:** `config`, `providers`, `tools`, `engine`, `session`, `cli`, `tui`, `types`, `tests`, `ci`, `docs`

Examples:
```
feat(engine): implement planner-executor mode
fix(providers): handle Ollama connection timeout
docs(readme): add provider setup instructions
test(session): add cascade delete test
```

Every commit must pass `npm run lint` and `npm run format:check`.

## Running Tests

```bash
npm test                  # run all tests
npm run test:coverage     # with coverage report (requires ≥80%)
npm run test:watch        # watch mode
```

Tests use Jest + ts-jest in ESM mode. All tests run without network access (AI provider is mocked via `moduleNameMapper`). Use `jest.unstable_mockModule()` for ESM module mocking.

## Code Style

ESLint + Prettier are enforced:

```bash
npm run lint          # check lint
npm run lint:fix      # auto-fix lint
npm run format        # auto-format
npm run format:check  # check format (used in CI)
```

## Submitting a PR

1. Create a branch from `develop`: `git checkout -b feature/my-feature develop`
2. Make your changes with appropriate tests
3. Ensure `npm run lint`, `npm run test`, and `npm run build` all exit 0
4. Update `CHANGELOG.md` under `[Unreleased]`
5. Open a PR targeting `develop`
6. Fill in the PR template

PRs require passing CI (lint + test on Node 20 & 22 + build) before merge.
