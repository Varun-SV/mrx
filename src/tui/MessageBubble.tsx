import React from 'react';
import { Box, Text } from 'ink';
import type { Message } from '../types/index.js';

interface MessageBubbleProps {
  message: Message;
  showReasoning: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showReasoning }) => {
  if (message.isReasoning && !showReasoning) {
    return null;
  }

  if (message.role === 'user') {
    return (
      <Box justifyContent="flex-end" marginY={0}>
        <Box
          borderStyle="round"
          borderColor="blue"
          paddingX={1}
          flexDirection="column"
        >
          <Text color="blue">{message.content}</Text>
        </Box>
      </Box>
    );
  }

  if (message.isReasoning) {
    return (
      <Box flexDirection="column" marginY={0}>
        <Text dimColor italic>
          {'[reasoning] '}
          {message.content}
        </Text>
        {message.model && (
          <Text dimColor>{'  [reasoner]'}</Text>
        )}
      </Box>
    );
  }

  if (message.role === 'tool') {
    return (
      <Box flexDirection="column" marginY={0}>
        <Text color="yellow" dimColor>
          {'[tool] '}
          {message.content}
        </Text>
      </Box>
    );
  }

  // Regular assistant message
  const label = message.modelRole === 'executor'
    ? '[executor]'
    : message.modelRole === 'reasoner'
    ? '[reasoner]'
    : message.modelRole === 'tool_caller'
    ? '[tool_caller]'
    : '[assistant]';

  return (
    <Box flexDirection="column" marginY={0}>
      <Text>{message.content}</Text>
      <Text dimColor>{label}</Text>
    </Box>
  );
};

export default MessageBubble;
