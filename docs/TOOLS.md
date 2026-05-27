# Tool System

mrx exposes three built-in tools that models can use during inference. Tools are enabled per `mrx.config.yaml`.

---

## `run_shell`

**Config key:** `tools.shell: true`  
**Default:** disabled

Execute a bash command on the user's machine.

### Arguments
| Arg | Type | Required | Description |
|---|---|---|---|
| `command` | string | ✅ | The bash command to run |
| `cwd` | string | ❌ | Working directory (default: `process.cwd()`) |
| `timeout` | number | ❌ | Timeout in milliseconds (default: 30000) |

### Example model usage
```
run_shell({ command: "git log --oneline -5" })
run_shell({ command: "npm test", cwd: "/home/user/myproject", timeout: 60000 })
```

### Return value
- On success: combined stdout + stderr output as a string
- On failure: `ERROR: <message>` string (never throws)

### ⚠️ Security implications
Enabling `shell: true` allows the model to execute **arbitrary bash commands** on your machine. This includes file deletion, network requests, and system modifications.

**Only enable `shell: true` if:**
- You trust the models you're using
- You're working in a sandboxed environment
- You're using manual mode with careful review of tool calls

---

## `read_file`

**Config key:** `tools.file_system: true`  
**Default:** enabled

Read the text content of a file.

### Arguments
| Arg | Type | Required | Description |
|---|---|---|---|
| `path` | string | ✅ | Absolute or relative path to the file |

### Return value
- File content as UTF-8 string
- `ERROR: ...` if file doesn't exist, is not readable, or exceeds 100 KB

### Limits
Files larger than 100 KB return an error string instead of truncated content.

---

## `write_file`

**Config key:** `tools.file_system: true`

Write content to a file. Creates all intermediate directories automatically.

### Arguments
| Arg | Type | Required | Description |
|---|---|---|---|
| `path` | string | ✅ | Absolute or relative path to the file |
| `content` | string | ✅ | Content to write |

### Return value
- `Successfully wrote N characters to /absolute/path`
- `ERROR: ...` if write fails

---

## `list_directory`

**Config key:** `tools.file_system: true`

List files and subdirectories at a given path.

### Arguments
| Arg | Type | Required | Description |
|---|---|---|---|
| `path` | string | ✅ | Absolute or relative path to the directory |
| `recursive` | boolean | ❌ | List recursively (default: `false`) |

### Return value
- Newline-separated list of relative paths
- `(empty directory)` if the directory is empty
- `ERROR: ...` if path doesn't exist or isn't a directory

---

## `web_fetch`

**Config key:** `tools.web_fetch: true`  
**Default:** enabled

Fetch the content of a URL and return it as plain text.

### Arguments
| Arg | Type | Required | Description |
|---|---|---|---|
| `url` | string | ✅ | The URL to fetch |
| `selector` | string | ❌ | CSS selector pattern for text extraction |

### Return value
- Response body as UTF-8 text (capped at 50 KB)
- If `selector` provided: extracted inner text from matching tags (regex-based heuristic, not DOM parsing)
- `ERROR: HTTP <status> <statusText>` on HTTP errors
- `ERROR: <message>` on network failure

### Notes
- Requests include a `User-Agent: mrx-cli/0.1.0` header
- Responses over 50 KB are truncated to the first 50 KB
