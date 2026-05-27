import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider';
import { generateText, streamText, jsonSchema, type CoreMessage, type CoreTool } from 'ai';
import type { ModelConfig, ToolDefinition } from '../types/index.js';

function resolveModel(config: ModelConfig) {
  const apiKey = config.apiKey;

  switch (config.provider) {
    case 'openai':
      return createOpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY })(config.model);
    case 'anthropic':
      return createAnthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY })(config.model);
    case 'google':
      return createGoogleGenerativeAI({ apiKey: apiKey ?? process.env.GOOGLE_API_KEY })(
        config.model,
      );
    case 'ollama':
      return createOllama({ baseURL: config.baseUrl ?? 'http://localhost:11434/api' })(config.model);
    case 'lmstudio':
      // LM Studio exposes an OpenAI-compatible endpoint
      return createOpenAI({
        baseURL: config.baseUrl ?? 'http://localhost:1234/v1',
        apiKey: 'lm-studio',
      })(config.model);
    case 'openrouter':
      return createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey ?? process.env.OPENROUTER_API_KEY,
        headers: { 'HTTP-Referer': 'https://github.com/Varun-SV/mrx' },
      })(config.model);
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

export interface StreamOptions extends GenerateOptions {
  onChunk: (chunk: string) => void;
  onFinish?: (fullText: string) => void;
}

/**
 * Non-streaming generation. Returns the full response text.
 */
export async function generate(options: GenerateOptions): Promise<string> {
  const model = resolveModel(options.modelConfig);
  const result = await generateText({
    model,
    messages: options.messages,
    system: options.system,
    tools: options.tools ? toAiSdkTools(options.tools) : undefined,
    temperature: options.modelConfig.temperature ?? 0.7,
    maxTokens: options.modelConfig.maxTokens ?? 4096,
  });
  return result.text;
}

/**
 * Streaming generation. Calls onChunk for each token and onFinish when done.
 * Falls back to generate() if stream: false in config.
 */
export async function stream(options: StreamOptions): Promise<string> {
  const model = resolveModel(options.modelConfig);
  const result = streamText({
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
