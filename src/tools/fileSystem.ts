import fs from 'node:fs';
import path from 'node:path';
import type { ToolDefinition } from '../types/index.js';

const MAX_READ_BYTES = 100 * 1024; // 100 KB

export const fileReadTool: ToolDefinition = {
  name: 'read_file',
  description:
    'Read the contents of a file at the given path. Returns the text content. Limited to 100 KB.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Absolute or relative path to the file' },
    },
    required: ['path'],
  },
  async execute(args) {
    const { path: filePath } = args as { path: string };
    try {
      const resolved = path.resolve(filePath);
      const stat = fs.statSync(resolved);
      if (stat.size > MAX_READ_BYTES) {
        return `ERROR: File is too large (${stat.size} bytes). Maximum is ${MAX_READ_BYTES} bytes.`;
      }
      return fs.readFileSync(resolved, 'utf-8');
    } catch (error: unknown) {
      const err = error as { message?: string };
      return `ERROR: ${err.message ?? String(error)}`;
    }
  },
};

export const fileWriteTool: ToolDefinition = {
  name: 'write_file',
  description:
    'Write content to a file at the given path. Creates intermediate directories as needed.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Absolute or relative path to the file' },
      content: { type: 'string', description: 'Content to write to the file' },
    },
    required: ['path', 'content'],
  },
  async execute(args) {
    const { path: filePath, content } = args as { path: string; content: string };
    try {
      const resolved = path.resolve(filePath);
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, content, 'utf-8');
      return `Successfully wrote ${content.length} characters to ${resolved}`;
    } catch (error: unknown) {
      const err = error as { message?: string };
      return `ERROR: ${err.message ?? String(error)}`;
    }
  },
};

export const fileListTool: ToolDefinition = {
  name: 'list_directory',
  description:
    'List files and directories at a given path. Returns a newline-separated list of relative paths.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Absolute or relative path to the directory' },
      recursive: {
        type: 'boolean',
        description: 'Whether to list recursively (default: false)',
      },
    },
    required: ['path'],
  },
  async execute(args) {
    const { path: dirPath, recursive = false } = args as {
      path: string;
      recursive?: boolean;
    };
    try {
      const resolved = path.resolve(dirPath);

      const listEntries = (dir: string, base: string): string[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const results: string[] = [];
        for (const entry of entries) {
          const rel = path.join(base, entry.name);
          results.push(rel);
          if (recursive && entry.isDirectory()) {
            results.push(...listEntries(path.join(dir, entry.name), rel));
          }
        }
        return results;
      };

      const entries = listEntries(resolved, '');
      return entries.join('\n') || '(empty directory)';
    } catch (error: unknown) {
      const err = error as { message?: string };
      return `ERROR: ${err.message ?? String(error)}`;
    }
  },
};
