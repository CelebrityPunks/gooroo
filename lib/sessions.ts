import { TechniqueKey } from './techniques';

export type SessionDecision = 'guru' | 'user';

export interface SessionRecord {
  id: string;
  techniqueKey: TechniqueKey;
  decidedBy: SessionDecision;
  startedAt: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = 'guru.sessions';
const UPDATE_EVENT = 'guru:sessions-updated';

let inMemorySessions: SessionRecord[] = [];

function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

function readSessions(): SessionRecord[] {
  if (isBrowser()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as SessionRecord[];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed;
    } catch (error) {
      return [];
    }
  }

  return inMemorySessions;
}

function persistSessions(sessions: SessionRecord[]): void {
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
  inMemorySessions = sessions;

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  }
}

export interface CreateSessionInput {
  techniqueKey: TechniqueKey;
  decidedBy: SessionDecision;
  metadata?: Record<string, unknown>;
}

export function createSession(input: CreateSessionInput): SessionRecord {
  const session: SessionRecord = {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Date.now().toString(36),
    techniqueKey: input.techniqueKey,
    decidedBy: input.decidedBy,
    startedAt: new Date().toISOString(),
    ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
  };

  const sessions = readSessions();
  const updated = [...sessions, session];
  persistSessions(updated);
  return session;
}

export function listSessions(): SessionRecord[] {
  const sessions = readSessions();
  return [...sessions].sort((a, b) => {
    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
  });
}

export function onSessionsChanged(callback: () => void): () => void {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleUpdate = () => callback();
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(UPDATE_EVENT, handleUpdate);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(UPDATE_EVENT, handleUpdate);
    window.removeEventListener('storage', handleStorage);
  };
}

export function clearSessions(): void {
  persistSessions([]);
}
