import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, useApp } from 'ink';
import StatusBar from './StatusBar.js';
import ChatView from './ChatView.js';
import InputBar from './InputBar.js';
import SessionList from './SessionList.js';
import { orchestrate } from '../engine/orchestrator.js';
import { SessionStore } from '../session/store.js';
import type { Message, MrxConfig, InteractionMode, StreamChunk, SessionMeta } from '../types/index.js';

interface AppProps {
  config: MrxConfig;
  sessionId?: string;
  initialMode?: string;
}

const App: React.FC<AppProps> = ({ config, sessionId, initialMode }) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMode, setCurrentMode] = useState<InteractionMode>(
    (initialMode as InteractionMode) ?? config.default_mode,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [streamChunks, setStreamChunks] = useState<string[]>([]);
  const [showReasoning, setShowReasoning] = useState(config.display.show_reasoning);
  const [showSessionList, setShowSessionList] = useState(false);
  const [sessionList, setSessionList] = useState<SessionMeta[]>([]);
  const activeSessionId = useRef<string | undefined>(undefined);
  const store = useRef<SessionStore | null>(null);

  // Initialize store and optionally resume a session
  useEffect(() => {
    if (!config.session_memory) return;

    store.current = new SessionStore(config.session_db_path);

    if (sessionId) {
      const session = store.current.getSession(sessionId);
      if (session) {
        setMessages(session.messages);
        setCurrentMode(session.mode);
        activeSessionId.current = session.id;
      }
    }

    return () => {
      store.current?.close();
      store.current = null;
    };
  }, []);

  const persistMessages = useCallback((newMessages: Message[]) => {
    if (!store.current || !config.session_memory) return;
    if (!activeSessionId.current) {
      const name = `Session ${new Date().toLocaleString()}`;
      activeSessionId.current = store.current.createSession(name, currentMode);
    }
    for (const msg of newMessages) {
      store.current.appendMessage(activeSessionId.current, msg);
    }
  }, [config.session_memory, currentMode]);

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
      setStreamChunks([]);

      try {
        const onStream = (chunk: StreamChunk) => {
          if (chunk.type === 'response') {
            setStreamChunks((prev) => [...prev, chunk.content]);
          }
        };

        const result = await orchestrate(text, messages, config, currentMode, onStream);

        setMessages((prev) => {
          const next = [...prev, ...result.messagesProduced];
          persistMessages([userMessage, ...result.messagesProduced]);
          return next;
        });
        setStreamChunks([]);
      } catch (error) {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setStreamChunks([]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, config, currentMode, isLoading, persistMessages],
  );

  const handleModeChange = useCallback((mode: InteractionMode) => {
    setCurrentMode(mode);
  }, []);

  const handleToggleReasoning = useCallback(() => {
    setShowReasoning((prev) => !prev);
  }, []);

  const handleNewSession = useCallback(() => {
    if (!store.current || !config.session_memory) return;
    const name = `Session ${new Date().toLocaleString()}`;
    activeSessionId.current = store.current.createSession(name, currentMode);
    setMessages([]);
    setStreamChunks([]);
  }, [config.session_memory, currentMode]);

  const handleShowSessionList = useCallback(() => {
    if (!store.current || !config.session_memory) return;
    setSessionList(store.current.listSessions());
    setShowSessionList(true);
  }, [config.session_memory]);

  const handleSelectSession = useCallback((session: SessionMeta) => {
    if (!store.current) return;
    const loaded = store.current.getSession(session.id);
    if (loaded) {
      setMessages(loaded.messages);
      setCurrentMode(loaded.mode);
      activeSessionId.current = loaded.id;
    }
    setShowSessionList(false);
  }, []);

  const handleCancelSessionList = useCallback(() => {
    setShowSessionList(false);
  }, []);

  const handleQuit = useCallback(() => {
    exit();
  }, [exit]);

  const streamingContent = streamChunks.join('');

  return (
    <Box flexDirection="column" height="100%">
      <StatusBar mode={currentMode} config={config} isLoading={isLoading} />
      {showSessionList ? (
        <SessionList
          sessions={sessionList}
          onSelect={handleSelectSession}
          onCancel={handleCancelSessionList}
        />
      ) : (
        <Box flexGrow={1} flexDirection="column" overflow="hidden">
          <ChatView
            messages={messages}
            streamingContent={streamingContent}
            isLoading={isLoading}
            showReasoning={showReasoning}
          />
        </Box>
      )}
      <InputBar
        onSubmit={handleSubmit}
        onModeChange={handleModeChange}
        onToggleReasoning={handleToggleReasoning}
        onNewSession={config.session_memory ? handleNewSession : undefined}
        onShowSessionList={config.session_memory ? handleShowSessionList : undefined}
        onQuit={handleQuit}
        currentMode={currentMode}
        isLoading={isLoading}
      />
    </Box>
  );
};

export default App;
