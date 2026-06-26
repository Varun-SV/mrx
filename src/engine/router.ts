import type { Role, MrxConfig, ModelConfig } from '../types/index.js';

const ROLE_KEY_MAP: Record<Role, keyof MrxConfig['models']> = {
  reasoner: 'reasoner',
  executor: 'executor',
  tool_caller: 'tool_caller',
};

export function resolveModelForRole(role: Role, config: MrxConfig): ModelConfig {
  const key = ROLE_KEY_MAP[role];
  if (key === undefined) throw new Error(`Unknown role: ${role}`);
  return (config.models[key] ?? config.models.executor) as ModelConfig;
}
