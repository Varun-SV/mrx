import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { SessionMeta } from '../types/index.js';

interface SessionListProps {
  sessions: SessionMeta[];
  onSelect: (session: SessionMeta) => void;
  onCancel: () => void;
}

const SessionList: React.FC<SessionListProps> = ({ sessions, onSelect, onCancel }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setSelectedIdx((prev) => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIdx((prev) => Math.min(sessions.length - 1, prev + 1));
      return;
    }
    if (key.return && sessions.length > 0) {
      onSelect(sessions[selectedIdx]);
      return;
    }
    if (key.escape) {
      onCancel();
      return;
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} paddingY={0}>
      <Text bold color="#45C8DB">Sessions  </Text>
      <Text dimColor>↑/↓ navigate · Enter select · Esc cancel</Text>
      <Box flexDirection="column" marginTop={1}>
        {sessions.length === 0 ? (
          <Text dimColor>(no saved sessions)</Text>
        ) : (
          sessions.map((s, i) => (
            <Box key={s.id}>
              <Text color={i === selectedIdx ? '#45C8DB' : undefined} bold={i === selectedIdx}>
                {i === selectedIdx ? '▶ ' : '  '}
                {s.name}
              </Text>
              <Text dimColor>
                {' '}
                [{s.mode}] {s.messageCount} msgs
              </Text>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default SessionList;
