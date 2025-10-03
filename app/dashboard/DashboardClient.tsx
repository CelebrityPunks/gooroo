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
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-5xl mx-auto'>
        <header className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
            <p className='text-sm text-gray-600'>
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

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card>
            <h2 className='text-lg font-semibold text-gray-900 mb-2'>
              Recent Sessions
            </h2>
            {sessions.length === 0 ? (
              <p className='text-gray-600 text-sm'>No sessions yet</p>
            ) : (
              <ul className='space-y-4 text-sm text-gray-700'>
                {sessions.slice(0, 5).map(session => {
                  const technique = getTechniqueByKey(session.techniqueKey);
                  return (
                    <li key={session.id} className='flex justify-between gap-3'>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {technique?.name ?? 'Unknown Technique'}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {session.goal
                            ? `Goal: ${session.goal}`
                            : 'No goal specified'}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {formatDate(session.startedAt)}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full h-fit ${
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : session.status === 'live'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {session.status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className='text-lg font-semibold text-gray-900 mb-2'>
              Total Minutes
            </h2>
            <p className='text-3xl font-bold text-blue-600'>{totalMinutes}</p>
            <p className='text-xs text-gray-500'>
              Across all recorded sessions
            </p>
          </Card>

          <Card>
            <h2 className='text-lg font-semibold text-gray-900 mb-2'>
              Current Streak
            </h2>
            <p className='text-3xl font-bold text-green-600'>{streak} days</p>
            <p className='text-xs text-gray-500'>
              Consecutive days with a completed session
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
