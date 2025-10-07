'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default function MarketingPage() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-white to-blue-50'>
      <div className='z-10 max-w-4xl w-full text-center space-y-8'>
        <div className='space-y-4'>
          <h1 className='text-4xl font-bold text-gray-900'>
            AI Guru Meditation
          </h1>
          <p className='text-lg text-gray-600'>
            A voice-first meditation guide that adapts to how you feel in the
            moment.
          </p>
        </div>

        <Card className='max-w-xl mx-auto space-y-4 p-8'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Explore the experience
          </h2>
          <p className='text-gray-600'>
            Jump straight into the meditation lobby to try the flow without
            signing in. You can enable authentication later when you are ready.
          </p>
          <Link
            href='/meditate'
            className='inline-flex w-full justify-center rounded-lg bg-blue-600 px-5 py-3 text-base font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
          >
            Start a Session
          </Link>
        </Card>
      </div>
    </div>
  );
}
