import type { Role, MrxConfig, ModelConfig } from '../types/index.js';

export function resolveModelForRole(role: Role, config: MrxConfig): ModelConfig {
  switch (role) {
    case 'reasoner':
      return config.models.reasoner;
    case 'executor':
      return config.models.executor;
    case 'tool_caller':
      return config.models.tool_caller ?? config.models.executor;
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}
