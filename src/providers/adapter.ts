import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider';
import { generateText, streamText, jsonSchema, type CoreMessage, type CoreTool } from 'ai';
import type { ModelConfig, ToolDefinition, ToolCall, ToolResult } from '../types/index.js';

function resolveModel(config: ModelConfig) {
  switch (config.provider) {
    case 'openai': {
      const key = config.apiKey ?? process.env.OPENAI_API_KEY;
      if (!key)
        throw new Error(
          'OpenAI API key not found. Set OPENAI_API_KEY env var or apiKey in config.',
        );
      return createOpenAI({ apiKey: key })(config.model);
    }
    case 'anthropic': {
      const key = config.apiKey ?? process.env.ANTHROPIC_API_KEY;
      if (!key)
        throw new Error(
          'Anthropic API key not found. Set ANTHROPIC_API_KEY env var or apiKey in config.',
        );
      return createAnthropic({ apiKey: key })(config.model);
    }
    case 'google': {
      const key = config.apiKey ?? process.env.GOOGLE_API_KEY;
      if (!key)
        throw new Error(
          'Google API key not found. Set GOOGLE_API_KEY env var or apiKey in config.',
        );
      return createGoogleGenerativeAI({ apiKey: key })(config.model);
    }
    case 'ollama':
      return createOllama({ baseURL: config.baseUrl ?? 'http://localhost:11434/api' })(
        config.model,
      );
    case 'lmstudio':
      return createOpenAI({
        baseURL: config.baseUrl ?? 'http://localhost:1234/v1',
        apiKey: 'lm-studio',
      })(config.model);
    case 'openrouter': {
      const key = config.apiKey ?? process.env.OPENROUTER_API_KEY;
      if (!key)
        throw new Error(
          'OpenRouter API key not found. Set OPENROUTER_API_KEY env var or apiKey in config.',
        );
      return createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: key,
        headers: { 'HTTP-Referer': 'https://github.com/Varun-SV/mrx' },
      })(config.model);
    }
    default:
      throw new Error(`Unknown provider: ${(config as ModelConfig).provider}`);
  }
}

function toAiSdkTools(tools: ToolDefinition[]): Record<string, CoreTool> {
  return Object.fromEntries(
    tools.map((t) => [
      t.name,
      {
        description: t.description,
        parameters: jsonSchema(t.parameters as Record<string, unknown>),
        execute: t.execute,
      } satisfies CoreTool,
    ]),
  );
}

export interface GenerateOptions {
  modelConfig: ModelConfig;
  messages: CoreMessage[];
  tools?: ToolDefinition[];
  system?: string;
}

export interface GenerateResult {
  text: string;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
}

export interface StreamOptions extends GenerateOptions {
  onChunk: (chunk: string) => void;
  onFinish?: (fullText: string) => void;
}

/**
 * Non-streaming generation. Returns text plus any tool calls/results produced.
 * Enables multi-step tool execution automatically when tools are provided.
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const model = resolveModel(options.modelConfig);
  const sdkResult = await generateText({
    model,
    messages: options.messages,
    system: options.system,
    tools: options.tools ? toAiSdkTools(options.tools) : undefined,
    maxSteps: options.tools?.length ? 10 : 1,
    temperature: options.modelConfig.temperature ?? 0.7,
    maxTokens: options.modelConfig.maxTokens ?? 4096,
  });

  type RawCall = { toolCallId: string; toolName: string; args: Record<string, unknown> };
  type RawResult = { toolCallId: string; result: unknown };

  const toolCalls: ToolCall[] = (sdkResult.toolCalls as unknown as RawCall[]).map((tc) => ({
    id: tc.toolCallId,
    name: tc.toolName,
    args: tc.args,
  }));

  const toolResults: ToolResult[] = (sdkResult.toolResults as unknown as RawResult[]).map((tr) => ({
    toolCallId: tr.toolCallId,
    result: String(tr.result),
  }));

  return { text: sdkResult.text, toolCalls, toolResults };
}

/**
 * Streaming generation. Calls onChunk for each token and onFinish when done.
 */
export async function stream(options: StreamOptions): Promise<string> {
  const model = resolveModel(options.modelConfig);
  const result = await streamText({
    model,
    messages: options.messages,
    system: options.system,
    tools: options.tools ? toAiSdkTools(options.tools) : undefined,
    temperature: options.modelConfig.temperature ?? 0.7,
    maxTokens: options.modelConfig.maxTokens ?? 4096,
  });

  let fullText = '';
  for await (const chunk of result.textStream) {
    fullText += chunk;
    options.onChunk(chunk);
  }

  options.onFinish?.(fullText);
  return fullText;
}
