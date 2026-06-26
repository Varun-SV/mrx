import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ── ESM mocks must be declared before any dynamic imports ─────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockExecaFn: any = jest.fn();
jest.unstable_mockModule('execa', () => ({ execa: mockExecaFn }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetchFn: any = jest.fn();
jest.unstable_mockModule('node-fetch', () => ({ default: mockFetchFn }));

// ── Dynamic imports (loads mocked versions) ───────────────────────────────────

const { shellTool } = await import('../../src/tools/shell.js');
const { fileReadTool, fileWriteTool, fileListTool } = await import('../../src/tools/fileSystem.js');
const { webFetchTool } = await import('../../src/tools/webFetch.js');
const { buildToolRegistry } = await import('../../src/tools/registry.js');

// ─────────────────────────────────────────────────────────────────────────────

describe('shellTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns stdout for a successful command', async () => {
    mockExecaFn.mockResolvedValueOnce({ all: 'hello', stdout: 'hello', stderr: '' });
    const result = await shellTool.execute({ command: 'echo hello' });
    expect(result).toBe('hello');
  });

  it('returns stdout when all is undefined', async () => {
    mockExecaFn.mockResolvedValueOnce({ all: undefined, stdout: 'from-stdout', stderr: '' });
    const result = await shellTool.execute({ command: 'echo hello' });
    expect(result).toBe('from-stdout');
  });

  it('returns an error string on failure (does not throw)', async () => {
    mockExecaFn.mockRejectedValueOnce(
      Object.assign(new Error('Command failed'), { all: 'bash: badcmd: not found' }),
    );
    const result = await shellTool.execute({ command: 'badcmd' });
    expect(result).toMatch(/ERROR:/);
  });

  it('returns error.message when all is undefined on failure', async () => {
    mockExecaFn.mockRejectedValueOnce(new Error('timeout exceeded'));
    const result = await shellTool.execute({ command: 'sleep 100' });
    expect(result).toContain('timeout exceeded');
  });

  it('handles non-Error thrown values safely', async () => {
    mockExecaFn.mockRejectedValueOnce('plain string error');
    const result = await shellTool.execute({ command: 'bad' });
    expect(result).toMatch(/ERROR:/);
    expect(result).toContain('plain string error');
  });
});

describe('fileReadTool', () => {
  it('returns an error string for a non-existent file (does not throw)', async () => {
    const result = await fileReadTool.execute({ path: '/nonexistent/path/file.txt' });
    expect(result).toMatch(/ERROR:/);
  });

  it('reads an existing file successfully', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrx-tools-'));
    const tmpFile = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(tmpFile, 'hello world');
    try {
      const result = await fileReadTool.execute({ path: tmpFile });
      expect(result).toBe('hello world');
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('returns error string when file is too large', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrx-tools-'));
    const bigFile = path.join(tmpDir, 'big.txt');
    // Write just over 100 KB
    fs.writeFileSync(bigFile, Buffer.alloc(102400 + 1, 'x'));
    try {
      const result = await fileReadTool.execute({ path: bigFile });
      expect(result).toMatch(/ERROR.*too large/i);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});

describe('fileWriteTool', () => {
  it('creates parent directories and writes content', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrx-tools-'));
    const nested = path.join(tmpDir, 'a', 'b', 'c', 'file.txt');
    try {
      const result = await fileWriteTool.execute({ path: nested, content: 'test content' });
      expect(result).toMatch(/Successfully wrote/);
      expect(fs.existsSync(nested)).toBe(true);
      expect(fs.readFileSync(nested, 'utf-8')).toBe('test content');
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});

describe('fileListTool', () => {
  it('lists entries in a directory (non-recursive)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrx-list-'));
    fs.writeFileSync(path.join(tmpDir, 'file1.txt'), '');
    fs.writeFileSync(path.join(tmpDir, 'file2.txt'), '');
    fs.mkdirSync(path.join(tmpDir, 'subdir'));
    try {
      const result = await fileListTool.execute({ path: tmpDir });
      expect(result).toContain('file1.txt');
      expect(result).toContain('file2.txt');
      expect(result).toContain('subdir');
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('lists entries recursively when recursive: true', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrx-list-'));
    const sub = path.join(tmpDir, 'subdir');
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(sub, 'nested.txt'), '');
    try {
      const result = await fileListTool.execute({ path: tmpDir, recursive: true });
      expect(result).toContain('nested.txt');
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('returns error string for non-existent directory', async () => {
    const result = await fileListTool.execute({ path: '/no/such/dir' });
    expect(result).toMatch(/ERROR:/);
  });

  it('returns (empty directory) for an empty dir', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrx-empty-'));
    try {
      const result = await fileListTool.execute({ path: tmpDir });
      expect(result).toBe('(empty directory)');
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});

describe('webFetchTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns body text from a successful fetch', async () => {
    const mockBuffer = Buffer.from('<html><body>Hello web</body></html>');
    mockFetchFn.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      buffer: async () => mockBuffer,
    });

    const result = await webFetchTool.execute({ url: 'https://example.com' });
    expect(result).toContain('Hello web');
  });

  it('returns an error string on HTTP failure (does not throw)', async () => {
    mockFetchFn.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const result = await webFetchTool.execute({ url: 'https://example.com/404' });
    expect(result).toMatch(/ERROR:/);
  });

  it('extracts text when selector is provided', async () => {
    const html = '<html><body><p>Extracted text</p><span>More text</span></body></html>';
    const mockBuffer = Buffer.from(html);
    mockFetchFn.mockResolvedValueOnce({
      ok: true,
      buffer: async () => mockBuffer,
    });

    const result = await webFetchTool.execute({ url: 'https://example.com', selector: 'p' });
    expect(result).toContain('Extracted text');
  });

  it('returns error string on network failure', async () => {
    mockFetchFn.mockRejectedValueOnce(new Error('network timeout'));
    const result = await webFetchTool.execute({ url: 'https://bad.example.com' });
    expect(result).toMatch(/ERROR:/);
  });

  it('strips script and style tags from HTML', async () => {
    const html =
      '<html><head><style>body { color: red; }</style></head><body><script>alert(1)</script><p>Clean text</p></body></html>';
    const mockBuffer = Buffer.from(html);
    mockFetchFn.mockResolvedValueOnce({ ok: true, buffer: async () => mockBuffer });

    const result = await webFetchTool.execute({ url: 'https://example.com' });
    expect(result).toContain('Clean text');
    expect(result).not.toContain('color: red');
    expect(result).not.toContain('alert(1)');
  });

  it('handles a non-Error thrown value safely', async () => {
    mockFetchFn.mockRejectedValueOnce('plain string error');
    const result = await webFetchTool.execute({ url: 'https://example.com' });
    expect(result).toMatch(/ERROR:/);
    expect(result).toContain('plain string error');
  });

  it('decodes HTML entities in extracted text', async () => {
    const html = '<p>A &amp; B &lt;C&gt; &quot;D&quot;</p>';
    const mockBuffer = Buffer.from(html);
    mockFetchFn.mockResolvedValueOnce({ ok: true, buffer: async () => mockBuffer });

    const result = await webFetchTool.execute({ url: 'https://example.com', selector: 'p' });
    expect(result).toContain('A & B <C> "D"');
  });
});

describe('buildToolRegistry', () => {
  it('returns empty array when all tools disabled', async () => {
    const tools = buildToolRegistry({ shell: false, file_system: false, web_fetch: false });
    expect(tools).toHaveLength(0);
  });

  it('includes shellTool when shell: true', async () => {
    const tools = buildToolRegistry({ shell: true, file_system: false, web_fetch: false });
    expect(tools.some((t) => t.name === 'run_shell')).toBe(true);
  });

  it('includes 3 file system tools when file_system: true', async () => {
    const tools = buildToolRegistry({ shell: false, file_system: true, web_fetch: false });
    expect(
      tools.filter((t) => ['read_file', 'write_file', 'list_directory'].includes(t.name)),
    ).toHaveLength(3);
  });

  it('includes webFetchTool when web_fetch: true', async () => {
    const tools = buildToolRegistry({ shell: false, file_system: false, web_fetch: true });
    expect(tools.some((t) => t.name === 'web_fetch')).toBe(true);
  });
});
