import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SessionStore } from '../../src/session/store.js';
import type { Message } from '../../src/types/index.js';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore(':memory:');
  });

  afterEach(() => {
    store.close();
  });

  it('createSession returns a UUID-format string', () => {
    const id = store.createSession('Test Session', 'think_then_answer');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('getSession returns null for non-existent session', () => {
    const session = store.getSession('non-existent-id');
    expect(session).toBeNull();
  });

  it('appendMessage then getSession returns the correct message', () => {
    const sessionId = store.createSession('My Session', 'manual');
    const message: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Hello, world!',
      timestamp: Date.now(),
    };

    store.appendMessage(sessionId, message);
    const session = store.getSession(sessionId);

    expect(session).not.toBeNull();
    expect(session!.messages).toHaveLength(1);
    expect(session!.messages[0].content).toBe('Hello, world!');
    expect(session!.messages[0].role).toBe('user');
  });

  it('listSessions returns metadata including messageCount', () => {
    const id1 = store.createSession('Session One', 'think_then_answer');
    const id2 = store.createSession('Session Two', 'planner_executor');

    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'test',
      timestamp: Date.now(),
    };
    store.appendMessage(id1, msg);
    store.appendMessage(id1, { ...msg, id: crypto.randomUUID() });

    const sessions = store.listSessions();
    expect(sessions.length).toBe(2);

    const s1 = sessions.find((s) => s.id === id1);
    const s2 = sessions.find((s) => s.id === id2);

    expect(s1).toBeDefined();
    expect(s1!.messageCount).toBe(2);
    expect(s2).toBeDefined();
    expect(s2!.messageCount).toBe(0);
  });

  it('deleteSession removes session and cascades to messages', () => {
    const sessionId = store.createSession('Deletable', 'manual');
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'goodbye',
      timestamp: Date.now(),
    };
    store.appendMessage(sessionId, msg);

    store.deleteSession(sessionId);
    const session = store.getSession(sessionId);
    expect(session).toBeNull();

    const sessions = store.listSessions();
    expect(sessions.find((s) => s.id === sessionId)).toBeUndefined();
  });

  it('persists multiple messages in timestamp order', () => {
    const sessionId = store.createSession('Order Test', 'manual');
    const base = Date.now();
    for (let i = 0; i < 3; i++) {
      store.appendMessage(sessionId, {
        id: crypto.randomUUID(),
        role: 'user',
        content: `Message ${i}`,
        timestamp: base + i,
      });
    }

    const session = store.getSession(sessionId);
    expect(session!.messages[0].content).toBe('Message 0');
    expect(session!.messages[2].content).toBe('Message 2');
  });
});
