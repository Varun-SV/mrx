import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { MrxConfig, InteractionMode } from '../types/index.js';

interface StatusBarProps {
  mode: InteractionMode;
  config: MrxConfig;
  isLoading: boolean;
}

const MODE_LABELS: Record<InteractionMode, string> = {
  think_then_answer: 'think-then-answer',
  planner_executor: 'planner-executor',
  manual: 'manual',
};

const MODE_DESCRIPTIONS: Record<InteractionMode, string> = {
  think_then_answer: 'reasoner thinks, executor answers',
  planner_executor: 'reasoner plans steps, executor runs each',
  manual: 'route with @reasoner / @executor / @tool_caller',
};

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const StatusBar: React.FC<StatusBarProps> = ({ mode, config, isLoading }) => {
  const [spinnerIdx, setSpinnerIdx] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setSpinnerIdx((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(interval);
  }, [isLoading]);

  const reasoner = config.models.reasoner;
  const executor = config.models.executor;

  return (
    <Box borderStyle="single" paddingX={1} flexDirection="column">
      <Box>
        <Text bold>mrx</Text>
        <Text dimColor> │ </Text>
        <Text color="#45C8DB">{MODE_LABELS[mode]}</Text>
        <Text dimColor> │ </Text>
        <Text dimColor color="#45C8DB">{'reasoner: '}</Text>
        <Text color="#45C8DB">
          {reasoner.provider}/{reasoner.model}
        </Text>
        <Text dimColor> │ </Text>
        <Text dimColor color="#5BD68A">{'executor: '}</Text>
        <Text color="#5BD68A">
          {executor.provider}/{executor.model}
        </Text>
        {isLoading && (
          <>
            <Text dimColor> │ </Text>
            <Text color="#E5B567">{SPINNER_FRAMES[spinnerIdx]}</Text>
          </>
        )}
      </Box>
      <Text dimColor italic>{MODE_DESCRIPTIONS[mode]}</Text>
    </Box>
  );
};

export default StatusBar;
