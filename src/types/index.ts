// src/types/index.ts

export type Provider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'ollama'
  | 'lmstudio'
  | 'openrouter';

export type Role = 'reasoner' | 'executor' | 'tool_caller';

export type InteractionMode = 'planner_executor' | 'think_then_answer' | 'manual';

export interface ModelConfig {
  provider: Provider;
  model: string;
  baseUrl?: string; // for ollama/lmstudio custom endpoints
  apiKey?: string; // overrides env var if set
  temperature?: number; // 0.0–2.0, default 0.7
  maxTokens?: number; // default 4096
}

export interface MrxConfig {
  default_mode: InteractionMode;
  session_memory: boolean;
  session_db_path: string; // default: ~/.mrx/sessions.db
  models: {
    reasoner: ModelConfig;
    executor: ModelConfig;
    tool_caller?: ModelConfig; // optional; falls back to executor if absent
  };
  tools: {
    shell: boolean;
    file_system: boolean;
    web_fetch: boolean;
  };
  display: {
    show_reasoning: boolean; // show reasoner's CoT in TUI
    stream: boolean; // stream tokens or wait for full response
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  model?: string; // which model produced this
  modelRole?: Role; // which role was used
  timestamp: number;
  isReasoning?: boolean; // true for hidden CoT messages
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: string;
  error?: string;
}

export interface Session {
  id: string;
  name: string;
  mode: InteractionMode;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface SessionMeta {
  id: string;
  name: string;
  mode: InteractionMode;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export interface OrchestrationResult {
  finalResponse: string;
  reasoning?: string; // hidden CoT, if captured
  toolsInvoked: ToolCall[];
  messagesProduced: Message[];
}

export interface StreamChunk {
  type: 'reasoning' | 'response' | 'tool_call' | 'tool_result' | 'done';
  content: string;
  role?: Role;
  model?: string;
}

// Tool definitions (passed to AI SDK)
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema object
  execute: (args: Record<string, unknown>) => Promise<string>;
}
