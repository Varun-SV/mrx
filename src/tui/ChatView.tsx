import React from 'react';
import { Box, Static, Text } from 'ink';
import MessageBubble from './MessageBubble.js';
import type { Message } from '../types/index.js';

interface ChatViewProps {
  messages: Message[];
  streamingContent: string;
  isLoading: boolean;
  showReasoning: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({
  messages,
  streamingContent,
  isLoading,
  showReasoning,
}) => {
  return (
    <Box flexDirection="column" flexGrow={1}>
      <Static items={messages}>
        {(message) => (
          <MessageBubble
            key={message.id}
            message={message}
            showReasoning={showReasoning}
          />
        )}
      </Static>

      {isLoading && streamingContent && (
        <Box flexDirection="column" marginY={0}>
          <Text>{streamingContent}</Text>
          <Text dimColor>{'[streaming...]'}</Text>
        </Box>
      )}

      {isLoading && !streamingContent && (
        <Text dimColor>{'thinking...'}</Text>
      )}
    </Box>
  );
};

export default ChatView;
