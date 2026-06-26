import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { InteractionMode } from '../types/index.js';

interface InputBarProps {
  onSubmit: (text: string) => void;
  onModeChange: (mode: InteractionMode) => void;
  onToggleReasoning: () => void;
  onNewSession?: () => void;
  onShowSessionList?: () => void;
  onQuit: () => void;
  currentMode: InteractionMode;
  isLoading: boolean;
}

const MODES: InteractionMode[] = ['planner_executor', 'think_then_answer', 'manual'];

const MAX_HISTORY = 50;

function nextMode(current: InteractionMode): InteractionMode {
  const idx = MODES.indexOf(current);
  return MODES[(idx + 1) % MODES.length];
}

const InputBar: React.FC<InputBarProps> = ({
  onSubmit,
  onModeChange,
  onToggleReasoning,
  onNewSession,
  onShowSessionList,
  onQuit,
  currentMode,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const [cursor, setCursor] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => setCursor((c) => !c), 530);
    return () => clearInterval(interval);
  }, []);

  useInput((inputChar, key) => {
    if (isLoading) return;

    if (key.return) {
      if (input.trim()) {
        setHistory((prev) => {
          const next = [input, ...prev.filter((h) => h !== input)].slice(0, MAX_HISTORY);
          return next;
        });
        setHistoryIdx(-1);
        onSubmit(input);
        setInput('');
      }
      return;
    }

    if (key.upArrow) {
      setHistoryIdx((prev) => {
        const next = Math.min(prev + 1, history.length - 1);
        if (next >= 0 && history[next] !== undefined) setInput(history[next]);
        return next;
      });
      return;
    }

    if (key.downArrow) {
      setHistoryIdx((prev) => {
        const next = prev - 1;
        if (next < 0) {
          setInput('');
          return -1;
        }
        if (history[next] !== undefined) setInput(history[next]);
        return next;
      });
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

    if (key.ctrl && inputChar === 'n') {
      onNewSession?.();
      return;
    }

    if (key.ctrl && inputChar === 'l') {
      onShowSessionList?.();
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

  const sessionHints = onNewSession ? '  [Ctrl+N] new  [Ctrl+L] sessions' : '';

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Box>
        <Text color="#45C8DB">{'> '}</Text>
        <Text>{input}</Text>
        <Text color="#45C8DB">{cursor ? '▏' : ' '}</Text>
      </Box>
      <Text dimColor>
        {'[Enter] send  [Ctrl+M] mode  [Ctrl+R] reasoning  [Ctrl+C] quit' + sessionHints}
      </Text>
    </Box>
  );
};

export default InputBar;
