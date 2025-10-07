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
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto space-y-8'>
        <header className='text-center space-y-2'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Start a Meditation
          </h1>
          <p className='text-gray-600'>
            Choose how you would like to begin your next session.
          </p>
        </header>

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
            {error}
          </div>
        )}

        <div className='grid gap-6 lg:grid-cols-2'>
          <Card className='flex flex-col h-full justify-between space-y-4 p-6'>
            <div className='space-y-4'>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>
                  Let Guru Decide
                </h2>
                <p className='text-gray-600'>
                  Answer a quick check-in and let the AI Guru pick the right
                  meditation technique for you.
                </p>
              </div>

              <div className='space-y-3'>
                <div>
                  <p className='text-sm font-medium text-gray-700 mb-2'>
                    How are you arriving?
                  </p>
                  <div className='grid sm:grid-cols-3 gap-2'>
                    {moodOptions.map(option => (
                      <button
                        key={option.value}
                        type='button'
                        onClick={() => setMood(option.value)}
                        className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                          mood === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <span className='font-semibold block'>
                          {option.label}
                        </span>
                        <span className='text-xs text-gray-600'>
                          {option.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className='text-sm font-medium text-gray-700 mb-2'>
                    What do you need most?
                  </p>
                  <div className='grid sm:grid-cols-2 gap-2'>
                    {goalOptions.map(option => (
                      <button
                        key={option.value}
                        type='button'
                        onClick={() => setGoal(option.value)}
                        className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                          goal === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <span className='font-semibold block'>
                          {option.label}
                        </span>
                        <span className='text-xs text-gray-600'>
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

          <Card className='p-6 space-y-4'>
            <div>
              <h2 className='text-xl font-semibold text-gray-900'>
                Choose a Technique
              </h2>
              <p className='text-gray-600'>
                Prefer to pick something specific? Explore the catalogue.
              </p>
            </div>

            <div className='space-y-3 max-h-[420px] overflow-y-auto pr-1'>
              {allTechniques.map(technique => (
                <button
                  key={technique.key}
                  type='button'
                  onClick={() => setTechniqueKey(technique.key)}
                  className={`w-full text-left rounded-lg border p-4 transition-colors ${
                    techniqueKey === technique.key
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <h3 className='font-semibold text-base'>
                        {technique.name}
                      </h3>
                      <p className='text-sm text-gray-600'>
                        {technique.description}
                      </p>
                    </div>
                    <span className='text-xs font-medium text-gray-500'>
                      {technique.defaultDurationMinutes} min
                    </span>
                  </div>
                  <div className='mt-3 space-y-2'>
                    <p className='text-xs text-gray-700'>
                      {formatPattern(technique.pattern)}
                    </p>
                    <ul className='text-xs text-gray-600 space-y-1 list-disc pl-4'>
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
              {isUserStarting
                ? 'Launching session…'
                : 'Start Selected Technique'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
