'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '../../components/ui';
import {
  chooseTechniqueForProfile,
  formatPattern,
  getTechniqueByKey,
  Goal,
  listTechniques,
  Mood,
  Technique,
  TechniqueKey,
} from '../../lib/techniques';
import { createSession } from '../../lib/sessions';

const moodOptions: { label: string; value: Mood; description: string }[] = [
  {
    label: 'Stressed',
    value: 'stressed',
    description: 'Mind racing, need grounding',
  },
  {
    label: 'Tired',
    value: 'tired',
    description: 'Low energy, craving warmth',
  },
  {
    label: 'Restless',
    value: 'restless',
    description: 'Fidgety or overstimulated',
  },
];

const goalOptions: { label: string; value: Goal; description: string }[] = [
  {
    label: 'Find Calm',
    value: 'calm',
    description: 'Settle nerves and create ease',
  },
  {
    label: 'Sleep Better',
    value: 'sleep',
    description: 'Wind down before rest',
  },
  {
    label: 'Sharpen Focus',
    value: 'focus',
    description: 'Prepare to dive into deep work',
  },
  {
    label: 'Open the Heart',
    value: 'self_love',
    description: 'Cultivate compassion and warmth',
  },
];

interface MeditateLobbyProps {
  techniques?: Technique[];
}

export default function MeditateLobby({ techniques }: MeditateLobbyProps) {
  const router = useRouter();
  const [mood, setMood] = useState<Mood>('stressed');
  const [goal, setGoal] = useState<Goal>('calm');
  const [techniqueKey, setTechniqueKey] = useState<TechniqueKey | ''>('');
  const [isGuruSelecting, setIsGuruSelecting] = useState(false);
  const [isUserStarting, setIsUserStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allTechniques = useMemo(
    () => techniques ?? listTechniques(),
    [techniques]
  );
  const selectedTechnique = useMemo(
    () => getTechniqueByKey(techniqueKey),
    [techniqueKey]
  );

  const handleGuruDecide = async () => {
    setIsGuruSelecting(true);
    setError(null);

    try {
      const technique = chooseTechniqueForProfile({ mood, goal });
      const session = await createSession({
        decidedBy: 'guru',
        techniqueKey: technique.key,
        goal,
      });
      const params = new URLSearchParams({
        technique: technique.key,
        decidedBy: 'guru',
      });
      if (goal) {
        params.set('goal', goal);
      }

      router.push(`/meditate/live/${session.id}?${params.toString()}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong while starting your session.';
      setError(message);
    } finally {
      setIsGuruSelecting(false);
    }
  };

  const handleTechniqueStart = async () => {
    if (!selectedTechnique) {
      setError('Please pick a technique to continue.');
      return;
    }

    setIsUserStarting(true);
    setError(null);

    try {
      const session = await createSession({
        decidedBy: 'user',
        techniqueKey: selectedTechnique.key,
        goal,
      });
      const params = new URLSearchParams({
        technique: selectedTechnique.key,
        decidedBy: 'user',
      });
      if (goal) {
        params.set('goal', goal);
      }

      router.push(`/meditate/live/${session.id}?${params.toString()}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to start the selected technique.';
      setError(message);
    } finally {
      setIsUserStarting(false);
    }
  };

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-8'>
      <header className='space-y-3 text-center'>
        <h1 className='text-3xl font-semibold text-white md:text-4xl'>
          Start a Meditation
        </h1>
        <p className='text-sm text-slate-100/70'>
          Choose how you would like to begin your next session.
        </p>
      </header>

      {error && (
        <div className='rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-rose-100 shadow-lg backdrop-blur-md'>
          {error}
        </div>
      )}

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card className='flex h-full flex-col justify-between space-y-6 p-6'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <h2 className='text-xl font-semibold text-white'>
                Let Guru Decide
              </h2>
              <p className='text-sm leading-relaxed text-slate-100/75'>
                Answer a quick check-in and let the AI Guru pick the right
                meditation technique for you.
              </p>
            </div>

            <div className='space-y-3'>
              <div>
                <p className='mb-2 text-sm font-semibold text-slate-100/85'>
                  How are you arriving?
                </p>
                <div className='grid gap-2 sm:grid-cols-3'>
                  {moodOptions.map(option => (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => setMood(option.value)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                        mood === option.value
                          ? 'border-sky-400/60 bg-sky-500/15 text-white shadow-lg shadow-sky-900/30'
                          : 'border-white/15 bg-white/5 text-slate-100/80 hover:border-sky-300/40 hover:bg-white/10'
                      }`}
                    >
                      <span className='block font-semibold tracking-wide'>
                        {option.label}
                      </span>
                      <span className='text-xs text-slate-100/65'>
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className='mb-2 text-sm font-semibold text-slate-100/85'>
                  What do you need most?
                </p>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {goalOptions.map(option => (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => setGoal(option.value)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                        goal === option.value
                          ? 'border-sky-400/60 bg-sky-500/15 text-white shadow-lg shadow-sky-900/30'
                          : 'border-white/15 bg-white/5 text-slate-100/80 hover:border-sky-300/40 hover:bg-white/10'
                      }`}
                    >
                      <span className='block font-semibold tracking-wide'>
                        {option.label}
                      </span>
                      <span className='text-xs text-slate-100/65'>
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleGuruDecide}
            disabled={isGuruSelecting}
            className='w-full'
          >
            {isGuruSelecting
              ? 'Finding the right technique…'
              : 'Let Guru Decide'}
          </Button>
        </Card>

        <Card className='space-y-4 p-6'>
          <div className='space-y-2'>
            <h2 className='text-xl font-semibold text-white'>
              Choose a Technique
            </h2>
            <p className='text-sm text-slate-100/75'>
              Prefer to pick something specific? Explore the catalogue.
            </p>
          </div>

          <div className='max-h-[420px] space-y-3 overflow-y-auto pr-1'>
            {allTechniques.map(technique => (
              <button
                key={technique.key}
                type='button'
                onClick={() => setTechniqueKey(technique.key)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  techniqueKey === technique.key
                    ? 'border-sky-400/60 bg-sky-500/15 text-white shadow-lg shadow-sky-900/30'
                    : 'border-white/15 bg-white/5 text-slate-100/80 hover:border-sky-300/40 hover:bg-white/10'
                }`}
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='space-y-1'>
                    <h3 className='text-base font-semibold text-white'>
                      {technique.name}
                    </h3>
                    <p className='text-sm text-slate-100/70'>
                      {technique.description}
                    </p>
                  </div>
                  <span className='text-xs font-medium uppercase tracking-[0.3em] text-slate-100/60'>
                    {technique.defaultDurationMinutes} min
                  </span>
                </div>
                <div className='mt-3 space-y-2'>
                  <p className='text-xs uppercase tracking-[0.3em] text-slate-100/65'>
                    {formatPattern(technique.pattern)}
                  </p>
                  <ul className='list-disc space-y-1 pl-4 text-xs text-slate-100/65'>
                    {technique.benefits.map(benefit => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </button>
            ))}
          </div>

          <Button
            variant='outline'
            onClick={handleTechniqueStart}
            disabled={isUserStarting}
            className='w-full'
          >
            {isUserStarting ? 'Launching session…' : 'Start Selected Technique'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
