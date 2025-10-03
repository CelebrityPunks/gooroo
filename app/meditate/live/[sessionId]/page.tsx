import React from 'react';
import { notFound } from 'next/navigation';
import LiveSessionView from './LiveSessionView';
import { getTechniqueByKey, TechniqueKey } from '../../../../lib/techniques';
import { createClient } from '../../../../lib/supabaseServer';
import type { SessionStatus } from '../../../../lib/sessions';

interface LiveSessionPageProps {
  params: {
    sessionId: string;
  };
  searchParams?: {
    technique?: string;
    decidedBy?: string;
  };
}

interface SessionRow {
  technique: TechniqueKey | null;
  decided_by: 'guru' | 'user';
  goal: string | null;
  status: SessionStatus | null;
  started_at: string | null;
}

export default async function LiveSessionPage({
  params,
  searchParams,
}: LiveSessionPageProps) {
  const { sessionId } = params;
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('technique, decided_by, goal, status, started_at')
    .eq('id', sessionId)
    .maybeSingle<SessionRow>();

  if (!data && !searchParams?.technique) {
    notFound();
  }

  const loadError = error ? 'We could not load full session details.' : null;

  const techniqueKey =
    data?.technique ??
    (searchParams?.technique as TechniqueKey | undefined) ??
    null;
  const technique = getTechniqueByKey(techniqueKey);
  const decidedBy =
    (searchParams?.decidedBy as 'guru' | 'user' | undefined) ??
    data?.decided_by ??
    'guru';

  const goal = data?.goal ?? null;
  const startedAt = data?.started_at ?? null;
  const initialStatus: SessionStatus = data?.status ?? 'live';

  return (
    <LiveSessionView
      sessionId={sessionId}
      technique={technique}
      decidedBy={decidedBy}
      goal={goal}
      startedAt={startedAt}
      initialStatus={initialStatus}
      loadError={loadError}
    />
  );
}
