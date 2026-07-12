# mrx — Multi-Role Model Orchestration CLI

> Assign different LLMs to different roles (reasoner / executor / tool caller) in a single interactive session.

[![npm version](https://img.shields.io/npm/v/mrx-ai)](https://www.npmjs.com/package/mrx-ai)
[![CI](https://github.com/Varun-SV/mrx/actions/workflows/ci.yml/badge.svg)](https://github.com/Varun-SV/mrx/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.12-brightgreen)](https://nodejs.org)

---

## Why mrx?

- **Role separation** — Use a powerful reasoning model (e.g. `qwen3:14b`) for planning and a fast executor model (e.g. `gpt-4o-mini`) for output. Stop paying reasoning prices for every token.
- **Provider-agnostic** — Mix Ollama, OpenAI, Anthropic, Google Gemini, LM Studio, and OpenRouter in the same session. One config file, zero vendor lock-in.
- **Zero lock-in** — Fully open source (MIT). Your config, your models, your data.

---

## Quick Start

```bash
npm install -g mrx-ai
mrx ask "explain recursion"
```

No config required — defaults to Ollama with `qwen3:8b` (reasoner) and `llama3.1:8b` (executor). Make sure `ollama` is running locally.

---

## Installation

### Global install (recommended)
```bash
npm install -g mrx-ai
```

### One-shot via npx (no install needed)
```bash
npx mrx-ai ask "what is the capital of France?"
```

### Local development
```bash
git clone https://github.com/Varun-SV/mrx.git
cd mrx
npm install
npm run dev -- ask "hello"
```

---

## Configuration

Create `mrx.config.yaml` in your working directory (or `~/.mrx/mrx.config.yaml` for global defaults):

```yaml
# mrx.config.yaml
default_mode: think_then_answer

session_memory: true
session_db_path: ~/.mrx/sessions.db

models:
  reasoner:
    provider: ollama
    model: qwen3:14b
    temperature: 0.6
    maxTokens: 8192

  executor:
    provider: openai
    model: gpt-4o-mini
    temperature: 0.7
    maxTokens: 4096

  # Optional — falls back to executor if omitted
  tool_caller:
    provider: openrouter
    model: google/gemini-flash-1.5
    temperature: 0.2
    maxTokens: 2048

tools:
  shell: false
  file_system: true
  web_fetch: true

display:
  show_reasoning: false
  stream: true
```

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for every config option.

---

## Providers

| Provider | Env Var | Setup |
|---|---|---|
| **Ollama** | _(none)_ | `ollama pull qwen3:8b` |
| **OpenAI** | `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Anthropic** | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| **Google Gemini** | `GOOGLE_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **LM Studio** | _(none)_ | Start server in LM Studio app |
| **OpenRouter** | `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |

Set env vars in your shell profile or pass `apiKey` directly in the config file (redact before committing).

See [docs/PROVIDERS.md](docs/PROVIDERS.md) for detailed provider setup.

---

## Interaction Modes

### `think_then_answer` (default)
The **reasoner** model thinks through the problem internally (`<thinking>` tags). The **executor** then produces the user-facing response using the reasoning as context.

```bash
mrx ask "design a REST API for a todo app" --mode think_then_answer
```

Best for: complex questions, architecture decisions, explanations requiring depth.

### `planner_executor`
The **reasoner** produces a numbered step-by-step plan. The **executor** executes each step in sequence, then synthesizes a final answer.

```bash
mrx ask "refactor this codebase to use async/await" --mode planner_executor
```

Best for: multi-step tasks, code generation, tasks with clear sub-problems.

### `manual`
You choose the model by prefixing your message with `@reasoner`, `@executor`, or `@tool_caller`. No prefix routes to `@executor`.

```bash
mrx chat  # then type: @reasoner what's the best architecture for X?
```

Best for: power users who want explicit control over routing.

See [docs/MODES.md](docs/MODES.md) for ASCII flow diagrams and more examples.

---

## CLI Reference

| Command | Description |
|---|---|
| `mrx ask <prompt>` | One-shot: send a prompt, print the response |
| `mrx chat` | Start an interactive TUI session |
| `mrx sessions` | List saved sessions |
| `mrx check` | Validate config file |

### `mrx ask` flags

| Flag | Default | Description |
|---|---|---|
| `-m, --mode <mode>` | `think_then_answer` | Interaction mode |
| `-c, --config <path>` | auto-detect | Path to config file |
| `--show-reasoning` | off | Print the reasoning trace |

### `mrx chat` flags

| Flag | Description |
|---|---|
| `-m, --mode <mode>` | Starting interaction mode |
| `-c, --config <path>` | Path to config file |
| `-s, --session <id>` | Resume a session by ID |

---

## TUI Keybindings

| Key | Action |
|---|---|
| `Enter` | Send message |
| `Ctrl+M` | Cycle interaction mode |
| `Ctrl+R` | Toggle show reasoning |
| `Ctrl+C` | Quit |

---

## Tools

Tools let models interact with your environment. Enable them in config:

| Tool | Config key | What it does |
|---|---|---|
| Shell | `tools.shell: true` | Run bash commands via `execa` |
| File System | `tools.file_system: true` | Read, write, and list files |
| Web Fetch | `tools.web_fetch: true` | Fetch URLs and extract text |

> ⚠️ **Security note**: `shell: true` executes model-requested bash commands directly, without confirmation. Keep it disabled unless you trust the input and models and are running in a sandboxed environment.

See [docs/TOOLS.md](docs/TOOLS.md) for full tool documentation.

---

## Session History

Enable persistent conversation history in your config:

```yaml
session_memory: true
session_db_path: ~/.mrx/sessions.db
```

Then list sessions:
```bash
mrx sessions
# a1b2c3d4 My session [think_then_answer] 12 messages

# Resume a session in TUI:
mrx chat --session a1b2c3d4
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, branch conventions, and how to submit a PR.

---

## License

MIT © [Varun S V](https://github.com/Varun-SV)
