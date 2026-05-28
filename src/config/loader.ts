import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'js-yaml';
import { DEFAULT_CONFIG } from './defaults.js';
import { MrxConfigSchema } from './schema.js';
import type { MrxConfig } from '../types/index.js';

export function expandPath(p: string): string {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

export function loadConfig(explicitPath?: string): MrxConfig {
  const candidates = [
    explicitPath,
    path.join(process.cwd(), 'mrx.config.yaml'),
    path.join(os.homedir(), '.mrx', 'mrx.config.yaml'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const resolved = expandPath(candidate);
    if (fs.existsSync(resolved)) {
      const raw = fs.readFileSync(resolved, 'utf-8');
      const parsed = yaml.load(raw);
      const result = MrxConfigSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(
          `Invalid config at ${resolved}:\n${result.error.errors
            .map((e) => `  ${e.path.join('.')}: ${e.message}`)
            .join('\n')}`,
        );
      }
      // Merge with defaults for any missing optional fields
      return {
        ...DEFAULT_CONFIG,
        ...result.data,
        session_db_path: expandPath(result.data.session_db_path ?? DEFAULT_CONFIG.session_db_path),
      };
    }
  }

  console.warn('[mrx] No config file found. Using defaults (Ollama + qwen3:8b).');
  return DEFAULT_CONFIG;
}
