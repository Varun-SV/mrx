import { z } from 'zod';

const ProviderSchema = z.enum([
  'openai',
  'anthropic',
  'google',
  'ollama',
  'lmstudio',
  'openrouter',
]);

const ModelConfigSchema = z.object({
  provider: ProviderSchema,
  model: z.string().min(1),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
});

export const MrxConfigSchema = z.object({
  default_mode: z.enum(['planner_executor', 'think_then_answer', 'manual']),
  session_memory: z.boolean(),
  session_db_path: z.string().optional(),
  models: z.object({
    reasoner: ModelConfigSchema,
    executor: ModelConfigSchema,
    tool_caller: ModelConfigSchema.optional(),
  }),
  tools: z.object({
    shell: z.boolean(),
    file_system: z.boolean(),
    web_fetch: z.boolean(),
  }),
  display: z.object({
    show_reasoning: z.boolean(),
    stream: z.boolean(),
  }),
});
