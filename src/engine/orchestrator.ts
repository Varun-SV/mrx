import type {
  MrxConfig,
  Message,
  OrchestrationResult,
  InteractionMode,
  StreamChunk,
} from '../types/index.js';
import { thinkThenAnswer } from './modes/thinkThenAnswer.js';
import { plannerExecutor } from './modes/plannerExecutor.js';
import { manualRoute } from './modes/manual.js';

export async function orchestrate(
  userMessage: string,
  history: Message[],
  config: MrxConfig,
  mode: InteractionMode,
  onStream?: (chunk: StreamChunk) => void,
): Promise<OrchestrationResult> {
  switch (mode) {
    case 'think_then_answer':
      return thinkThenAnswer(userMessage, history, config, onStream);
    case 'planner_executor':
      return plannerExecutor(userMessage, history, config, onStream);
    case 'manual':
      return manualRoute(userMessage, history, config, onStream);
    default:
      throw new Error(`Unknown interaction mode: ${mode}`);
  }
}
