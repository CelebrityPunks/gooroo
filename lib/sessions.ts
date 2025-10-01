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
}

interface SessionRow {
  id: string;
  technique: TechniqueKey | null;
  decided_by: SessionDecision;
  goal: string | null;
  status: SessionStatus | null;
  started_at: string;
}

export interface CreateSessionInput {
  techniqueKey: TechniqueKey;
  decidedBy: SessionDecision;
  goal?: string | null;
}

function mapRowToRecord(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    techniqueKey: row.technique,
    decidedBy: row.decided_by,
    goal: row.goal ?? null,
    status: row.status ?? 'live',
    startedAt: row.started_at,
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

  return mapRowToRecord(data);
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

  return data.map(row => mapRowToRecord(row as SessionRow));
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
