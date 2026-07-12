# Changelog

All notable changes to mrx will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Corrected the npm package identity from `mrx` to `mrx-ai`
- Raised the minimum supported runtime from Node.js 20 to Node.js 22.12

### Added
- Initial project structure
- Three interaction modes: Planner→Executor, Think-then-Answer, Manual
- Six provider integrations via Vercel AI SDK (OpenAI, Anthropic, Google Gemini, Ollama, LM Studio, OpenRouter)
- Tool system: shell execution, file system read/write/list, web fetch
- Interactive TUI with Ink (StatusBar, ChatView, MessageBubble, InputBar)
- One-shot CLI mode with Commander.js (`ask`, `chat`, `sessions`, `check`)
- Optional SQLite session history via `better-sqlite3`
- Role-separated model orchestration (reasoner / executor / tool_caller)
- User config via `mrx.config.yaml` with Zod schema validation
- Unit and integration tests with mock provider (84 tests, ≥80% coverage)
- GitHub Actions CI/CD pipeline (lint, test on Node.js 22.12 and the latest LTS, build)
- Version-gated npm publishing after merges to `main`
