import React from 'react';
import { Card } from '../../../../components/ui';

interface LiveSessionPageProps {
  params: {
    sessionId: string;
  };
}

export default function LiveSessionPage({ params }: LiveSessionPageProps) {
  const { sessionId } = params;

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-3xl mx-auto space-y-6'>
        <header className='space-y-2 text-center'>
          <h1 className='text-3xl font-bold text-gray-900'>Live Session</h1>
          <p className='text-gray-600'>
            Placeholder view for session{' '}
            <span className='font-mono'>{sessionId}</span>
          </p>
        </header>

        <Card className='text-center text-gray-600'>
          <p>
            This page will host the real-time meditation experience. For now it
            simply confirms the active session ID.
          </p>
        </Card>
      </div>
    </div>
  );
}
