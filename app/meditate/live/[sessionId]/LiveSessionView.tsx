'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '../../../../components/ui';
import {
  logSessionReflection,
  recordSessionEvent,
  setSessionStatus,
  SessionStatus,
} from '../../../../lib/sessions';
import { formatPattern, Technique } from '../../../../lib/techniques';
import BreathGuide from './BreathGuide';
import { useIntroVoice } from './useIntroVoice';

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
  AudioContext?: typeof AudioContext;
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
  goal,
  startedAt,
  initialStatus,
  loadError,
}: LiveSessionViewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus>(initialStatus);
  const [hasGuidanceStarted, setHasGuidanceStarted] = useState(
    initialStatus !== 'live'
  );
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
  const [isVoiceGuideEnabled, setIsVoiceGuideEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const {
    isIntroPlaying,
    introNeedsUserInteraction,
    manualIntroPlay,
    playIntro,
    cancelIntro,
    resetIntroState,
  } = useIntroVoice({
    technique,
    isVoiceGuideEnabled,
    initiallyCompleted: initialStatus !== 'live',
  });

  const [timerStartedAt, setTimerStartedAt] = useState<Date | null>(() => {
    if (initialStatus !== 'live' && startedAt) {
      return new Date(startedAt);
    }

    return null;
  });

  const startedAtLabel = useMemo(() => {
    if (!timerStartedAt) {
      return null;
    }

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(timerStartedAt);
  }, [timerStartedAt]);

  const isSessionLive = status === 'live';
  const isGuidanceLive = isSessionLive && hasGuidanceStarted;

  useEffect(() => {
    if (!timerStartedAt) {
      return;
    }

    setCurrentTime(new Date());
  }, [timerStartedAt]);

  useEffect(() => {
    if (!timerStartedAt || !isGuidanceLive || isPaused) {
      return;
    }

    setCurrentTime(new Date());

    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isGuidanceLive, isPaused, timerStartedAt]);

  const elapsedSeconds = useMemo(() => {
    if (!timerStartedAt || !isGuidanceLive) {
      return null;
    }

    const difference = Math.floor(
      (currentTime.getTime() - timerStartedAt.getTime()) / 1000
    );

    return Math.max(0, difference);
  }, [currentTime, isGuidanceLive, timerStartedAt]);

  const formattedElapsedTime = useMemo(() => {
    if (elapsedSeconds === null) {
      return '00 : 00';
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
    if (!isSessionLive) {
      return statusLabel(status);
    }

    if (!hasGuidanceStarted) {
      return 'Ready';
    }

    return isPaused ? 'Paused' : 'Live';
  }, [hasGuidanceStarted, isPaused, isSessionLive, status]);

  const timerStatusDetail = useMemo(() => {
    if (!isSessionLive) {
      return 'This session is not currently running.';
    }

    if (!hasGuidanceStarted) {
      return 'Settle in. Press start when you feel ready to begin the guided breath.';
    }

    return isPaused
      ? 'Take a breath. Your timer will resume when you do.'
      : 'Stay with the flow of your breath while the timer gently tracks your practice.';
  }, [hasGuidanceStarted, isPaused, isSessionLive]);

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

  const reflectionButtonLabel =
    status === 'completed' ? 'Update Reflection' : 'Log Reflection';

  const handleTogglePause = async () => {
    if (!isGuidanceLive) {
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
    if (!isSessionLive) {
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
      setHasGuidanceStarted(false);
      setFeedback({
        type: 'info',
        message:
          'Session marked as ended. You can start a fresh practice anytime.',
      });
      router.push('/meditate');
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

  const handleStartGuidance = useCallback(async () => {
    if (!isSessionLive || hasGuidanceStarted) {
      return;
    }

    resetIntroState({ markCompleted: true, played: true });
    setHasGuidanceStarted(true);
    setIsPaused(false);
    setTimerStartedAt(new Date());

    try {
      await recordSessionEvent(sessionId, {
        kind: 'started',
        payload: {
          started_at: new Date().toISOString(),
          technique: technique?.name ?? null,
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to log start event', error);
    }
  }, [
    hasGuidanceStarted,
    isSessionLive,
    resetIntroState,
    sessionId,
    technique,
  ]);

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
      setHasGuidanceStarted(false);
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

    if (!isGuidanceLive || isPaused) {
      setFeedback({
        type: 'info',
        message: hasGuidanceStarted
          ? 'Resume the live session to enable the immersive soundscape.'
          : 'Start the session to enable the immersive soundscape.',
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
  }, [
    hasGuidanceStarted,
    isGuidanceLive,
    isPaused,
    isSoundscapeEnabled,
    setFeedback,
    stopSoundscape,
  ]);

  useEffect(() => {
    if (!isGuidanceLive || isPaused) {
      if (isSoundscapeEnabled) {
        stopSoundscape();
        setIsSoundscapeEnabled(false);
      }
    }
  }, [isGuidanceLive, isPaused, isSoundscapeEnabled, stopSoundscape]);

  useEffect(() => {
    return () => {
      stopSoundscape();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, [stopSoundscape]);

  const handleVoiceGuideToggle = useCallback(() => {
    resetIntroState();
    setIsVoiceGuideEnabled(previous => !previous);
    setFeedback({
      type: 'info',
      message: !isVoiceGuideEnabled
        ? 'Voice guidance resumed. A calming narration will accompany each breath.'
        : 'Voice guidance muted. Continue following the visual cue at your own pace.',
    });
  }, [isVoiceGuideEnabled, resetIntroState]);

  useEffect(() => {
    if (!isSessionLive || hasGuidanceStarted || !isVoiceGuideEnabled) {
      return;
    }

    void playIntro();
  }, [hasGuidanceStarted, isSessionLive, isVoiceGuideEnabled, playIntro]);

  useEffect(() => {
    return () => {
      cancelIntro();
    };
  }, [cancelIntro]);

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-6'>
      <header className='space-y-3 text-center'>
        <h1 className='text-3xl font-semibold text-white md:text-4xl'>
          {technique?.name ?? 'Meditation Session'}
        </h1>
        {loadError && (
          <p className='text-xs font-semibold text-rose-300'>{loadError}</p>
        )}
        {goal && (
          <p className='text-sm uppercase tracking-[0.35em] text-blue-100/70'>
            Goal: {goal}
          </p>
        )}
        {startedAtLabel && (
          <p className='text-sm text-blue-100/60'>Started {startedAtLabel}</p>
        )}
      </header>

      {formattedElapsedTime && (
        <section className='rounded-3xl border border-white/20 bg-gradient-to-br from-blue-900/80 via-indigo-900/80 to-slate-900/80 p-[1px] shadow-2xl'>
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
              <div className='mt-4 space-y-3 text-left'>
                {!hasGuidanceStarted && isSessionLive && (
                  <div className='flex flex-col gap-2'>
                    <div className='flex flex-wrap items-center gap-3'>
                      <Button
                        type='button'
                        onClick={handleStartGuidance}
                        className='bg-white text-slate-900 hover:bg-slate-100 focus:ring-white/60'
                        disabled={isIntroPlaying || introNeedsUserInteraction}
                      >
                        {isIntroPlaying ? 'Preparing…' : 'Start Session'}
                      </Button>
                      <span className='text-xs text-blue-100/70'>
                        {isIntroPlaying
                          ? 'Your guide is introducing the practice—start when you are ready.'
                          : introNeedsUserInteraction
                            ? 'Tap “Play Introduction” so your guide can begin before you start the session.'
                            : 'Press start to begin the timed guidance and breathing cues.'}
                      </span>
                    </div>
                    {introNeedsUserInteraction && manualIntroPlay && (
                      <div className='flex flex-wrap items-center gap-3 pl-1'>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => {
                            void manualIntroPlay?.();
                          }}
                          className='border-white/30 bg-white/10 text-white hover:bg-white/20 focus:ring-white/30'
                        >
                          Play Introduction
                        </Button>
                        <span className='text-xs text-blue-100/70'>
                          Autoplay was blocked. Start the narration here, then
                          press “Start Session”.
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className='flex flex-wrap items-center gap-3'>
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
                <div className='flex flex-wrap items-center gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleVoiceGuideToggle}
                    className={`border-white/30 bg-white/10 text-white hover:bg-white/20 focus:ring-white/30 ${
                      isVoiceGuideEnabled ? '' : 'opacity-80'
                    }`}
                  >
                    {isVoiceGuideEnabled ? 'Voice Guide On' : 'Voice Guide Off'}
                  </Button>
                  <span className='text-xs text-blue-100/70'>
                    {isVoiceGuideEnabled
                      ? 'A calm narration will guide each inhale, hold, and exhale.'
                      : 'Voice guidance muted—follow the visual cues at your own pace.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {technique && (
        <BreathGuide
          pattern={technique.pattern}
          techniqueName={technique.name}
          techniqueDescription={technique.description}
          techniqueIntention={technique.intention}
          isActive={isGuidanceLive}
          isPaused={isPaused}
          isVoiceGuideEnabled={isVoiceGuideEnabled}
        />
      )}

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md ${
            feedback.type === 'success'
              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
              : feedback.type === 'error'
                ? 'border-rose-400/40 bg-rose-500/10 text-rose-100'
                : 'border-sky-400/40 bg-sky-500/10 text-sky-100'
          }`}
        >
          <div className='flex items-start justify-between gap-4'>
            <span className='leading-relaxed'>{feedback.message}</span>
            <button
              type='button'
              onClick={() => setFeedback(null)}
              className='text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:text-white'
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {technique ? (
        <Card className='space-y-6 p-6'>
          <div className='space-y-2'>
            <h2 className='text-2xl font-semibold text-white'>
              {technique.name}
            </h2>
            <p className='text-sm leading-relaxed text-slate-100/80'>
              {technique.description}
            </p>
            <p className='text-xs uppercase tracking-[0.35em] text-blue-200/80'>
              Pattern: {formatPattern(technique.pattern)} ·{' '}
              {technique.defaultDurationMinutes} min
            </p>
          </div>

          <div className='grid gap-3 md:grid-cols-2'>
            <Card className='border-sky-400/40 bg-sky-500/10 p-4 text-sky-100'>
              <h3 className='text-xs font-semibold uppercase tracking-[0.3em] text-sky-100/80'>
                Intention
              </h3>
              <p className='mt-1 text-sm leading-relaxed text-sky-50/90'>
                {technique.intention}
              </p>
            </Card>

            <Card className='border-emerald-400/35 bg-emerald-500/10 p-4 text-emerald-100'>
              <h3 className='text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100/80'>
                Benefits
              </h3>
              <ul className='mt-1 list-disc space-y-1 pl-4 text-sm text-emerald-50/90'>
                {technique.benefits.map(benefit => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </Card>
          </div>

          <div className='space-y-2'>
            <h3 className='text-xs font-semibold uppercase tracking-[0.35em] text-white/80'>
              Guidance cues
            </h3>
            <ul className='list-disc space-y-1 pl-5 text-sm text-slate-100/80'>
              {technique.cues.map(cue => (
                <li key={cue}>{cue}</li>
              ))}
            </ul>
          </div>

          <div className='flex flex-col gap-2 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between'>
            <p className='text-sm text-slate-100/70'>
              Stay present with the breath. When you are ready to wrap up, log a
              reflection to save this session.
            </p>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={handleTogglePause}
                disabled={!isGuidanceLive || isTogglingPause}
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
                disabled={!isSessionLive || isEnding}
              >
                {isEnding ? 'Ending…' : 'End Session'}
              </Button>
              <Button
                type='button'
                onClick={handleReflectionToggle}
                disabled={status === 'abandoned'}
              >
                {showReflectionForm ? 'Hide Reflection' : reflectionButtonLabel}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className='p-6 text-center text-slate-100/80'>
          <p>
            This session is ready, but a technique was not provided. Head back
            to{' '}
            <a
              href='/meditate'
              className='text-blue-200 transition hover:text-blue-100 underline-offset-2 hover:underline'
            >
              the meditation lobby
            </a>{' '}
            to choose one.
          </p>
        </Card>
      )}

      {showReflectionForm && (
        <Card className='space-y-4 p-6'>
          <form onSubmit={handleReflectionSubmit} className='space-y-4'>
            <div>
              <label className='mb-2 block text-sm font-medium text-slate-100/85'>
                How do you feel now?
              </label>
              <select
                value={reflectionMood}
                onChange={event => setReflectionMood(event.target.value)}
                className='block w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-blue-500/5 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-300/30'
              >
                {reflectionMoodOptions.map(option => (
                  <option
                    key={option.value}
                    value={option.value}
                    className='bg-slate-900 text-slate-100'
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-slate-100/85'>
                How clear is your mind?
              </label>
              <select
                value={clarityScore}
                onChange={event => setClarityScore(Number(event.target.value))}
                className='block w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-sky-500/5 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-300/30'
              >
                {Array.from({ length: 5 }, (_, index) => index + 1).map(
                  value => (
                    <option
                      key={value}
                      value={value}
                      className='bg-slate-900 text-slate-100'
                    >
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
              <label className='mb-2 block text-sm font-medium text-slate-100/85'>
                Reflection notes
              </label>
              <textarea
                value={reflectionNotes}
                onChange={event => setReflectionNotes(event.target.value)}
                rows={4}
                className='block w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-slate-500/10 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-300/30'
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
  );
}
