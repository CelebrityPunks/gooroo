import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { AUTH_ENABLED } from '../../lib/config';
import { createClient } from '../../lib/supabaseServer';
import { mapSessionRow, SessionRecord, SessionRow } from '../../lib/sessions';

export default async function DashboardPage() {
  if (!AUTH_ENABLED) {
    redirect('/meditate');
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/');
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('id, technique, decided_by, goal, status, started_at, ended_at')
    .eq('user_id', session.user.id)
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  const sessions: SessionRecord[] = (data ?? []).map(row =>
    mapSessionRow(row as SessionRow)
  );

  return (
    <DashboardClient
      userEmail={session.user.email ?? null}
      sessions={sessions}
    />
  );
}
