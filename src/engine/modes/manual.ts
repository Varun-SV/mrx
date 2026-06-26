import { generate, stream } from '../../providers/adapter.js';
import { resolveModelForRole } from '../router.js';
import type {
  Role,
  MrxConfig,
  Message,
  OrchestrationResult,
  StreamChunk,
} from '../../types/index.js';
import type { CoreMessage } from 'ai';

const KNOWN_ROLES: Role[] = ['reasoner', 'executor', 'tool_caller'];

export function parseManualPrefix(message: string): {
  role: Role | null;
  content: string;
  warning?: string;
} {
  const trimmed = message.trimStart();

  // Reject double-prefix like @@reasoner
  if (trimmed.startsWith('@@')) {
    return {
      role: null,
      content: message,
      warning: 'Invalid prefix "@@" — use @reasoner, @executor, or @tool_caller.',
    };
  }

  if (!trimmed.startsWith('@')) {
    return { role: null, content: message };
  }

  // Extract the token after @
  const spaceIdx = trimmed.indexOf(' ');
  const token = spaceIdx === -1 ? trimmed.slice(1) : trimmed.slice(1, spaceIdx);
  const content = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1).trim();

  if (KNOWN_ROLES.includes(token as Role)) {
    // Content is required — a bare @role with no message is a no-op
    if (!content) {
      return {
        role: null,
        content: message,
        warning: `Prefix @${token} requires a message after it.`,
      };
    }
    return { role: token as Role, content };
  }

  // Unknown role — warn and fall through to default
  return {
    role: null,
    content: trimmed.slice(1 + token.length).trim() || message,
    warning: `Unknown role "@${token}". Use @reasoner, @executor, or @tool_caller.`,
  };
}

const DEFAULT_SYSTEM = `You are a helpful assistant. You can prefix your messages with @reasoner for deep analysis, @executor for direct responses, or @tool_caller for tool-focused tasks.`;

function classifyError(error: unknown, role: string): Error {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes('401') ||
    msg.toLowerCase().includes('authentication') ||
    msg.toLowerCase().includes('api key')
  ) {
    return new Error(`[${role}] Authentication failed — check your API key. ${msg}`);
  }
  if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
    return new Error(`[${role}] Rate limited by provider. ${msg}`);
  }
  if (msg.includes('timeout') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
    return new Error(`[${role}] Network error — is the provider reachable? ${msg}`);
  }
  return new Error(`[${role}] ${msg}`);
}

export async function manualRoute(
  userMessage: string,
  history: Message[],
  config: MrxConfig,
  onStream?: (chunk: StreamChunk) => void,
): Promise<OrchestrationResult> {
  const { role, content, warning } = parseManualPrefix(userMessage);

  if (warning) {
    console.warn(`[mrx] ${warning}`);
  }

  const effectiveRole: Role = role ?? 'executor';
  const modelConfig = resolveModelForRole(effectiveRole, config);

  const messages: CoreMessage[] = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content },
  ];

  let finalResponse = '';
  try {
    if (config.display.stream) {
      finalResponse = await stream({
        modelConfig,
        messages,
        system: DEFAULT_SYSTEM,
        onChunk: (chunk) =>
          onStream?.({
            type: 'response',
            content: chunk,
            role: effectiveRole,
            model: modelConfig.model,
          }),
        onFinish: () => onStream?.({ type: 'done', content: '' }),
      });
    } else {
      const result = await generate({ modelConfig, messages, system: DEFAULT_SYSTEM });
      finalResponse = result.text;
    }
  } catch (error: unknown) {
    throw classifyError(error, effectiveRole);
  }

  return {
    finalResponse,
    toolsInvoked: [],
    messagesProduced: [
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: finalResponse,
        modelRole: effectiveRole,
        timestamp: Date.now(),
        model: modelConfig.model,
      },
    ],
  };
}
