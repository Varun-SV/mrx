# Configuration Reference

mrx is configured via a single YAML file. mrx looks for the config in this order:

1. Path passed via `--config <path>` CLI flag
2. `./mrx.config.yaml` in the current working directory
3. `~/.mrx/mrx.config.yaml`
4. Built-in defaults (Ollama + `qwen3:8b` / `llama3.1:8b`)

---

## Full Schema

```yaml
# Interaction mode to use when none is specified on the command line
# Options: planner_executor | think_then_answer | manual
default_mode: think_then_answer       # default: think_then_answer

# Persist conversation history to a SQLite database
session_memory: false                  # default: false
session_db_path: ~/.mrx/sessions.db   # default: ~/.mrx/sessions.db
                                       # ~ is expanded to $HOME

models:
  reasoner:
    provider: ollama                   # required: openai | anthropic | google | ollama | lmstudio | openrouter
    model: qwen3:8b                    # required: model name (provider-specific)
    baseUrl: http://localhost:11434    # optional: custom endpoint (ollama/lmstudio)
    apiKey: sk-...                     # optional: overrides env var
    temperature: 0.6                   # optional: 0.0–2.0 (default: 0.7)
    maxTokens: 8192                    # optional: max output tokens (default: 4096)

  executor:
    provider: ollama
    model: llama3.1:8b
    temperature: 0.7
    maxTokens: 4096

  # Optional: dedicated tool-calling model
  # If omitted, falls back to executor for tool calls
  tool_caller:
    provider: openrouter
    model: google/gemini-flash-1.5
    temperature: 0.2
    maxTokens: 2048

tools:
  shell: false        # Allow bash command execution (default: false)
  file_system: true   # Read/write/list files (default: true)
  web_fetch: true     # Fetch URLs (default: true)

display:
  show_reasoning: false  # Show reasoner's CoT in TUI (default: false)
  stream: true           # Stream tokens as they arrive (default: true)
```

---

## Field Reference

### `default_mode`
- Type: `'planner_executor' | 'think_then_answer' | 'manual'`
- Default: `'think_then_answer'`
- The interaction mode used when none is specified via `--mode`.

### `session_memory`
- Type: `boolean`
- Default: `false`
- When `true`, conversation history is persisted to SQLite at `session_db_path`.

### `session_db_path`
- Type: `string` (path, `~` expanded)
- Default: `~/.mrx/sessions.db`
- Path to the SQLite database file. Parent directory is created automatically.

### `models.reasoner` / `models.executor` / `models.tool_caller`
Each model config accepts:

| Field | Type | Required | Description |
|---|---|---|---|
| `provider` | string enum | ✅ | One of the 6 supported providers |
| `model` | string | ✅ | Model identifier (e.g. `gpt-4o`, `llama3.1:8b`) |
| `baseUrl` | URL string | ❌ | Custom endpoint (Ollama/LM Studio) |
| `apiKey` | string | ❌ | API key (overrides env var) |
| `temperature` | number 0–2 | ❌ | Sampling temperature (default: 0.7) |
| `maxTokens` | positive integer | ❌ | Max output tokens (default: 4096) |

`tool_caller` is optional and falls back to `executor` if absent.

### `tools`
- `shell`: `boolean` — enables the `run_shell` tool. Default `false` (off by default for safety).
- `file_system`: `boolean` — enables `read_file`, `write_file`, `list_directory`. Default `true`.
- `web_fetch`: `boolean` — enables `web_fetch`. Default `true`.

### `display`
- `show_reasoning`: `boolean` — show the reasoner's `<thinking>` block in TUI. Default `false`.
- `stream`: `boolean` — stream executor tokens as they arrive. Default `true`.
