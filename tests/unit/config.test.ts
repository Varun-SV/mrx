import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadConfig, expandPath } from '../../src/config/loader.js';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';

describe('loadConfig', () => {
  it('returns DEFAULT_CONFIG when no config file is found', () => {
    // Run in a temp dir where no config exists
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrx-test-'));
    const originalCwd = process.cwd();
    try {
      process.chdir(tmpDir);
      const config = loadConfig();
      expect(config.default_mode).toBe(DEFAULT_CONFIG.default_mode);
      expect(config.models.reasoner.provider).toBe(DEFAULT_CONFIG.models.reasoner.provider);
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('parses valid YAML config and passes Zod validation', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrx-test-'));
    const configPath = path.join(tmpDir, 'mrx.config.yaml');
    const yaml = `
default_mode: manual
session_memory: true
session_db_path: /tmp/test.db
models:
  reasoner:
    provider: openai
    model: gpt-4o
    temperature: 0.5
    maxTokens: 2048
  executor:
    provider: anthropic
    model: claude-3-haiku-20240307
    temperature: 0.7
    maxTokens: 4096
tools:
  shell: false
  file_system: true
  web_fetch: false
display:
  show_reasoning: true
  stream: false
`;
    fs.writeFileSync(configPath, yaml);
    try {
      const config = loadConfig(configPath);
      expect(config.default_mode).toBe('manual');
      expect(config.session_memory).toBe(true);
      expect(config.models.reasoner.provider).toBe('openai');
      expect(config.models.reasoner.model).toBe('gpt-4o');
      expect(config.display.show_reasoning).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('throws on invalid YAML with a descriptive error', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrx-test-'));
    const configPath = path.join(tmpDir, 'mrx.config.yaml');
    const yaml = `
default_mode: invalid_mode
session_memory: not_a_boolean
models:
  reasoner:
    provider: openai
    model: gpt-4o
  executor:
    provider: anthropic
    model: claude-3
tools:
  shell: false
  file_system: true
  web_fetch: false
display:
  show_reasoning: true
  stream: false
`;
    fs.writeFileSync(configPath, yaml);
    try {
      expect(() => loadConfig(configPath)).toThrow(/Invalid config/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('expands ~ in session_db_path to home directory', () => {
    const result = expandPath('~/.mrx/sessions.db');
    expect(result).toBe(path.join(os.homedir(), '.mrx', 'sessions.db'));
    expect(result).not.toContain('~');
  });

  it('does not expand paths that do not start with ~', () => {
    const result = expandPath('/absolute/path/file.db');
    expect(result).toBe('/absolute/path/file.db');
  });
});
