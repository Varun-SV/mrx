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

export function parseManualPrefix(message: string): { role: Role | null; content: string } {
  for (const role of ['reasoner', 'executor', 'tool_caller'] as Role[]) {
    const prefix = `@${role}`;
    if (message.trimStart().startsWith(prefix)) {
      return { role, content: message.trimStart().slice(prefix.length).trim() };
    }
  }
  return { role: null, content: message };
}

const DEFAULT_SYSTEM = `You are a helpful assistant. You can prefix your messages with @reasoner for deep analysis, @executor for direct responses, or @tool_caller for tool-focused tasks.`;

export async function manualRoute(
  userMessage: string,
  history: Message[],
  config: MrxConfig,
  onStream?: (chunk: StreamChunk) => void,
): Promise<OrchestrationResult> {
  const { role, content } = parseManualPrefix(userMessage);
  const effectiveRole: Role = role ?? 'executor';
  const modelConfig = resolveModelForRole(effectiveRole, config);

  const messages: CoreMessage[] = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content },
  ];

  let finalResponse = '';
  if (config.display.stream && onStream) {
    finalResponse = await stream({
      modelConfig,
      messages,
      system: DEFAULT_SYSTEM,
      onChunk: (chunk) =>
        onStream({
          type: 'response',
          content: chunk,
          role: effectiveRole,
          model: modelConfig.model,
        }),
      onFinish: () => onStream({ type: 'done', content: '' }),
    });
  } else {
    finalResponse = await generate({
      modelConfig,
      messages,
      system: DEFAULT_SYSTEM,
    });
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
