import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from './supabaseClient';
import { TechniqueKey } from './techniques';

export type SessionDecision = 'guru' | 'user';
export type SessionStatus = 'live' | 'completed' | 'abandoned';

export interface SessionRecord {
  id: string;
  techniqueKey: TechniqueKey | null;
  decidedBy: SessionDecision;
  goal: string | null;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
}

export interface SessionRow {
  id: string;
  technique: TechniqueKey | null;
  decided_by: SessionDecision;
  goal: string | null;
  status: SessionStatus | null;
  started_at: string;
  ended_at: string | null;
}

export interface CreateSessionInput {
  techniqueKey: TechniqueKey;
  decidedBy: SessionDecision;
  goal?: string | null;
}

export function mapSessionRow(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    techniqueKey: row.technique,
    decidedBy: row.decided_by,
    goal: row.goal ?? null,
    status: row.status ?? 'live',
    startedAt: row.started_at,
    endedAt: row.ended_at ?? null,
  };
}

export async function createSession(
  input: CreateSessionInput
): Promise<SessionRecord> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('You must be signed in to start a session.');
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      technique: input.techniqueKey,
      decided_by: input.decidedBy,
      goal: input.goal ?? null,
      status: 'live',
    })
    .select('*')
    .single<SessionRow>();

  if (error || !data) {
    throw error ?? new Error('Failed to create session.');
  }

  return mapSessionRow(data);
}

export async function listSessions(): Promise<SessionRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('started_at', { ascending: false });

  if (error || !data) {
    throw error ?? new Error('Unable to fetch sessions.');
  }

  return data.map(row => mapSessionRow(row as SessionRow));
}

export function onSessionsChanged(callback: () => void): () => void {
  const supabase = createClient();
  const channel: RealtimeChannel = supabase
    .channel('public:sessions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions',
      },
      () => callback()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export interface SessionEventInput {
  kind: string;
  payload?: Record<string, unknown> | null;
}

export async function recordSessionEvent(
  sessionId: string,
  input: SessionEventInput
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('session_events').insert({
    session_id: sessionId,
    kind: input.kind,
    payload: input.payload ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function setSessionStatus(
  sessionId: string,
  status: SessionStatus
): Promise<void> {
  const supabase = createClient();
  const endedAt = status === 'live' ? null : new Date().toISOString();

  const { error } = await supabase
    .from('sessions')
    .update({
      status,
      ended_at: endedAt,
    })
    .eq('id', sessionId);

  if (error) {
    throw error;
  }
}

export interface SessionReflectionInput {
  mood: string;
  clarity: number;
  notes: string;
}

export async function logSessionReflection(
  sessionId: string,
  input: SessionReflectionInput
): Promise<void> {
  const supabase = createClient();
  const timestamp = new Date().toISOString();

  const eventPromise = supabase.from('session_events').insert({
    session_id: sessionId,
    kind: 'reflection',
    payload: {
      ...input,
      recorded_at: timestamp,
    },
  });

  const sessionPromise = supabase
    .from('sessions')
    .update({
      status: 'completed',
      ended_at: timestamp,
    })
    .eq('id', sessionId);

  const [{ error: eventError }, { error: sessionError }] = await Promise.all([
    eventPromise,
    sessionPromise,
  ]);

  if (eventError || sessionError) {
    throw eventError ?? sessionError ?? new Error('Failed to log reflection');
  }
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
