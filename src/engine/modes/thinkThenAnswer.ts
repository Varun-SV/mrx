import { generate, stream } from '../../providers/adapter.js';
import { resolveModelForRole } from '../router.js';
import type { MrxConfig, Message, OrchestrationResult, StreamChunk } from '../../types/index.js';
import type { CoreMessage } from 'ai';

const REASONER_SYSTEM = `You are a deep reasoning engine. When given a user query, you must:
1. Think through the problem carefully inside <thinking>...</thinking> tags.
2. After the thinking block, write a one-paragraph conclusion summarizing your answer.
Do not produce any conversational text outside these two elements.`;

const EXECUTOR_SYSTEM = `You are a helpful, concise assistant. You have been provided with
pre-computed reasoning about the user's query. Use it to produce the best possible response.
Do not mention the reasoning process. Just respond naturally and helpfully.`;

function classifyError(error: unknown, role: string): Error {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('401') || msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('api key')) {
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

export async function thinkThenAnswer(
  userMessage: string,
  history: Message[],
  config: MrxConfig,
  onStream?: (chunk: StreamChunk) => void,
): Promise<OrchestrationResult> {
  const reasonerModel = resolveModelForRole('reasoner', config);
  const executorModel = resolveModelForRole('executor', config);

  const reasonerMessages: CoreMessage[] = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ];

  let rawReasoning: string;
  try {
    const result = await generate({ modelConfig: reasonerModel, messages: reasonerMessages, system: REASONER_SYSTEM });
    rawReasoning = result.text;
  } catch (error: unknown) {
    throw classifyError(error, 'reasoner');
  }

  const thinkingMatch = rawReasoning.match(/<thinking>([\s\S]*?)<\/thinking>/);
  const reasoning = thinkingMatch?.[1]?.trim() ?? rawReasoning;
  const conclusion = rawReasoning.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();

  const executorMessages: CoreMessage[] = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
    { role: 'assistant', content: `[Reasoning context: ${conclusion}]` },
  ];

  let finalResponse = '';
  try {
    if (config.display.stream && onStream) {
      finalResponse = await stream({
        modelConfig: executorModel,
        messages: executorMessages,
        system: EXECUTOR_SYSTEM,
        onChunk: (chunk) =>
          onStream({ type: 'response', content: chunk, role: 'executor', model: executorModel.model }),
        onFinish: () => onStream({ type: 'done', content: '' }),
      });
    } else {
      const result = await generate({ modelConfig: executorModel, messages: executorMessages, system: EXECUTOR_SYSTEM });
      finalResponse = result.text;
    }
  } catch (error: unknown) {
    throw classifyError(error, 'executor');
  }

  return {
    finalResponse,
    reasoning,
    toolsInvoked: [],
    messagesProduced: [
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reasoning,
        modelRole: 'reasoner',
        isReasoning: true,
        timestamp: Date.now(),
        model: reasonerModel.model,
      },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: finalResponse,
        modelRole: 'executor',
        timestamp: Date.now(),
        model: executorModel.model,
      },
    ],
  };
}
