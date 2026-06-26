import fetch from 'node-fetch';
import type { ToolDefinition } from '../types/index.js';

const MAX_RESPONSE_BYTES = 50 * 1024; // 50 KB

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

/**
 * Strip HTML to readable plain text:
 * 1. Remove <script> and <style> blocks entirely (content + tags)
 * 2. Replace block-level tags with newlines
 * 3. Strip remaining tags
 * 4. Decode common HTML entities
 * 5. Collapse whitespace
 */
function htmlToText(html: string): string {
  let text = html;

  // Remove script/style blocks
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Block-level tags → newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|pre)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

  // Collapse whitespace
  text = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line, i, arr) => line || (arr[i - 1] !== ''))
    .join('\n')
    .trim();

  return text;
}

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
      const rawHtml = truncated.toString('utf-8');

      if (selector) {
        // Extract text from elements whose opening tag contains the selector token
        // (supports simple tag names like "p", "h1", class-like "article", etc.)
        const tagPattern = new RegExp(
          `<(${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})[^>]*>([\\s\\S]*?)<\\/\\1>`,
          'gi',
        );
        const matches: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = tagPattern.exec(rawHtml)) !== null) {
          const inner = htmlToText(match[2]);
          if (inner) matches.push(inner);
        }
        return matches.length > 0 ? matches.join('\n\n') : htmlToText(rawHtml);
      }

      return htmlToText(rawHtml);
    } catch (error: unknown) {
      return `ERROR: ${errorMessage(error)}`;
    }
  },
};
