'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Card, Button } from '../../../../components/ui';
import {
  logSessionReflection,
  recordSessionEvent,
  setSessionStatus,
  SessionStatus,
} from '../../../../lib/sessions';
import { formatPattern, Technique } from '../../../../lib/techniques';

interface LiveSessionViewProps {
  sessionId: string;
  technique: Technique | null;
  decidedBy: 'guru' | 'user';
  goal: string | null;
  startedAt: string | null;
  initialStatus: SessionStatus;
  loadError: string | null;
}

type WebAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContextConstructor() {
  if (typeof window === 'undefined') {
    return null;
  }

  const audioWindow = window as WebAudioWindow;

  return audioWindow.AudioContext || audioWindow.webkitAudioContext || null;
}

type FeedbackState = {
  type: 'success' | 'error' | 'info';
  message: string;
};

const reflectionMoodOptions = [
  { value: 'calm', label: 'Calm & grounded' },
  { value: 'light', label: 'Softer but still a little tense' },
  { value: 'sleepy', label: 'Sleepy and ready to rest' },
  { value: 'focused', label: 'Focused and energised' },
];

function statusLabel(status: SessionStatus) {
  return status
    .replace(/_/g, ' ')
    .replace(/^(.)/, match => match.toUpperCase());
}

export default function LiveSessionView({
  sessionId,
  technique,
  decidedBy,
  goal,
  startedAt,
  initialStatus,
  loadError,
}: LiveSessionViewProps) {
  const [status, setStatus] = useState<SessionStatus>(initialStatus);
  const [isPaused, setIsPaused] = useState(false);
  const [isTogglingPause, setIsTogglingPause] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [reflectionMood, setReflectionMood] = useState('calm');
  const [clarityScore, setClarityScore] = useState(3);
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isSoundscapeEnabled, setIsSoundscapeEnabled] = useState(false);
  const [isSoundscapeLoading, setIsSoundscapeLoading] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const startedAtLabel = useMemo(() => {
    if (!startedAt) {
      return null;
    }

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(startedAt));
  }, [startedAt]);

  const startedAtDate = useMemo(() => {
    if (!startedAt) {
      return null;
    }

    return new Date(startedAt);
  }, [startedAt]);

  const isActive = status === 'live';

  useEffect(() => {
    if (!startedAtDate) {
      return;
    }

    setCurrentTime(new Date());
  }, [startedAtDate]);

  useEffect(() => {
    if (!startedAtDate || !isActive || isPaused) {
      return;
    }

    setCurrentTime(new Date());

    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isActive, isPaused, startedAtDate]);

  const elapsedSeconds = useMemo(() => {
    if (!startedAtDate) {
      return null;
    }

    const difference = Math.floor(
      (currentTime.getTime() - startedAtDate.getTime()) / 1000
    );

    return Math.max(0, difference);
  }, [currentTime, startedAtDate]);

  const formattedElapsedTime = useMemo(() => {
    if (elapsedSeconds === null) {
      return null;
    }

    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    const segments = [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(hours > 0 ? minutes : Math.max(minutes, 0)).padStart(2, '0'),
      String(seconds).padStart(2, '0'),
    ].filter(Boolean);

    return segments.join(' : ');
  }, [elapsedSeconds]);

  const timerStatusLabel = useMemo(() => {
    if (!isActive) {
      return statusLabel(status);
    }

    return isPaused ? 'Paused' : 'Live';
  }, [isActive, isPaused, status]);

  const timerStatusDetail = useMemo(() => {
    if (!isActive) {
      return 'This session is not currently running.';
    }

    return isPaused
      ? 'Take a breath. Your timer will resume when you do.'
      : 'Stay with the flow of your breath while the timer gently tracks your practice.';
  }, [isActive, isPaused]);

  const ambientParticles = useMemo(
    () => [
      {
        top: '12%',
        left: '16%',
        size: '0.85rem',
        duration: '18s',
        delay: '0s',
      },
      {
        top: '28%',
        left: '68%',
        size: '1.1rem',
        duration: '24s',
        delay: '1.5s',
      },
      { top: '72%', left: '22%', size: '0.7rem', duration: '20s', delay: '3s' },
      {
        top: '58%',
        left: '78%',
        size: '0.9rem',
        duration: '26s',
        delay: '2.5s',
      },
      {
        top: '42%',
        left: '36%',
        size: '0.6rem',
        duration: '22s',
        delay: '4.5s',
      },
      {
        top: '18%',
        left: '82%',
        size: '0.75rem',
        duration: '19s',
        delay: '6s',
      },
      {
        top: '66%',
        left: '48%',
        size: '0.95rem',
        duration: '25s',
        delay: '5s',
      },
      {
        top: '34%',
        left: '8%',
        size: '0.65rem',
        duration: '21s',
        delay: '7.5s',
      },
    ],
    []
  );

  const decidedByLabel = decidedBy === 'user' ? 'You' : 'Guru';
  const reflectionButtonLabel =
    status === 'completed' ? 'Update Reflection' : 'Log Reflection';

  const handleTogglePause = async () => {
    if (!isActive) {
      return;
    }

    setFeedback(null);
    setIsTogglingPause(true);

    try {
      await recordSessionEvent(sessionId, {
        kind: isPaused ? 'resume' : 'pause',
        payload: { toggled_at: new Date().toISOString() },
      });

      setIsPaused(current => !current);
      setFeedback({
        type: 'success',
        message: isPaused
          ? 'Session resumed. Welcome back.'
          : 'Session paused. Take a breath and resume when ready.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'We could not update the session state. Please try again.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsTogglingPause(false);
    }
  };

  const handleEndSession = async () => {
    if (!isActive) {
      return;
    }

    setFeedback(null);
    setIsEnding(true);

    try {
      await setSessionStatus(sessionId, 'abandoned');
      await recordSessionEvent(sessionId, {
        kind: 'abandoned',
        payload: { recorded_at: new Date().toISOString() },
      });
      setStatus('abandoned');
      setIsPaused(false);
      setFeedback({
        type: 'info',
        message:
          'Session marked as ended. You can start a fresh practice anytime.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'We could not end the session. Please try again.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsEnding(false);
    }
  };

  const handleReflectionToggle = () => {
    if (status === 'abandoned') {
      return;
    }

    setFeedback(null);
    setShowReflectionForm(current => !current);
  };

  const handleReflectionSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsSavingReflection(true);
    setFeedback(null);

    try {
      await logSessionReflection(sessionId, {
        mood: reflectionMood,
        clarity: clarityScore,
        notes: reflectionNotes.trim(),
      });

      setStatus('completed');
      setIsPaused(false);
      setShowReflectionForm(false);
      setFeedback({
        type: 'success',
        message: 'Reflection saved. Beautiful work today.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'We could not save your reflection. Please try again.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsSavingReflection(false);
    }
  };

  const stopSoundscape = useCallback(() => {
    const audioContext = audioContextRef.current;
    const oscillator = oscillatorRef.current;
    const gainNode = gainRef.current;

    if (!audioContext || !gainNode) {
      return;
    }

    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value || 0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    window.setTimeout(() => {
      oscillator?.stop();
      oscillator?.disconnect();
      gainNode.disconnect();
      oscillatorRef.current = null;
      gainRef.current = null;
    }, 1600);
  }, []);

  const handleSoundscapeToggle = useCallback(async () => {
    if (isSoundscapeEnabled) {
      stopSoundscape();
      setIsSoundscapeEnabled(false);
      setFeedback({
        type: 'info',
        message: 'The soundscape will fade out over the next breath.',
      });
      return;
    }

    if (!isActive || isPaused) {
      setFeedback({
        type: 'info',
        message: 'Resume the live session to enable the immersive soundscape.',
      });
      return;
    }

    setIsSoundscapeLoading(true);

    try {
      if (typeof window === 'undefined') {
        throw new Error('Sound is only available in the browser.');
      }

      if (!audioContextRef.current) {
        const AudioContextConstructor = getAudioContextConstructor();

        if (!AudioContextConstructor) {
          throw new Error(
            'Your browser does not support immersive audio playback.'
          );
        }

        audioContextRef.current = new AudioContextConstructor();
      }

      const audioContext = audioContextRef.current;

      if (!audioContext) {
        throw new Error('We could not initialise the audio engine.');
      }

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 174;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.0001;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();

      gainNode.gain.cancelScheduledValues(audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.08,
        audioContext.currentTime + 2
      );

      oscillatorRef.current = oscillator;
      gainRef.current = gainNode;

      setIsSoundscapeEnabled(true);
      setFeedback({
        type: 'success',
        message: 'Immersive soundscape engaged. Let the tone guide your focus.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'We could not start the soundscape. Please try again.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsSoundscapeLoading(false);
    }
  }, [isActive, isPaused, isSoundscapeEnabled, setFeedback, stopSoundscape]);

  useEffect(() => {
    if (!isActive || isPaused) {
      if (isSoundscapeEnabled) {
        stopSoundscape();
        setIsSoundscapeEnabled(false);
      }
    }
  }, [isActive, isPaused, isSoundscapeEnabled, stopSoundscape]);

  useEffect(() => {
    return () => {
      stopSoundscape();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, [stopSoundscape]);

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
          {loadError && <p className='text-xs text-red-500'>{loadError}</p>}
          <p className='text-sm text-gray-500'>
            Status: {statusLabel(status)}
            {isPaused ? ' · Paused' : ''}
          </p>
          {technique && (
            <p className='text-gray-500 text-sm'>
              {decidedByLabel} selected{' '}
              <span className='font-semibold'>{technique.name}</span> to guide
              this practice.
            </p>
          )}
          {goal && (
            <p className='text-xs text-gray-400'>
              Goal for this session: {goal}
            </p>
          )}
          {startedAtLabel && (
            <p className='text-xs text-gray-400'>Started {startedAtLabel}</p>
          )}
        </header>

        {formattedElapsedTime && (
          <section className='rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-[1px] shadow-lg'>
            <div className='meditation-visual'>
              <div className='meditation-visual__gradient' aria-hidden='true' />
              <div
                className='meditation-visual__orb meditation-visual__orb--primary'
                aria-hidden='true'
              />
              <div
                className='meditation-visual__orb meditation-visual__orb--secondary'
                aria-hidden='true'
              />
              <div className='meditation-visual__particles' aria-hidden='true'>
                {ambientParticles.map((particle, index) => (
                  <span
                    key={`particle-${index}`}
                    className='meditation-visual__particle'
                    style={{
                      top: particle.top,
                      left: particle.left,
                      width: particle.size,
                      height: particle.size,
                      animationDuration: particle.duration,
                      animationDelay: particle.delay,
                    }}
                  />
                ))}
              </div>

              <div className='meditation-visual__content'>
                <p className='text-xs font-semibold uppercase tracking-[0.35em] text-blue-100/80'>
                  Session Timer
                </p>
                <p className='text-5xl font-bold text-white md:text-6xl'>
                  {formattedElapsedTime}
                </p>
                <p className='max-w-md text-sm text-blue-100/80'>
                  {timerStatusLabel}
                </p>
                <p className='max-w-md text-sm text-blue-100/60'>
                  {timerStatusDetail}
                </p>
                <div className='mt-4 flex flex-wrap items-center gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleSoundscapeToggle}
                    disabled={isSoundscapeLoading}
                    className='border-white/30 bg-white/10 text-white hover:bg-white/20 focus:ring-white/30'
                  >
                    {isSoundscapeEnabled
                      ? 'Soundscape On'
                      : isSoundscapeLoading
                        ? 'Starting…'
                        : 'Play Soundscape'}
                  </Button>
                  <span className='text-xs text-blue-100/70'>
                    {isSoundscapeEnabled
                      ? 'Soft harmonic tones are playing to anchor your focus.'
                      : 'Activate a gentle harmonic tone to accompany your breath.'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {feedback && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : feedback.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-blue-200 bg-blue-50 text-blue-700'
            }`}
          >
            <div className='flex items-start justify-between gap-4'>
              <span>{feedback.message}</span>
              <button
                type='button'
                onClick={() => setFeedback(null)}
                className='text-xs font-semibold uppercase tracking-wide'
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

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
              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleTogglePause}
                  disabled={!isActive || isTogglingPause}
                >
                  {isPaused
                    ? isTogglingPause
                      ? 'Resuming…'
                      : 'Resume'
                    : isTogglingPause
                      ? 'Pausing…'
                      : 'Pause'}
                </Button>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={handleEndSession}
                  disabled={!isActive || isEnding}
                >
                  {isEnding ? 'Ending…' : 'End Session'}
                </Button>
                <Button
                  type='button'
                  onClick={handleReflectionToggle}
                  disabled={status === 'abandoned'}
                >
                  {showReflectionForm
                    ? 'Hide Reflection'
                    : reflectionButtonLabel}
                </Button>
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

        {showReflectionForm && (
          <Card className='p-6 space-y-4'>
            <form onSubmit={handleReflectionSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  How do you feel now?
                </label>
                <select
                  value={reflectionMood}
                  onChange={event => setReflectionMood(event.target.value)}
                  className='block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                >
                  {reflectionMoodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  How clear is your mind?
                </label>
                <select
                  value={clarityScore}
                  onChange={event =>
                    setClarityScore(Number(event.target.value))
                  }
                  className='block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                >
                  {Array.from({ length: 5 }, (_, index) => index + 1).map(
                    value => (
                      <option key={value} value={value}>
                        {value} —{' '}
                        {value === 1
                          ? 'Cloudy'
                          : value === 5
                            ? 'Crystal clear'
                            : 'Finding balance'}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Reflection notes
                </label>
                <textarea
                  value={reflectionNotes}
                  onChange={event => setReflectionNotes(event.target.value)}
                  rows={4}
                  className='block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  placeholder='Capture any insights, shifts, or reminders you want to keep.'
                  required
                />
              </div>

              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowReflectionForm(false)}
                  disabled={isSavingReflection}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isSavingReflection}>
                  {isSavingReflection ? 'Saving…' : 'Save Reflection'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
