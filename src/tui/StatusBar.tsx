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
    <Box borderStyle="single" paddingX={1}>
      <Text bold>mrx</Text>
      <Text dimColor> │ </Text>
      <Text dimColor>{MODE_LABELS[mode]}</Text>
      <Text dimColor> │ </Text>
      <Text color="cyan" dimColor>
        reasoner: {reasoner.provider}/{reasoner.model}
      </Text>
      <Text dimColor> │ </Text>
      <Text color="green" dimColor>
        executor: {executor.provider}/{executor.model}
      </Text>
      {isLoading && (
        <>
          <Text dimColor> │ </Text>
          <Text color="yellow">{SPINNER_FRAMES[spinnerIdx]}</Text>
        </>
      )}
    </Box>
  );
};

export default StatusBar;
