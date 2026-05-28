# Interaction Modes

mrx supports three interaction modes. Switch at any time with `--mode` or `Ctrl+M` in the TUI.

---

## `think_then_answer`

**Best for:** Complex questions, architecture decisions, anything that benefits from careful reasoning before answering.

### How it works

```
User message
     │
     ▼
┌────────────────────┐
│   REASONER model   │  ← Produces <thinking>...</thinking> + conclusion
└────────────────────┘
     │
     │  conclusion (no raw thinking)
     ▼
┌────────────────────┐
│   EXECUTOR model   │  ← Produces the final user-facing response
└────────────────────┘
     │
     ▼
User sees final response
(+ reasoning if show_reasoning: true)
```

### Algorithm
1. Send the user's message to the **reasoner** model with a system prompt requesting `<thinking>` tags.
2. Extract the `<thinking>` block as the `reasoning` output.
3. Strip the thinking block; pass only the conclusion to the **executor** as context.
4. The executor produces the final response (streamed if `display.stream: true`).

### Example
```bash
mrx ask "what are the trade-offs between SQL and NoSQL for a social network?" \
  --mode think_then_answer --show-reasoning
```

---

## `planner_executor`

**Best for:** Multi-step tasks, code generation, tasks with clear sub-problems that benefit from a plan.

### How it works

```
User message
     │
     ▼
┌────────────────────┐
│   REASONER model   │  ← Produces numbered plan: 1. X  2. Y  3. Z
└────────────────────┘
     │
     ├─ Step 1 ──► EXECUTOR ──► result 1
     ├─ Step 2 ──► EXECUTOR ──► result 2  (with step 1 result as context)
     └─ Step 3 ──► EXECUTOR ──► result 3  (with steps 1+2 results as context)
                       │
                       ▼
               EXECUTOR synthesizes
               all step results into
               final cohesive answer
```

### Algorithm
1. Send the user message to the **reasoner** with a prompt requesting a numbered list of steps (no preamble, no markdown).
2. Parse the numbered steps from the reasoner's output.
3. For each step: send it to the **executor** along with the original query, the full plan, and all previous step results as context. Tools are available.
4. After all steps complete, send a synthesis prompt to the **executor**.
5. Return the synthesis as the final response.

### Example
```bash
mrx ask "create a Node.js REST API for managing todo items with tests" \
  --mode planner_executor
```

---

## `manual`

**Best for:** Power users who want explicit control over which model handles each message.

### How it works

```
User message
     │
     ├─ starts with @reasoner ──► REASONER model
     ├─ starts with @executor ──► EXECUTOR model
     ├─ starts with @tool_caller ─► TOOL_CALLER model
     └─ no prefix ──────────────► EXECUTOR model (default)
```

### Prefix syntax
| Prefix | Routes to |
|---|---|
| `@reasoner <message>` | Reasoner model |
| `@executor <message>` | Executor model |
| `@tool_caller <message>` | Tool caller model (falls back to executor) |
| _(no prefix)_ | Executor model |

### Example
```bash
mrx chat
# In TUI:
> @reasoner analyze the trade-offs between microservices and monoliths
> @executor write a one-page summary of microservices benefits
> @tool_caller read the file ./architecture.md and summarize it
```
