import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { plannerExecutor } from '../../src/engine/modes/plannerExecutor.js';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import type { MrxConfig } from '../../src/types/index.js';

import { generate } from '../../src/providers/adapter.js';

const mockGenerate = generate as jest.MockedFunction<typeof generate>;

describe('plannerExecutor', () => {
  const config: MrxConfig = {
    ...DEFAULT_CONFIG,
    display: { show_reasoning: false, stream: false },
    tools: { shell: false, file_system: false, web_fetch: false },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls reasoner for plan and executor for each step plus synthesis', async () => {
    // First call: planner response
    mockGenerate
      .mockResolvedValueOnce('1. Step one\n2. Step two')
      // Step 1 execution
      .mockResolvedValueOnce('Result of step one.')
      // Step 2 execution
      .mockResolvedValueOnce('Result of step two.')
      // Synthesis
      .mockResolvedValueOnce('Final synthesized answer.');

    const result = await plannerExecutor('Do something complex', [], config);

    // 4 calls total: 1 planner + 2 steps + 1 synthesis
    expect(mockGenerate).toHaveBeenCalledTimes(4);
    expect(result.finalResponse).toBe('Final synthesized answer.');
  });

  it('reasoning contains the plan text', async () => {
    mockGenerate
      .mockResolvedValueOnce('1. Step one\n2. Step two')
      .mockResolvedValueOnce('Result one.')
      .mockResolvedValueOnce('Result two.')
      .mockResolvedValueOnce('Synthesis.');

    const result = await plannerExecutor('Plan something', [], config);

    expect(result.reasoning).toContain('Step one');
    expect(result.reasoning).toContain('Step two');
  });

  it('toolsInvoked is empty when no tools trigger', async () => {
    mockGenerate
      .mockResolvedValueOnce('1. Single step')
      .mockResolvedValueOnce('Step result.')
      .mockResolvedValueOnce('Synthesis.');

    const result = await plannerExecutor('Simple task', [], config);

    expect(result.toolsInvoked).toEqual([]);
  });

  it('produces messages for plan, each step, and synthesis', async () => {
    mockGenerate
      .mockResolvedValueOnce('1. Step one\n2. Step two')
      .mockResolvedValueOnce('Result one.')
      .mockResolvedValueOnce('Result two.')
      .mockResolvedValueOnce('Final answer.');

    const result = await plannerExecutor('Two steps', [], config);

    // Plan + step1 + step2 + synthesis = 4 messages
    expect(result.messagesProduced).toHaveLength(4);
    expect(result.messagesProduced[0].isReasoning).toBe(true);
    expect(result.messagesProduced[0].modelRole).toBe('reasoner');
  });

  it('handles single-step plans correctly', async () => {
    mockGenerate
      .mockResolvedValueOnce('1. Only one step')
      .mockResolvedValueOnce('Step result.')
      .mockResolvedValueOnce('Synthesis.');

    const result = await plannerExecutor('One step', [], config);
    expect(result.finalResponse).toBe('Synthesis.');
    expect(mockGenerate).toHaveBeenCalledTimes(3);
  });
});
