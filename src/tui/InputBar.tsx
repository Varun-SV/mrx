import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { InteractionMode } from '../types/index.js';

interface InputBarProps {
  onSubmit: (text: string) => void;
  onModeChange: (mode: InteractionMode) => void;
  onToggleReasoning: () => void;
  onQuit: () => void;
  currentMode: InteractionMode;
  isLoading: boolean;
}

const MODES: InteractionMode[] = ['planner_executor', 'think_then_answer', 'manual'];

function nextMode(current: InteractionMode): InteractionMode {
  const idx = MODES.indexOf(current);
  return MODES[(idx + 1) % MODES.length];
}

const InputBar: React.FC<InputBarProps> = ({
  onSubmit,
  onModeChange,
  onToggleReasoning,
  onQuit,
  currentMode,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setCursor((c) => !c), 530);
    return () => clearInterval(interval);
  }, []);

  useInput((inputChar, key) => {
    if (isLoading) return;

    if (key.return) {
      if (input.trim()) {
        onSubmit(input);
        setInput('');
      }
      return;
    }

    if (key.ctrl && inputChar === 'm') {
      onModeChange(nextMode(currentMode));
      return;
    }

    if (key.ctrl && inputChar === 'r') {
      onToggleReasoning();
      return;
    }

    if (key.ctrl && inputChar === 'c') {
      onQuit();
      return;
    }

    if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
      return;
    }

    if (!key.ctrl && !key.meta && inputChar) {
      setInput((prev) => prev + inputChar);
    }
  });

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Box>
        <Text color="cyan">{'> '}</Text>
        <Text>{input}</Text>
        <Text>{cursor ? '|' : ' '}</Text>
      </Box>
      <Text dimColor>
        {'[Enter] send  [Ctrl+M] mode  [Ctrl+R] reasoning  [Ctrl+C] quit'}
      </Text>
    </Box>
  );
};

export default InputBar;
