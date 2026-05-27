import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { Message, Session, SessionMeta, InteractionMode } from '../types/index.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mode TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  model TEXT,
  model_role TEXT,
  is_reasoning INTEGER DEFAULT 0,
  timestamp INTEGER NOT NULL,
  tool_calls TEXT,
  tool_results TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, timestamp);
`;

export class SessionStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    if (dbPath !== ':memory:') {
      fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(SCHEMA);
  }

  /** Create a new session, return its ID */
  createSession(name: string, mode: InteractionMode): string {
    const id = crypto.randomUUID();
    const now = Date.now();
    this.db
      .prepare(
        'INSERT INTO sessions (id, name, mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(id, name, mode, now, now);
    return id;
  }

  /** Load all messages for a session */
  getSession(sessionId: string): Session | null {
    const row = this.db
      .prepare('SELECT id, name, mode, created_at, updated_at FROM sessions WHERE id = ?')
      .get(sessionId) as
      | { id: string; name: string; mode: string; created_at: number; updated_at: number }
      | undefined;

    if (!row) return null;

    const messageRows = this.db
      .prepare(
        'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC',
      )
      .all(sessionId) as Array<{
      id: string;
      session_id: string;
      role: string;
      content: string;
      model: string | null;
      model_role: string | null;
      is_reasoning: number;
      timestamp: number;
      tool_calls: string | null;
      tool_results: string | null;
    }>;

    const messages: Message[] = messageRows.map((m) => ({
      id: m.id,
      role: m.role as Message['role'],
      content: m.content,
      model: m.model ?? undefined,
      modelRole: m.model_role as Message['modelRole'],
      isReasoning: m.is_reasoning === 1,
      timestamp: m.timestamp,
      toolCalls: m.tool_calls ? JSON.parse(m.tool_calls) : undefined,
      toolResults: m.tool_results ? JSON.parse(m.tool_results) : undefined,
    }));

    return {
      id: row.id,
      name: row.name,
      mode: row.mode as InteractionMode,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messages,
    };
  }

  /** Append a message to a session */
  appendMessage(sessionId: string, message: Message): void {
    this.db
      .prepare(
        `INSERT INTO messages
          (id, session_id, role, content, model, model_role, is_reasoning, timestamp, tool_calls, tool_results)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        message.id,
        sessionId,
        message.role,
        message.content,
        message.model ?? null,
        message.modelRole ?? null,
        message.isReasoning ? 1 : 0,
        message.timestamp,
        message.toolCalls ? JSON.stringify(message.toolCalls) : null,
        message.toolResults ? JSON.stringify(message.toolResults) : null,
      );

    this.db
      .prepare('UPDATE sessions SET updated_at = ? WHERE id = ?')
      .run(Date.now(), sessionId);
  }

  /** List all sessions with metadata */
  listSessions(): SessionMeta[] {
    const rows = this.db
      .prepare(
        `SELECT s.id, s.name, s.mode, s.created_at, s.updated_at,
                COUNT(m.id) as message_count
         FROM sessions s
         LEFT JOIN messages m ON m.session_id = s.id
         GROUP BY s.id
         ORDER BY s.updated_at DESC`,
      )
      .all() as Array<{
      id: string;
      name: string;
      mode: string;
      created_at: number;
      updated_at: number;
      message_count: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      mode: r.mode as InteractionMode,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      messageCount: r.message_count,
    }));
  }

  /** Delete a session and all its messages */
  deleteSession(sessionId: string): void {
    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }

  close(): void {
    this.db.close();
  }
}
