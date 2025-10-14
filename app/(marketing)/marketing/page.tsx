import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default function MarketingPage() {
  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col items-center gap-10 text-center'>
      <div className='space-y-4'>
        <h1 className='text-4xl font-semibold text-white md:text-5xl'>
          AI Guru Meditation
        </h1>
        <p className='text-lg text-slate-100/75'>
          A voice-first meditation guide that adapts to how you feel in the
          moment.
        </p>
      </div>

      <Card className='mx-auto max-w-xl space-y-4 p-8'>
        <h2 className='text-xl font-semibold text-white'>
          Explore the experience
        </h2>
        <p className='text-slate-100/75'>
          Jump straight into the meditation lobby to try the flow without
          signing in. You can enable authentication later when you are ready.
        </p>
        <Link
          href='/meditate'
          className='inline-flex w-full justify-center rounded-2xl bg-sky-500/90 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-400/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200/60'
        >
          Start a Session
        </Link>
      </Card>
    </div>
  );
}
