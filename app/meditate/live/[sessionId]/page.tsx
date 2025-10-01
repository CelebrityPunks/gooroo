import React from 'react';
import { Card, Button } from '../../../../components/ui';
import { formatPattern, getTechniqueByKey } from '../../../../lib/techniques';

interface LiveSessionPageProps {
  params: {
    sessionId: string;
  };
  searchParams?: {
    technique?: string;
    decidedBy?: string;
  };
}

export default function LiveSessionPage({
  params,
  searchParams,
}: LiveSessionPageProps) {
  const { sessionId } = params;
  const technique = getTechniqueByKey(searchParams?.technique);
  const decidedBy = searchParams?.decidedBy === 'user' ? 'You' : 'Guru';

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto space-y-6'>
        <header className='space-y-2 text-center'>
          <h1 className='text-3xl font-bold text-gray-900'>Live Session</h1>
          <p className='text-gray-600'>
            Session ID{' '}
            <span className='font-mono text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded'>
              {sessionId}
            </span>
          </p>
          {technique && (
            <p className='text-gray-500 text-sm'>
              {decidedBy} selected{' '}
              <span className='font-semibold'>{technique.name}</span> to guide
              this practice.
            </p>
          )}
        </header>

        {technique ? (
          <Card className='space-y-4 p-6'>
            <div className='space-y-1'>
              <h2 className='text-2xl font-semibold text-gray-900'>
                {technique.name}
              </h2>
              <p className='text-gray-600'>{technique.description}</p>
              <p className='text-sm uppercase tracking-wide text-blue-600'>
                Pattern: {formatPattern(technique.pattern)} ·{' '}
                {technique.defaultDurationMinutes} min
              </p>
            </div>

            <div className='grid gap-3 md:grid-cols-2'>
              <Card className='border-blue-100 bg-blue-50 p-4'>
                <h3 className='text-sm font-semibold text-blue-900 uppercase tracking-wide'>
                  Intention
                </h3>
                <p className='text-blue-900 mt-1'>{technique.intention}</p>
              </Card>

              <Card className='border-green-100 bg-green-50 p-4'>
                <h3 className='text-sm font-semibold text-green-900 uppercase tracking-wide'>
                  Benefits
                </h3>
                <ul className='mt-1 list-disc space-y-1 pl-4 text-green-900'>
                  {technique.benefits.map(benefit => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className='space-y-2'>
              <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
                Guidance cues
              </h3>
              <ul className='list-disc space-y-1 pl-5 text-gray-700'>
                {technique.cues.map(cue => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            </div>

            <div className='flex flex-col gap-2 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between'>
              <p className='text-sm text-gray-600'>
                Stay present with the breath. When you are ready to wrap up, log
                a reflection to save this session.
              </p>
              <div className='flex gap-2'>
                <Button type='button' variant='outline'>
                  Pause
                </Button>
                <Button type='button'>Log Reflection</Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className='p-6 text-center text-gray-600'>
            <p>
              This session is ready, but a technique was not provided. Head back
              to{' '}
              <a href='/meditate' className='text-blue-600 hover:underline'>
                the meditation lobby
              </a>{' '}
              to choose one.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
