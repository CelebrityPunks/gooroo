'use client';

import { useMemo } from 'react';
import { Button, Card } from '../../components/ui';
import { useAuth } from '../../components/auth/AuthProvider';
import { getTechniqueByKey } from '../../lib/techniques';
import { SessionRecord } from '../../lib/sessions';

interface DashboardClientProps {
  userEmail: string | null;
  sessions: SessionRecord[];
}

function computeDurationMinutes(session: SessionRecord): number {
  const start = new Date(session.startedAt).getTime();
  const end = session.endedAt ? new Date(session.endedAt).getTime() : start;
  const diffMinutes = Math.max(0, Math.round((end - start) / 60000));
  return diffMinutes;
}

function computeTotalMinutes(sessions: SessionRecord[]): number {
  return sessions.reduce(
    (sum, session) => sum + computeDurationMinutes(session),
    0
  );
}

function computeCurrentStreak(sessions: SessionRecord[]): number {
  const completedDays = new Set(
    sessions
      .filter(session => session.status === 'completed')
      .map(session => new Date(session.startedAt).toISOString().slice(0, 10))
  );

  if (completedDays.size === 0) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();

  for (
    let key = cursor.toISOString().slice(0, 10);
    completedDays.has(key);
    cursor.setDate(cursor.getDate() - 1),
      key = cursor.toISOString().slice(0, 10)
  ) {
    streak += 1;
  }

  return streak;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function DashboardClient({
  userEmail,
  sessions,
}: DashboardClientProps) {
  const { user, signOut } = useAuth();
  const displayEmail = user?.email ?? userEmail ?? '';

  const totalMinutes = useMemo(() => computeTotalMinutes(sessions), [sessions]);
  const streak = useMemo(() => computeCurrentStreak(sessions), [sessions]);

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-8'>
      <header className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-semibold text-white md:text-4xl'>
            Dashboard
          </h1>
          <p className='text-sm text-slate-100/70'>
            Welcome back, {displayEmail}
          </p>
        </div>
        <Button
          variant='outline'
          onClick={signOut}
          className='self-start md:self-auto'
        >
          Sign Out
        </Button>
      </header>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <Card className='space-y-4'>
          <div>
            <h2 className='mb-2 text-lg font-semibold text-white'>
              Recent Sessions
            </h2>
            {sessions.length === 0 ? (
              <p className='text-sm text-slate-100/70'>No sessions yet</p>
            ) : (
              <ul className='space-y-4 text-sm text-slate-100/80'>
                {sessions.slice(0, 5).map(session => {
                  const technique = getTechniqueByKey(session.techniqueKey);
                  return (
                    <li
                      key={session.id}
                      className='flex items-start justify-between gap-3'
                    >
                      <div className='space-y-1'>
                        <p className='font-medium text-white'>
                          {technique?.name ?? 'Unknown Technique'}
                        </p>
                        <p className='text-xs text-slate-100/65'>
                          {session.goal
                            ? `Goal: ${session.goal}`
                            : 'No goal specified'}
                        </p>
                        <p className='text-xs text-slate-100/60'>
                          {formatDate(session.startedAt)}
                        </p>
                      </div>
                      <span
                        className={`h-fit rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                          session.status === 'completed'
                            ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                            : session.status === 'live'
                              ? 'border-sky-400/40 bg-sky-500/10 text-sky-100'
                              : 'border-amber-400/40 bg-amber-500/10 text-amber-100'
                        }`}
                      >
                        {session.status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card className='space-y-2'>
          <h2 className='text-lg font-semibold text-white'>Total Minutes</h2>
          <p className='text-3xl font-bold text-sky-300'>{totalMinutes}</p>
          <p className='text-xs text-slate-100/65'>
            Across all recorded sessions
          </p>
        </Card>

        <Card className='space-y-2'>
          <h2 className='text-lg font-semibold text-white'>Current Streak</h2>
          <p className='text-3xl font-bold text-emerald-300'>{streak} days</p>
          <p className='text-xs text-slate-100/65'>
            Consecutive days with a completed session
          </p>
        </Card>
      </div>
    </div>
  );
}
