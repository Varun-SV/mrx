import React, { useState, useCallback } from 'react';
import { Box, useApp } from 'ink';
import StatusBar from './StatusBar.js';
import ChatView from './ChatView.js';
import InputBar from './InputBar.js';
import { orchestrate } from '../engine/orchestrator.js';
import type { Message, MrxConfig, InteractionMode, StreamChunk } from '../types/index.js';

interface AppProps {
  config: MrxConfig;
  sessionId?: string;
  initialMode?: string;
}

const App: React.FC<AppProps> = ({ config, initialMode }) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMode, setCurrentMode] = useState<InteractionMode>(
    (initialMode as InteractionMode) ?? config.default_mode,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showReasoning, setShowReasoning] = useState(config.display.show_reasoning);

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent('');

      try {
        const onStream = (chunk: StreamChunk) => {
          if (chunk.type === 'response') {
            setStreamingContent((prev) => prev + chunk.content);
          }
        };

        const result = await orchestrate(text, messages, config, currentMode, onStream);

        setMessages((prev) => [...prev, ...result.messagesProduced]);
        setStreamingContent('');
      } catch (error) {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${String(error)}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setStreamingContent('');
      } finally {
        setIsLoading(false);
      }
    },
    [messages, config, currentMode, isLoading],
  );

  const handleModeChange = useCallback((mode: InteractionMode) => {
    setCurrentMode(mode);
  }, []);

  const handleToggleReasoning = useCallback(() => {
    setShowReasoning((prev) => !prev);
  }, []);

  const handleQuit = useCallback(() => {
    exit();
  }, [exit]);

  return (
    <Box flexDirection="column" height="100%">
      <StatusBar
        mode={currentMode}
        config={config}
        isLoading={isLoading}
      />
      <Box flexGrow={1} flexDirection="column" overflow="hidden">
        <ChatView
          messages={messages}
          streamingContent={streamingContent}
          isLoading={isLoading}
          showReasoning={showReasoning}
        />
      </Box>
      <InputBar
        onSubmit={handleSubmit}
        onModeChange={handleModeChange}
        onToggleReasoning={handleToggleReasoning}
        onQuit={handleQuit}
        currentMode={currentMode}
        isLoading={isLoading}
      />
    </Box>
  );
};

export default App;
