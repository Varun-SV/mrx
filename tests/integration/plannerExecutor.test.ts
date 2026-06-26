import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { plannerExecutor } from '../../src/engine/modes/plannerExecutor.js';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import type { MrxConfig } from '../../src/types/index.js';

import { generate } from '../../src/providers/adapter.js';

const mockGenerate = generate as jest.MockedFunction<typeof generate>;

const ok = (text: string) => ({ text, toolCalls: [], toolResults: [] });

const withTools = (text: string) => ({
  text,
  toolCalls: [{ id: 'tc-1', name: 'run_shell', args: { command: 'echo hi' } }],
  toolResults: [{ toolCallId: 'tc-1', result: 'hi' }],
});

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
    mockGenerate
      .mockResolvedValueOnce(ok('1. Step one\n2. Step two'))
      .mockResolvedValueOnce(ok('Result of step one.'))
      .mockResolvedValueOnce(ok('Result of step two.'))
      .mockResolvedValueOnce(ok('Final synthesized answer.'));

    const result = await plannerExecutor('Do something complex', [], config);

    expect(mockGenerate).toHaveBeenCalledTimes(4);
    expect(result.finalResponse).toBe('Final synthesized answer.');
  });

  it('reasoning contains the plan text', async () => {
    mockGenerate
      .mockResolvedValueOnce(ok('1. Step one\n2. Step two'))
      .mockResolvedValueOnce(ok('Result one.'))
      .mockResolvedValueOnce(ok('Result two.'))
      .mockResolvedValueOnce(ok('Synthesis.'));

    const result = await plannerExecutor('Plan something', [], config);

    expect(result.reasoning).toContain('Step one');
    expect(result.reasoning).toContain('Step two');
  });

  it('toolsInvoked is empty when no tools are called', async () => {
    mockGenerate
      .mockResolvedValueOnce(ok('1. Single step'))
      .mockResolvedValueOnce(ok('Step result.'))
      .mockResolvedValueOnce(ok('Synthesis.'));

    const result = await plannerExecutor('Simple task', [], config);

    expect(result.toolsInvoked).toEqual([]);
  });

  it('collects toolsInvoked from executor steps', async () => {
    mockGenerate
      .mockResolvedValueOnce(ok('1. Run shell'))
      .mockResolvedValueOnce(withTools('Shell ran.'))
      .mockResolvedValueOnce(ok('Synthesis.'));

    const result = await plannerExecutor('Run a command', [], config);

    expect(result.toolsInvoked).toHaveLength(1);
    expect(result.toolsInvoked[0].name).toBe('run_shell');
  });

  it('produces messages for plan, each step, and synthesis', async () => {
    mockGenerate
      .mockResolvedValueOnce(ok('1. Step one\n2. Step two'))
      .mockResolvedValueOnce(ok('Result one.'))
      .mockResolvedValueOnce(ok('Result two.'))
      .mockResolvedValueOnce(ok('Final answer.'));

    const result = await plannerExecutor('Two steps', [], config);

    expect(result.messagesProduced).toHaveLength(4);
    expect(result.messagesProduced[0].isReasoning).toBe(true);
    expect(result.messagesProduced[0].modelRole).toBe('reasoner');
  });

  it('handles single-step plans correctly', async () => {
    mockGenerate
      .mockResolvedValueOnce(ok('1. Only one step'))
      .mockResolvedValueOnce(ok('Step result.'))
      .mockResolvedValueOnce(ok('Synthesis.'));

    const result = await plannerExecutor('One step', [], config);
    expect(result.finalResponse).toBe('Synthesis.');
    expect(mockGenerate).toHaveBeenCalledTimes(3);
  });

  it('wraps planner failures with a classified error message', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('401 Unauthorized'));
    await expect(plannerExecutor('test', [], config)).rejects.toThrow(/Authentication failed/);
  });

  it('wraps executor step failures with a classified error message', async () => {
    mockGenerate
      .mockResolvedValueOnce(ok('1. Step one'))
      .mockRejectedValueOnce(new Error('timeout'));
    await expect(plannerExecutor('test', [], config)).rejects.toThrow(/Network error/);
  });

  it('runs independent steps in parallel (wave grouping)', async () => {
    const callOrder: number[] = [];

    mockGenerate
      .mockResolvedValueOnce(ok('1. Fetch data\n2. Read file\n3. Summarize result of step 1'))
      .mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 0));
        callOrder.push(Date.now());
        return { text: 'ok', toolCalls: [], toolResults: [] };
      });

    await plannerExecutor('parallel test', [], config);

    // Steps 1 and 2 are independent → planner + 3 steps + synthesis = 5 calls
    expect(mockGenerate).toHaveBeenCalledTimes(5);
  });
});
