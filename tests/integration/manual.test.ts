import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { parseManualPrefix, manualRoute } from '../../src/engine/modes/manual.js';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import type { MrxConfig } from '../../src/types/index.js';

import { generate, stream } from '../../src/providers/adapter.js';

const mockGenerate = generate as jest.MockedFunction<typeof generate>;
const mockStream = stream as jest.MockedFunction<typeof stream>;

const ok = (text: string) => ({ text, toolCalls: [], toolResults: [] });

describe('parseManualPrefix', () => {
  it("parses '@reasoner analyze this' correctly", () => {
    const result = parseManualPrefix('@reasoner analyze this');
    expect(result.role).toBe('reasoner');
    expect(result.content).toBe('analyze this');
  });

  it("parses '@executor write code' correctly", () => {
    const result = parseManualPrefix('@executor write code');
    expect(result.role).toBe('executor');
    expect(result.content).toBe('write code');
  });

  it("parses '@tool_caller run this' correctly", () => {
    const result = parseManualPrefix('@tool_caller run this');
    expect(result.role).toBe('tool_caller');
    expect(result.content).toBe('run this');
  });

  it('returns role: null for messages without prefix', () => {
    const result = parseManualPrefix('no prefix message');
    expect(result.role).toBeNull();
    expect(result.content).toBe('no prefix message');
  });

  it('handles leading whitespace before prefix', () => {
    const result = parseManualPrefix('  @reasoner think about it');
    expect(result.role).toBe('reasoner');
    expect(result.content).toBe('think about it');
  });

  it('returns null role and warning for @role with no content', () => {
    const result = parseManualPrefix('@reasoner');
    expect(result.role).toBeNull();
    expect(result.warning).toMatch(/requires a message/);
  });

  it('returns null role and warning for unknown @role', () => {
    const result = parseManualPrefix('@supermodel do something');
    expect(result.role).toBeNull();
    expect(result.warning).toMatch(/Unknown role/);
  });

  it('returns null role and warning for double @@ prefix', () => {
    const result = parseManualPrefix('@@reasoner hello');
    expect(result.role).toBeNull();
    expect(result.warning).toMatch(/Invalid prefix/);
  });

  it('ignores only the first @role when message has no space after it', () => {
    const result = parseManualPrefix('@reasoner');
    expect(result.role).toBeNull();
  });
});

describe('manualRoute', () => {
  const config: MrxConfig = {
    ...DEFAULT_CONFIG,
    display: { show_reasoning: false, stream: false },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerate.mockResolvedValue(ok('Mock response.'));
  });

  it('routes @reasoner prefix to the reasoner model config', async () => {
    const result = await manualRoute('@reasoner deep analysis', [], config);

    expect(result.messagesProduced[0].modelRole).toBe('reasoner');
    expect(result.messagesProduced[0].model).toBe(config.models.reasoner.model);
  });

  it('routes @executor prefix to the executor model config', async () => {
    const result = await manualRoute('@executor write me code', [], config);

    expect(result.messagesProduced[0].modelRole).toBe('executor');
    expect(result.messagesProduced[0].model).toBe(config.models.executor.model);
  });

  it('defaults to executor when no prefix is given', async () => {
    const result = await manualRoute('plain message', [], config);

    expect(result.messagesProduced[0].modelRole).toBe('executor');
  });

  it('returns the response from generate in the finalResponse', async () => {
    mockGenerate.mockResolvedValueOnce(ok('Generated text here.'));
    const result = await manualRoute('hello', [], config);
    expect(result.finalResponse).toBe('Generated text here.');
  });

  it('uses stream when config.display.stream is true', async () => {
    const streamConfig: MrxConfig = {
      ...DEFAULT_CONFIG,
      display: { show_reasoning: false, stream: true },
    };
    mockStream.mockImplementationOnce(async (opts) => {
      opts.onChunk('Stream chunk.');
      opts.onFinish?.('Stream chunk.');
      return 'Stream chunk.';
    });

    const result = await manualRoute('stream me', [], streamConfig);
    expect(mockStream).toHaveBeenCalledTimes(1);
    expect(result.finalResponse).toBe('Stream chunk.');
  });

  it('defaults to executor when @unknown_role is used', async () => {
    const result = await manualRoute('@unknown_role do something', [], config);
    expect(result.messagesProduced[0].modelRole).toBe('executor');
  });

  it('wraps provider errors with a classified message', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('429 Too Many Requests'));
    await expect(manualRoute('hello', [], config)).rejects.toThrow(/Rate limited/);
  });
});
