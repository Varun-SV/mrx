import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { thinkThenAnswer } from '../../src/engine/modes/thinkThenAnswer.js';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import type { MrxConfig, StreamChunk } from '../../src/types/index.js';

// The provider adapter is automatically mocked via moduleNameMapper in jest.config.ts
import { generate, stream } from '../../src/providers/adapter.js';

const mockGenerate = generate as jest.MockedFunction<typeof generate>;
const mockStream = stream as jest.MockedFunction<typeof stream>;

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
      .mockResolvedValueOnce('<thinking>Step 1: do X</thinking>\nConclusion: Y')
      .mockResolvedValueOnce('Final answer based on reasoning.');

    const result = await thinkThenAnswer('What is X?', [], config);

    expect(result.finalResponse).toBe('Final answer based on reasoning.');
    expect(result.reasoning).toBe('Step 1: do X');
  });

  it('extracts reasoning from <thinking> tags', async () => {
    mockGenerate
      .mockResolvedValueOnce(
        '<thinking>Deep thought about the problem</thinking>\nHere is my conclusion.',
      )
      .mockResolvedValueOnce('The answer is 42.');

    const result = await thinkThenAnswer('What is the answer?', [], config);

    expect(result.reasoning).toBe('Deep thought about the problem');
    expect(result.finalResponse).toBe('The answer is 42.');
  });

  it('falls back to full response if no <thinking> tags present', async () => {
    const rawResponse = 'Just a direct response without thinking tags.';
    mockGenerate.mockResolvedValueOnce(rawResponse).mockResolvedValueOnce('Executor response.');

    const result = await thinkThenAnswer('Simple question', [], config);

    expect(result.reasoning).toBe(rawResponse);
  });

  it('produces two messages: reasoning and response', async () => {
    mockGenerate
      .mockResolvedValueOnce('<thinking>Think</thinking>\nConclusion.')
      .mockResolvedValueOnce('Final response.');

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

    mockGenerate.mockResolvedValueOnce('<thinking>Think</thinking>\nConclusion.');
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
    mockGenerate.mockResolvedValue('response');
    const result = await thinkThenAnswer('Test?', [], config);
    expect(result.toolsInvoked).toEqual([]);
  });
});
