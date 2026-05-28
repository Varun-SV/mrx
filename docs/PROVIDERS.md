# Provider Setup

mrx supports six providers via the Vercel AI SDK. Each provider can be configured per-role.

---

## Ollama (default)

**Best for:** Local, private, zero-cost inference. No API key required.

**Setup:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull qwen3:8b        # good reasoner
ollama pull llama3.1:8b     # good executor
```

**Config:**
```yaml
models:
  reasoner:
    provider: ollama
    model: qwen3:14b
    baseUrl: http://localhost:11434  # optional, this is the default
```

**Known limitations:** Requires Ollama to be running locally. Tool calling support varies by model.

---

## OpenAI

**Setup:** Get an API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

```bash
export OPENAI_API_KEY=sk-...
```

**Config:**
```yaml
models:
  executor:
    provider: openai
    model: gpt-4o-mini
    # apiKey: sk-...  # override env var
```

**Supported models:** `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `o1-mini`, `o1-preview`, and all other OpenAI chat models.

---

## Anthropic

**Setup:** Get an API key at [console.anthropic.com](https://console.anthropic.com)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

**Config:**
```yaml
models:
  reasoner:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
```

**Supported models:** `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`, `claude-3-opus-20240229`, and all Claude 3+ models.

---

## Google Gemini

**Setup:** Get an API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

```bash
export GOOGLE_API_KEY=AIza...
```

**Config:**
```yaml
models:
  tool_caller:
    provider: google
    model: gemini-1.5-flash
```

**Supported models:** `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash`, and others.

---

## LM Studio

**Best for:** Local inference with a GUI model manager.

**Setup:**
1. Download and install [LM Studio](https://lmstudio.ai/)
2. Download a model inside the app
3. Start the local server: **Local Server** tab → **Start Server**
4. Server runs on `http://localhost:1234` by default

**Config:**
```yaml
models:
  executor:
    provider: lmstudio
    model: lmstudio-community/meta-llama-3.1-8b-instruct-gguf
    baseUrl: http://localhost:1234/v1  # optional, this is the default
```

**Known limitations:** Server must be manually started in the LM Studio app before use.

---

## OpenRouter

**Best for:** Access to 100+ models from many providers via a single API key.

**Setup:** Get an API key at [openrouter.ai/keys](https://openrouter.ai/keys)

```bash
export OPENROUTER_API_KEY=sk-or-...
```

**Config:**
```yaml
models:
  tool_caller:
    provider: openrouter
    model: google/gemini-flash-1.5
    # model: meta-llama/llama-3.1-8b-instruct
    # model: mistralai/mistral-7b-instruct
```

**Supported models:** Browse all available models at [openrouter.ai/models](https://openrouter.ai/models).

**Known limitations:** Pricing and rate limits vary per model. Check the OpenRouter dashboard.
