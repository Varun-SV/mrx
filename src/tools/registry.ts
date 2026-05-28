import type { ToolDefinition, MrxConfig } from '../types/index.js';
import { shellTool } from './shell.js';
import { fileReadTool, fileWriteTool, fileListTool } from './fileSystem.js';
import { webFetchTool } from './webFetch.js';

export function buildToolRegistry(config: MrxConfig['tools']): ToolDefinition[] {
  const tools: ToolDefinition[] = [];
  if (config.shell) tools.push(shellTool);
  if (config.file_system) tools.push(fileReadTool, fileWriteTool, fileListTool);
  if (config.web_fetch) tools.push(webFetchTool);
  return tools;
}
