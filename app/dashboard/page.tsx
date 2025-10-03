import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { createClient } from '../../lib/supabaseServer';
import { mapSessionRow, SessionRecord, SessionRow } from '../../lib/sessions';

export default async function DashboardPage() {
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
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../components/auth/AuthProvider';
import {
  listSessions,
  onSessionsChanged,
  SessionRecord,
} from '../../lib/sessions';
import { getTechniqueByKey } from '../../lib/techniques';
import Link from 'next/link';

type Summary = {
  totalMinutes: number;
  streak: number;
};

function computeSummary(sessions: SessionRecord[]): Summary {
  const totalMinutes = sessions.reduce((total, session) => {
    const technique = getTechniqueByKey(session.techniqueKey);
    return total + (technique?.defaultDurationMinutes ?? 5);
  }, 0);

  const dayKey = (value: string) => new Date(value).toISOString().split('T')[0];
  const uniqueDays = new Set(
    sessions.map(session => dayKey(session.startedAt))
  );

  if (uniqueDays.size === 0) {
    return { totalMinutes, streak: 0 };
  }

  const today = new Date();
  const previousDay = (date: Date) => {
    const next = new Date(date);
    next.setDate(date.getDate() - 1);
    next.setHours(0, 0, 0, 0);
    return next;
  };

  const formatDay = (date: Date) => date.toISOString().split('T')[0];

  let current = uniqueDays.has(formatDay(today)) ? today : previousDay(today);
  let streak = 0;

  while (uniqueDays.has(formatDay(current))) {
    streak += 1;
    current = previousDay(current);
  }

  return { totalMinutes, streak };
}

function formatDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    const sync = () => setSessions(listSessions());
    sync();

    const unsubscribe = onSessionsChanged(sync);
    return () => {
      unsubscribe();
    };
  }, []);

  const summary = useMemo(() => computeSummary(sessions), [sessions]);
  const recentSessions = useMemo(() => sessions.slice(0, 5), [sessions]);

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
          <div className='flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-4'>
            <span className='text-sm text-gray-600'>
              Welcome, {user?.email}
            </span>
            <Button variant='outline' onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <Card className='p-6 space-y-2'>
            <h2 className='text-xl font-semibold'>Recent Sessions</h2>
            {recentSessions.length === 0 ? (
              <p className='text-gray-600'>No sessions yet</p>
            ) : (
              <ul className='space-y-2 text-sm text-gray-700'>
                {recentSessions.map(session => {
                  const technique = getTechniqueByKey(session.techniqueKey);
                  return (
                    <li
                      key={session.id}
                      className='flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2'
                    >
                      <div>
                        <p className='font-semibold text-gray-900'>
                          {technique?.name ?? 'Meditation'}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {formatDate(session.startedAt)} ·{' '}
                          {session.decidedBy === 'guru'
                            ? 'Guru choice'
                            : 'Your pick'}
                        </p>
                      </div>
                      <Link
                        className='text-xs font-semibold text-blue-600 hover:underline'
                        href={`/meditate/live/${session.id}?technique=${session.techniqueKey}&decidedBy=${session.decidedBy}`}
                      >
                        Revisit
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className='p-6 space-y-2'>
            <h2 className='text-xl font-semibold'>Total Minutes</h2>
            <p className='text-3xl font-bold text-blue-600'>
              {summary.totalMinutes}
            </p>
            <p className='text-sm text-gray-500'>
              Lifetime minutes meditated in this device.
            </p>
          </Card>

          <Card className='p-6 space-y-2'>
            <h2 className='text-xl font-semibold'>Current Streak</h2>
            <p className='text-3xl font-bold text-green-600'>
              {summary.streak} days
            </p>
            <p className='text-sm text-gray-500'>
              Consecutive days with at least one session.
            </p>
          </Card>
        </div>

        <div className='mt-8'>
          <Card className='p-6 space-y-4'>
            <div>
              <h2 className='text-xl font-semibold'>Start New Session</h2>
              <p className='text-gray-600'>
                Ready to begin your meditation journey?
              </p>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Button onClick={() => router.push('/meditate')}>
                Let Guru Decide
              </Button>
              <Button
                variant='outline'
                onClick={() => router.push('/meditate#techniques')}
              >
                Pick Technique
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
