import fetch from 'node-fetch';
import type { ToolDefinition } from '../types/index.js';

const MAX_RESPONSE_BYTES = 50 * 1024; // 50 KB

export const webFetchTool: ToolDefinition = {
  name: 'web_fetch',
  description:
    'Fetch the content of a URL and return it as plain text. Optionally extract text matching a CSS selector pattern.',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'The URL to fetch' },
      selector: {
        type: 'string',
        description: 'Optional CSS selector pattern for basic text extraction',
      },
    },
    required: ['url'],
  },
  async execute(args) {
    const { url, selector } = args as { url: string; selector?: string };
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'mrx-cli/0.1.0' },
      });

      if (!response.ok) {
        return `ERROR: HTTP ${response.status} ${response.statusText}`;
      }

      const buffer = await response.buffer();
      const truncated =
        buffer.length > MAX_RESPONSE_BYTES ? buffer.slice(0, MAX_RESPONSE_BYTES) : buffer;
      let content = truncated.toString('utf-8');

      if (selector) {
        // Simple heuristic: extract text content from tags
        const matches = content.match(/<[^>]+>([^<]+)<\/[^>]+>/g);
        if (matches) {
          content = matches
            .map((m) => m.replace(/<[^>]+>/g, '').trim())
            .filter(Boolean)
            .join('\n');
        }
      }

      return content;
    } catch (error: unknown) {
      const err = error as { message?: string };
      return `ERROR: ${err.message ?? String(error)}`;
    }
  },
};
