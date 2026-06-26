import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { thinkThenAnswer } from '../../src/engine/modes/thinkThenAnswer.js';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import type { MrxConfig, StreamChunk } from '../../src/types/index.js';

import { generate, stream } from '../../src/providers/adapter.js';

const mockGenerate = generate as jest.MockedFunction<typeof generate>;
const mockStream = stream as jest.MockedFunction<typeof stream>;

const ok = (text: string) => ({ text, toolCalls: [], toolResults: [] });

describe('thinkThenAnswer', () => {
  const config: MrxConfig = {
    ...DEFAULT_CONFIG,
    display: { show_reasoning: true, stream: false },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('produces OrchestrationResult with finalResponse and reasoning', async () => {
    mockGenerate
      .mockResolvedValueOnce(ok('<thinking>Step 1: do X</thinking>\nConclusion: Y'))
      .mockResolvedValueOnce(ok('Final answer based on reasoning.'));

    const result = await thinkThenAnswer('What is X?', [], config);

    expect(result.finalResponse).toBe('Final answer based on reasoning.');
    expect(result.reasoning).toBe('Step 1: do X');
  });

  it('extracts reasoning from <thinking> tags', async () => {
    mockGenerate
      .mockResolvedValueOnce(ok('<thinking>Deep thought about the problem</thinking>\nHere is my conclusion.'))
      .mockResolvedValueOnce(ok('The answer is 42.'));

    const result = await thinkThenAnswer('What is the answer?', [], config);

    expect(result.reasoning).toBe('Deep thought about the problem');
    expect(result.finalResponse).toBe('The answer is 42.');
  });

  it('falls back to full response if no <thinking> tags present', async () => {
    const rawResponse = 'Just a direct response without thinking tags.';
    mockGenerate.mockResolvedValueOnce(ok(rawResponse)).mockResolvedValueOnce(ok('Executor response.'));

    const result = await thinkThenAnswer('Simple question', [], config);

    expect(result.reasoning).toBe(rawResponse);
  });

  it('produces two messages: reasoning and response', async () => {
    mockGenerate
      .mockResolvedValueOnce(ok('<thinking>Think</thinking>\nConclusion.'))
      .mockResolvedValueOnce(ok('Final response.'));

    const result = await thinkThenAnswer('Test?', [], config);

    expect(result.messagesProduced).toHaveLength(2);
    expect(result.messagesProduced[0].isReasoning).toBe(true);
    expect(result.messagesProduced[0].modelRole).toBe('reasoner');
    expect(result.messagesProduced[1].isReasoning).toBeFalsy();
    expect(result.messagesProduced[1].modelRole).toBe('executor');
  });

  it('uses stream when config.display.stream is true', async () => {
    const streamingConfig: MrxConfig = {
      ...DEFAULT_CONFIG,
      display: { show_reasoning: false, stream: true },
    };

    mockGenerate.mockResolvedValueOnce(ok('<thinking>Think</thinking>\nConclusion.'));
    mockStream.mockImplementationOnce(async (opts) => {
      opts.onChunk('Streamed ');
      opts.onChunk('answer.');
      opts.onFinish?.('Streamed answer.');
      return 'Streamed answer.';
    });

    const chunks: StreamChunk[] = [];
    const result = await thinkThenAnswer('Test?', [], streamingConfig, (chunk) =>
      chunks.push(chunk),
    );

    expect(mockStream).toHaveBeenCalledTimes(1);
    expect(result.finalResponse).toBe('Streamed answer.');
    expect(chunks.some((c) => c.type === 'response')).toBe(true);
  });

  it('includes no toolsInvoked', async () => {
    mockGenerate.mockResolvedValue(ok('response'));
    const result = await thinkThenAnswer('Test?', [], config);
    expect(result.toolsInvoked).toEqual([]);
  });

  it('handles empty streaming chunks without error', async () => {
    const streamingConfig: MrxConfig = {
      ...DEFAULT_CONFIG,
      display: { show_reasoning: false, stream: true },
    };

    mockGenerate.mockResolvedValueOnce(ok('<thinking>T</thinking>\nC.'));
    mockStream.mockImplementationOnce(async (opts) => {
      opts.onChunk('');
      opts.onChunk('');
      opts.onChunk('hello');
      opts.onChunk('');
      opts.onFinish?.('hello');
      return 'hello';
    });

    const result = await thinkThenAnswer('Test?', [], streamingConfig, () => {});
    expect(result.finalResponse).toBe('hello');
  });

  it('wraps reasoner failures with a classified error message', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('ECONNREFUSED connect to ollama'));
    await expect(thinkThenAnswer('test', [], config)).rejects.toThrow(/\[reasoner\].*Network error/);
  });

  it('wraps executor failures with a classified error message', async () => {
    mockGenerate
      .mockResolvedValueOnce(ok('<thinking>T</thinking>\nC.'))
      .mockRejectedValueOnce(new Error('429 rate limit exceeded'));
    await expect(thinkThenAnswer('test', [], config)).rejects.toThrow(/Rate limited/);
  });
});
