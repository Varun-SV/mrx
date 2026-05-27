import { describe, it, expect } from '@jest/globals';
import { resolveModelForRole } from '../../src/engine/router.js';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import type { MrxConfig } from '../../src/types/index.js';

describe('resolveModelForRole', () => {
  it("returns config.models.reasoner for role 'reasoner'", () => {
    const model = resolveModelForRole('reasoner', DEFAULT_CONFIG);
    expect(model).toBe(DEFAULT_CONFIG.models.reasoner);
  });

  it("returns config.models.executor for role 'executor'", () => {
    const model = resolveModelForRole('executor', DEFAULT_CONFIG);
    expect(model).toBe(DEFAULT_CONFIG.models.executor);
  });

  it("falls back to executor when tool_caller is absent", () => {
    const config: MrxConfig = { ...DEFAULT_CONFIG }; // no tool_caller set
    const model = resolveModelForRole('tool_caller', config);
    expect(model).toBe(config.models.executor);
  });

  it("returns config.models.tool_caller when explicitly set", () => {
    const toolCallerConfig = {
      provider: 'openrouter' as const,
      model: 'google/gemini-flash-1.5',
      temperature: 0.2,
      maxTokens: 2048,
    };
    const config: MrxConfig = {
      ...DEFAULT_CONFIG,
      models: {
        ...DEFAULT_CONFIG.models,
        tool_caller: toolCallerConfig,
      },
    };
    const model = resolveModelForRole('tool_caller', config);
    expect(model).toBe(toolCallerConfig);
  });

  it('throws for unknown role', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => resolveModelForRole('unknown' as any, DEFAULT_CONFIG)).toThrow(/Unknown role/);
  });
});
