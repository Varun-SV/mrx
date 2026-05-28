import { generate } from '../../providers/adapter.js';
import { resolveModelForRole } from '../router.js';
import { buildToolRegistry } from '../../tools/registry.js';
import type {
  MrxConfig,
  Message,
  OrchestrationResult,
  StreamChunk,
  ToolCall,
} from '../../types/index.js';
import type { CoreMessage } from 'ai';

const PLANNER_SYSTEM = `Produce ONLY a numbered list of steps to complete the task. Each step on a new line starting with \`N.\` where N is the step number. No explanation, no preamble, no markdown. Just the steps.`;

function parsePlan(planText: string): string[] {
  return planText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

export async function plannerExecutor(
  userMessage: string,
  history: Message[],
  config: MrxConfig,
  onStream?: (chunk: StreamChunk) => void,
): Promise<OrchestrationResult> {
  const reasonerModel = resolveModelForRole('reasoner', config);
  const executorModel = resolveModelForRole('executor', config);
  const tools = buildToolRegistry(config.tools);

  const baseMessages: CoreMessage[] = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ];

  // Step 1: Generate plan
  const planText = await generate({
    modelConfig: reasonerModel,
    messages: baseMessages,
    system: PLANNER_SYSTEM,
  });

  onStream?.({
    type: 'reasoning',
    content: planText,
    role: 'reasoner',
    model: reasonerModel.model,
  });

  const steps = parsePlan(planText);
  const allToolsInvoked: ToolCall[] = [];
  const stepResults: string[] = [];

  // Step 2: Execute each step
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepContext = stepResults.map((r, idx) => `Step ${idx + 1} result: ${r}`).join('\n');

    const executorSystem = [
      `Original user query: ${userMessage}`,
      `Full plan:\n${steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`,
      `You are now executing step ${i + 1}: ${step}`,
      stepResults.length > 0 ? `Previous step results:\n${stepContext}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const stepMessages: CoreMessage[] = [{ role: 'user', content: step }];

    const stepResult = await generate({
      modelConfig: executorModel,
      messages: stepMessages,
      tools,
      system: executorSystem,
    });

    stepResults.push(stepResult);
    onStream?.({
      type: 'response',
      content: `[Step ${i + 1}/${steps.length}] ${stepResult}\n`,
      role: 'executor',
      model: executorModel.model,
    });
  }

  // Step 3: Synthesize
  const synthesisSystem = `Given the following step results for the user's query, produce a final cohesive answer.\n\nUser query: ${userMessage}`;
  const synthesisMessages: CoreMessage[] = [
    {
      role: 'user',
      content: `Step results:\n${stepResults.map((r, i) => `Step ${i + 1}: ${r}`).join('\n\n')}\n\nPlease synthesize a final answer.`,
    },
  ];

  const finalResponse = await generate({
    modelConfig: executorModel,
    messages: synthesisMessages,
    system: synthesisSystem,
  });

  onStream?.({ type: 'done', content: '' });

  return {
    finalResponse,
    reasoning: planText,
    toolsInvoked: allToolsInvoked,
    messagesProduced: [
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: planText,
        modelRole: 'reasoner',
        isReasoning: true,
        timestamp: Date.now(),
        model: reasonerModel.model,
      },
      ...stepResults.map((result) => ({
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: result,
        modelRole: 'executor' as const,
        timestamp: Date.now(),
        model: executorModel.model,
      })),
      {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: finalResponse,
        modelRole: 'executor' as const,
        timestamp: Date.now(),
        model: executorModel.model,
      },
    ],
  };
}
