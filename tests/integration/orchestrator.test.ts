import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { orchestrate } from '../../src/engine/orchestrator.js';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import type { MrxConfig } from '../../src/types/index.js';

import { generate, stream } from '../../src/providers/adapter.js';

const mockGenerate = generate as jest.MockedFunction<typeof generate>;
const mockStream = stream as jest.MockedFunction<typeof stream>;

const ok = (text: string) => ({ text, toolCalls: [], toolResults: [] });

describe('orchestrate()', () => {
  const config: MrxConfig = {
    ...DEFAULT_CONFIG,
    display: { show_reasoning: false, stream: false },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerate.mockResolvedValue({ text: 'mock response', toolCalls: [], toolResults: [] });
  });

  it("dispatches 'think_then_answer' mode", async () => {
    mockGenerate
      .mockResolvedValueOnce(ok('<thinking>thought</thinking>\nConclusion.'))
      .mockResolvedValueOnce(ok('Final answer.'));

    const result = await orchestrate('test', [], config, 'think_then_answer');
    expect(result.finalResponse).toBe('Final answer.');
    expect(result.reasoning).toBe('thought');
  });

  it("dispatches 'planner_executor' mode", async () => {
    mockGenerate
      .mockResolvedValueOnce(ok('1. Step one'))
      .mockResolvedValueOnce(ok('Result.'))
      .mockResolvedValueOnce(ok('Synthesis.'));

    const result = await orchestrate('test', [], config, 'planner_executor');
    expect(result.finalResponse).toBe('Synthesis.');
  });

  it("dispatches 'manual' mode", async () => {
    mockGenerate.mockResolvedValueOnce(ok('Manual response.'));
    const result = await orchestrate('@executor write code', [], config, 'manual');
    expect(result.finalResponse).toBe('Manual response.');
  });

  it('throws for unknown mode', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(orchestrate('test', [], config, 'unknown_mode' as any)).rejects.toThrow(
      /Unknown interaction mode/,
    );
  });

  it('passes onStream callback through to mode handler', async () => {
    const streamConfig: MrxConfig = {
      ...DEFAULT_CONFIG,
      display: { show_reasoning: false, stream: true },
    };
    mockGenerate.mockResolvedValueOnce(ok('<thinking>t</thinking>\nC.'));
    mockStream.mockImplementationOnce(async (opts) => {
      opts.onChunk('streamed');
      return 'streamed';
    });

    const chunks: string[] = [];
    await orchestrate('test', [], streamConfig, 'think_then_answer', (chunk) => {
      if (chunk.type === 'response') chunks.push(chunk.content);
    });
    expect(chunks).toContain('streamed');
  });

  it('propagates a classified error when the reasoner throws', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(orchestrate('test', [], config, 'think_then_answer')).rejects.toThrow(
      /Network error/,
    );
  });

  it('propagates an auth error with a clear message', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('401 Unauthorized'));
    await expect(orchestrate('test', [], config, 'manual')).rejects.toThrow(
      /Authentication failed/,
    );
  });
});
