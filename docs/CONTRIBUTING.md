# Contributing to mrx

See the root [CONTRIBUTING.md](../CONTRIBUTING.md) for the main contributing guide.

This document covers additional technical details for contributors.

---

## Architecture Overview

```
src/
├── cli/index.ts          Commander.js entry point
├── tui/                  Ink React components
├── engine/
│   ├── orchestrator.ts   Dispatches to interaction modes
│   ├── router.ts         Resolves model config for a role
│   └── modes/            Three interaction mode implementations
├── providers/adapter.ts  Vercel AI SDK unified wrapper
├── tools/                Tool implementations
├── session/store.ts      SQLite session persistence
├── config/               Config loading and validation
└── types/index.ts        Shared TypeScript interfaces
```

## Adding a New Provider

1. Install the AI SDK provider package: `npm install @ai-sdk/new-provider`
2. Add the provider name to `Provider` type in `src/types/index.ts`
3. Add a case in `resolveModel()` in `src/providers/adapter.ts`
4. Add the provider to the Zod enum in `src/config/schema.ts`
5. Document in `docs/PROVIDERS.md`
6. Add tests in `tests/unit/config.test.ts` (schema validation)

## Adding a New Tool

1. Create `src/tools/myTool.ts` implementing `ToolDefinition`
2. Export it and register in `src/tools/registry.ts`
3. Add a config key in `MrxConfig.tools` (`src/types/index.ts` + `src/config/schema.ts` + `src/config/defaults.ts`)
4. Document in `docs/TOOLS.md`
5. Add tests in `tests/unit/tools.test.ts`

## Adding a New Interaction Mode

1. Create `src/engine/modes/myMode.ts` with a function signature matching the other modes
2. Export the main entry function
3. Add it to the `InteractionMode` type in `src/types/index.ts`
4. Add a case in `orchestrate()` in `src/engine/orchestrator.ts`
5. Add a schema entry in `src/config/schema.ts`
6. Add integration tests in `tests/integration/myMode.test.ts`
7. Document in `docs/MODES.md`
