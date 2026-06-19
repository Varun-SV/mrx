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
          borderColor="#6BA5F5"
          paddingX={1}
          flexDirection="column"
        >
          <Text color="#6BA5F5">{message.content}</Text>
        </Box>
      </Box>
    );
  }

  if (message.isReasoning) {
    return (
      <Box flexDirection="column" marginY={0}>
        <Text dimColor italic>
          <Text color="#45C8DB">{'[reasoning] '}</Text>
          {message.content}
        </Text>
        <Text color="#45C8DB" dimColor>{'  [reasoner]'}</Text>
      </Box>
    );
  }

  if (message.role === 'tool') {
    return (
      <Box flexDirection="column" marginY={0}>
        <Text dimColor>
          <Text color="#E5B567">{'[tool] '}</Text>
          {message.content}
        </Text>
        <Text color="#E5B567" dimColor>{'  [tool_caller]'}</Text>
      </Box>
    );
  }

  // Regular assistant message — label color keyed to role
  if (message.modelRole === 'reasoner') {
    return (
      <Box flexDirection="column" marginY={0}>
        <Text>{message.content}</Text>
        <Text color="#45C8DB" dimColor>{'[reasoner]'}</Text>
      </Box>
    );
  }

  if (message.modelRole === 'tool_caller') {
    return (
      <Box flexDirection="column" marginY={0}>
        <Text>{message.content}</Text>
        <Text color="#E5B567" dimColor>{'[tool_caller]'}</Text>
      </Box>
    );
  }

  // executor (default)
  return (
    <Box flexDirection="column" marginY={0}>
      <Text>{message.content}</Text>
      <Text color="#5BD68A" dimColor>
        {message.modelRole === 'executor' ? '[executor]' : '[assistant]'}
      </Text>
    </Box>
  );
};

export default MessageBubble;
