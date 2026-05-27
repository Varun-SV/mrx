// Jest manual mock for src/providers/adapter.ts
// In ESM mode, jest globals must be imported from @jest/globals
import { jest } from '@jest/globals';

// Typed as any to avoid TypeScript inference issues with jest.fn() generics in ESM mode
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generate: any = jest.fn();
generate.mockResolvedValue('Mock response from reasoner.');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stream: any = jest.fn();
stream.mockImplementation(
  async (opts: { onChunk: (chunk: string) => void; onFinish?: (fullText: string) => void }) => {
    opts.onChunk('Mock ');
    opts.onChunk('streamed ');
    opts.onChunk('response.');
    opts.onFinish?.('Mock streamed response.');
    return 'Mock streamed response.';
  },
);
