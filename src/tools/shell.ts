import { execa } from 'execa';
import type { ToolDefinition } from '../types/index.js';

export const shellTool: ToolDefinition = {
  name: 'run_shell',
  description:
    "Execute a shell command on the user's machine. Use for running scripts, build commands, git operations, etc. Always prefer safe read operations when possible.",
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'The shell command to execute' },
      cwd: { type: 'string', description: 'Working directory (defaults to cwd)' },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 30000)',
      },
    },
    required: ['command'],
  },
  async execute(args) {
    const {
      command,
      cwd,
      timeout = 30000,
    } = args as {
      command: string;
      cwd?: string;
      timeout?: number;
    };
    try {
      const result = await execa('bash', ['-c', command], {
        cwd: cwd ?? process.cwd(),
        timeout,
        all: true,
      });
      return result.all ?? result.stdout ?? '';
    } catch (error: unknown) {
      const err = error as { all?: string; message?: string };
      return `ERROR: ${err.all ?? err.message ?? String(error)}`;
    }
  },
};
