import { generate } from '../../providers/adapter.js';
import { resolveModelForRole } from '../router.js';
import { buildToolRegistry } from '../../tools/registry.js';
import type {
  MrxConfig,
  Message,
  OrchestrationResult,
  StreamChunk,
  ToolCall,
  ToolResult,
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

/**
 * Groups step indices into execution waves. Steps in the same wave are independent
 * (don't reference prior incomplete steps) and can run in parallel.
 */
function groupStepsIntoWaves(steps: string[]): number[][] {
  const completed = new Set<number>();
  const waves: number[][] = [];
  let remaining = steps.map((_, i) => i);

  while (remaining.length > 0) {
    const wave = remaining.filter((i) => {
      for (let j = 0; j < i; j++) {
        if (!completed.has(j) && steps[i].toLowerCase().includes(`step ${j + 1}`)) {
          return false;
        }
      }
      return true;
    });

    // Deadlock guard: if nothing is ready, take the first remaining step
    const batch = wave.length > 0 ? wave : [remaining[0]];
    waves.push(batch);
    batch.forEach((i) => completed.add(i));
    remaining = remaining.filter((i) => !completed.has(i));
  }

  return waves;
}

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
  let planText: string;
  try {
    const result = await generate({
      modelConfig: reasonerModel,
      messages: baseMessages,
      system: PLANNER_SYSTEM,
    });
    planText = result.text;
  } catch (error: unknown) {
    throw classifyError(error, 'reasoner/planner');
  }

  onStream?.({
    type: 'reasoning',
    content: planText,
    role: 'reasoner',
    model: reasonerModel.model,
  });

  const steps = parsePlan(planText);
  const allToolsInvoked: ToolCall[] = [];
  const allToolResults: ToolResult[] = [];
  const stepResults: string[] = new Array(steps.length).fill('');

  // Step 2: Execute steps in parallel waves
  const waves = groupStepsIntoWaves(steps);

  for (const wave of waves) {
    const wavePromises = wave.map(async (i) => {
      const step = steps[i];
      const priorContext = stepResults
        .slice(0, i)
        .map((r, idx) => (r ? `Step ${idx + 1} result: ${r}` : ''))
        .filter(Boolean)
        .join('\n');

      const executorSystem = [
        `Original user query: ${userMessage}`,
        `Full plan:\n${steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`,
        `You are now executing step ${i + 1}: ${step}`,
        priorContext ? `Previous step results:\n${priorContext}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const stepMessages: CoreMessage[] = [{ role: 'user', content: step }];

      let stepResult: string;
      let stepToolCalls: ToolCall[] = [];
      let stepToolResults: ToolResult[] = [];
      try {
        const result = await generate({
          modelConfig: executorModel,
          messages: stepMessages,
          tools,
          system: executorSystem,
        });
        stepResult = result.text;
        stepToolCalls = result.toolCalls;
        stepToolResults = result.toolResults;
      } catch (error: unknown) {
        throw classifyError(error, `executor/step-${i + 1}`);
      }

      stepResults[i] = stepResult;
      allToolsInvoked.push(...stepToolCalls);
      allToolResults.push(...stepToolResults);

      onStream?.({
        type: 'response',
        content: `[Step ${i + 1}/${steps.length}] ${stepResult}\n`,
        role: 'executor',
        model: executorModel.model,
      });
    });

    await Promise.all(wavePromises);
  }

  // Step 3: Synthesize
  const synthesisSystem = `Given the following step results for the user's query, produce a final cohesive answer.\n\nUser query: ${userMessage}`;
  const synthesisMessages: CoreMessage[] = [
    {
      role: 'user',
      content: `Step results:\n${stepResults.map((r, i) => `Step ${i + 1}: ${r}`).join('\n\n')}\n\nPlease synthesize a final answer.`,
    },
  ];

  let finalResponse: string;
  try {
    const result = await generate({
      modelConfig: executorModel,
      messages: synthesisMessages,
      system: synthesisSystem,
    });
    finalResponse = result.text;
  } catch (error: unknown) {
    throw classifyError(error, 'executor/synthesis');
  }

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
        toolCalls: allToolsInvoked.length > 0 ? allToolsInvoked : undefined,
        toolResults: allToolResults.length > 0 ? allToolResults : undefined,
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
