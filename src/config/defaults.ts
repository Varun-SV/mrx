import type { MrxConfig } from '../types/index.js';

export const DEFAULT_CONFIG: MrxConfig = {
  default_mode: 'think_then_answer',
  session_memory: false,
  session_db_path: '~/.mrx/sessions.db',
  models: {
    reasoner: {
      provider: 'ollama',
      model: 'qwen3:8b',
      temperature: 0.6,
      maxTokens: 8192,
    },
    executor: {
      provider: 'ollama',
      model: 'llama3.1:8b',
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
  tools: {
    shell: false,
    file_system: true,
    web_fetch: true,
  },
  display: {
    show_reasoning: false,
    stream: true,
  },
};
