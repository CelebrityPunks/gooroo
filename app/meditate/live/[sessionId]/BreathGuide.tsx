'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../../../../components/ui';
import type { Technique } from '../../../../lib/techniques';

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'complete';

type BreathPattern = Technique['pattern'];

interface BreathGuideProps {
  pattern: BreathPattern;
  techniqueName: string;
  techniqueDescription: string;
  techniqueIntention: string;
  isActive: boolean;
  isPaused: boolean;
  isVoiceGuideEnabled: boolean;
}

function formatDuration(seconds: number) {
  if (seconds <= 0) {
    return '';
  }

  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}

interface SpeechContext {
  phase: BreathPhase;
  duration: number;
  cycle: number;
  introDelivered: boolean;
  techniqueName: string;
  techniqueDescription: string;
  techniqueIntention: string;
}

function createSpeechText(
  {
    phase,
    duration,
    cycle,
    introDelivered,
    techniqueDescription,
    techniqueIntention,
    techniqueName,
  }: SpeechContext,
  hasHold: boolean
) {
  if (phase === 'complete') {
    return 'Guided breathing complete. Continue at your own pace.';
  }

  const roundedDuration = Math.max(0, Math.round(duration));
  const durationLabel =
    roundedDuration > 0 ? formatDuration(roundedDuration) : '';

  const simpleByPhase: Record<
    Exclude<BreathPhase, 'idle' | 'complete'>,
    string
  > = {
    inhale: 'Inhale.',
    hold: hasHold ? 'Rest.' : 'Hold softly.',
    exhale: 'Exhale.',
  };

  const timedByPhase: Record<
    Exclude<BreathPhase, 'idle' | 'complete'>,
    string
  > = {
    inhale:
      durationLabel && durationLabel.length > 0
        ? `Inhale for ${durationLabel}.`
        : simpleByPhase.inhale,
    hold:
      durationLabel && durationLabel.length > 0
        ? `${hasHold ? 'Rest' : 'Hold'} for ${durationLabel}.`
        : simpleByPhase.hold,
    exhale:
      durationLabel && durationLabel.length > 0
        ? `Exhale for ${durationLabel}.`
        : simpleByPhase.exhale,
  };

  if (cycle === 1) {
    if (phase === 'inhale' && !introDelivered) {
      const introSegments = [
        `Welcome to ${techniqueName}.`,
        techniqueDescription,
        techniqueIntention,
      ].filter(Boolean);

      introSegments.push(timedByPhase.inhale);

      return introSegments.join(' ');
    }

    if (phase in timedByPhase) {
      return timedByPhase[phase as keyof typeof timedByPhase];
    }
  }

  if (phase in simpleByPhase) {
    return simpleByPhase[phase as keyof typeof simpleByPhase];
  }

  return '';
}

export default function BreathGuide({
  pattern,
  techniqueName,
  techniqueDescription,
  techniqueIntention,
  isActive,
  isPaused,
  isVoiceGuideEnabled,
}: BreathGuideProps) {
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [cycle, setCycle] = useState(1);
  const [phaseDuration, setPhaseDuration] = useState(pattern.inhale);
  const [phaseStartedAt, setPhaseStartedAt] = useState<number | null>(null);
  const [phaseProgress, setPhaseProgress] = useState(0);

  const timeoutsRef = useRef<number[]>([]);
  const isActiveRef = useRef(isActive);
  const isPausedRef = useRef(isPaused);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const speechAbortControllerRef = useRef<AbortController | null>(null);
  const fallbackUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const introSpokenRef = useRef(false);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const hasHold = useMemo(() => (pattern.hold ?? 0) > 0, [pattern.hold]);

  const phaseOrder = useMemo(() => {
    const order: BreathPhase[] = ['inhale'];
    if (hasHold) {
      order.push('hold');
    }
    order.push('exhale');
    return order;
  }, [hasHold]);

  const durations = useMemo(
    () => ({
      inhale: Math.max(pattern.inhale, 0),
      hold: Math.max(pattern.hold ?? 0, 0),
      exhale: Math.max(pattern.exhale, 0),
    }),
    [pattern.exhale, pattern.hold, pattern.inhale]
  );

  useEffect(() => {
    introSpokenRef.current = false;
  }, [durations.exhale, durations.hold, durations.inhale, techniqueName]);

  const cancelSpeech = useCallback(() => {
    speechAbortControllerRef.current?.abort();
    speechAbortControllerRef.current = null;

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }

    if (activeAudioUrlRef.current) {
      URL.revokeObjectURL(activeAudioUrlRef.current);
      activeAudioUrlRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    fallbackUtteranceRef.current = null;
  }, []);

  const speakWithBrowserVoice = useCallback(
    (text: string, controller: AbortController) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        return false;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.85;
      utterance.rate = 0.9;
      utterance.volume = 0.9;

      utterance.onend = () => {
        if (fallbackUtteranceRef.current === utterance) {
          fallbackUtteranceRef.current = null;
        }
        if (speechAbortControllerRef.current === controller) {
          speechAbortControllerRef.current = null;
        }
      };

      utterance.onerror = () => {
        if (fallbackUtteranceRef.current === utterance) {
          fallbackUtteranceRef.current = null;
        }
        if (speechAbortControllerRef.current === controller) {
          speechAbortControllerRef.current = null;
        }
      };

      fallbackUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);

      return true;
    },
    []
  );

  const speakPhase = useCallback(
    (nextPhase: BreathPhase, duration: number, nextCycle: number) => {
      cancelSpeech();

      if (!isVoiceGuideEnabled) {
        return;
      }

      const text = createSpeechText(
        {
          phase: nextPhase,
          duration,
          cycle: nextCycle,
          introDelivered: introSpokenRef.current,
          techniqueDescription,
          techniqueIntention,
          techniqueName,
        },
        hasHold
      );
      if (!text) {
        return;
      }

      if (
        nextPhase === 'inhale' &&
        nextCycle === 1 &&
        !introSpokenRef.current
      ) {
        introSpokenRef.current = true;
      }

      const controller = new AbortController();
      speechAbortControllerRef.current = controller;

      void fetch('/api/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
        cache: 'no-store',
      })
        .then(async response => {
          if (!response.ok) {
            throw new Error('Failed to retrieve guided audio');
          }

          const arrayBuffer = await response.arrayBuffer();
          if (controller.signal.aborted) {
            return;
          }

          const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);

          activeAudioRef.current = audio;
          activeAudioUrlRef.current = url;

          audio.onended = () => {
            if (activeAudioRef.current === audio) {
              activeAudioRef.current = null;
            }
            if (activeAudioUrlRef.current === url) {
              URL.revokeObjectURL(url);
              activeAudioUrlRef.current = null;
            }
          };

          audio.onerror = () => {
            if (activeAudioUrlRef.current === url) {
              URL.revokeObjectURL(url);
              activeAudioUrlRef.current = null;
            }
          };

          await audio.play();
        })
        .catch(error => {
          if (controller.signal.aborted) {
            return;
          }

          // eslint-disable-next-line no-console
          console.error('Voice guidance playback error', error);
        })
        .finally(() => {
          if (speechAbortControllerRef.current === controller) {
            const fallbackStarted = speakWithBrowserVoice(text, controller);

            if (!fallbackStarted) {
              // eslint-disable-next-line no-console
              console.error(
                'Voice guidance fallback unavailable after playback failure'
              );
              speechAbortControllerRef.current = null;
            }
          }

          if (
            speechAbortControllerRef.current === controller &&
            !fallbackUtteranceRef.current
          ) {
            speechAbortControllerRef.current = null;
          }
        });
    },
    [
      cancelSpeech,
      hasHold,
      isVoiceGuideEnabled,
      speakWithBrowserVoice,
      techniqueDescription,
      techniqueIntention,
      techniqueName,
    ]
  );

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach(timeoutId => {
      window.clearTimeout(timeoutId);
    });
    timeoutsRef.current = [];
  }, []);

  const schedulePhase = useCallback(
    (nextPhase: BreathPhase, nextCycle: number) => {
      const duration =
        nextPhase === 'inhale'
          ? durations.inhale
          : nextPhase === 'hold'
            ? durations.hold
            : durations.exhale;

      setPhase(nextPhase);
      if (nextPhase === 'inhale') {
        setCycle(nextCycle);
      }
      setPhaseDuration(duration);
      setPhaseStartedAt(Date.now());
      setPhaseProgress(0);
      speakPhase(nextPhase, duration, nextCycle);

      const phaseIndex = phaseOrder.indexOf(nextPhase);
      const safePhaseIndex = phaseIndex >= 0 ? phaseIndex : 0;
      const isLastPhase = safePhaseIndex === phaseOrder.length - 1;
      const nextPhaseIndex = isLastPhase ? 0 : safePhaseIndex + 1;
      const nextPhaseName = phaseOrder[nextPhaseIndex];
      const nextCycleCount = isLastPhase ? nextCycle + 1 : nextCycle;

      if (!nextPhaseName) {
        return;
      }
      const waitDuration = Math.max(duration, 0) * 1000;

      if (isLastPhase && pattern.cycles && nextCycleCount > pattern.cycles) {
        const completionId = window.setTimeout(() => {
          if (!isActiveRef.current) {
            return;
          }
          setPhase('complete');
          setPhaseDuration(0);
          setPhaseStartedAt(null);
          setPhaseProgress(0);
          speakPhase('complete', 0, nextCycleCount);
        }, waitDuration);
        timeoutsRef.current.push(completionId);
        return;
      }

      const timeoutId = window.setTimeout(() => {
        if (!isActiveRef.current || isPausedRef.current) {
          return;
        }
        schedulePhase(nextPhaseName, nextCycleCount);
      }, waitDuration);

      timeoutsRef.current.push(timeoutId);
    },
    [durations, phaseOrder, pattern.cycles, speakPhase]
  );

  useEffect(() => {
    if (!isVoiceGuideEnabled) {
      cancelSpeech();
    }
  }, [cancelSpeech, isVoiceGuideEnabled]);

  useEffect(
    () => () => {
      cancelSpeech();
    },
    [cancelSpeech]
  );

  useEffect(() => {
    if (!isActive) {
      clearTimers();
      cancelSpeech();
      introSpokenRef.current = false;
      setPhase('idle');
      setCycle(1);
      setPhaseDuration(pattern.inhale);
      setPhaseStartedAt(null);
      setPhaseProgress(0);
      return;
    }

    if (isPaused) {
      clearTimers();
      cancelSpeech();
      introSpokenRef.current = false;
      return;
    }

    clearTimers();
    cancelSpeech();
    introSpokenRef.current = false;
    schedulePhase('inhale', 1);

    return () => {
      clearTimers();
      cancelSpeech();
    };
  }, [
    cancelSpeech,
    clearTimers,
    isActive,
    isPaused,
    pattern.inhale,
    schedulePhase,
  ]);

  useEffect(() => {
    if (
      !phaseStartedAt ||
      phaseDuration <= 0 ||
      !isActive ||
      isPaused ||
      phase === 'complete'
    ) {
      return;
    }

    const updateProgress = () => {
      const elapsed = Date.now() - phaseStartedAt;
      const total = phaseDuration * 1000;
      if (total <= 0) {
        setPhaseProgress(1);
        return;
      }
      const ratio = Math.min(1, elapsed / total);
      setPhaseProgress(ratio);
    };

    updateProgress();
    const intervalId = window.setInterval(updateProgress, 125);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [phaseStartedAt, phaseDuration, isActive, isPaused, phase]);

  useEffect(() => {
    return () => {
      clearTimers();
      cancelSpeech();
    };
  }, [cancelSpeech, clearTimers]);

  const totalCycles = pattern.cycles ?? null;
  const secondsRemaining = useMemo(() => {
    if (
      phaseDuration <= 0 ||
      !isActive ||
      isPaused ||
      phaseStartedAt === null ||
      phase === 'complete'
    ) {
      return null;
    }

    const elapsed = Date.now() - phaseStartedAt;
    const remaining = Math.max(0, Math.ceil(phaseDuration - elapsed / 1000));

    return remaining;
  }, [isActive, isPaused, phase, phaseDuration, phaseStartedAt]);

  const cycleLabel = useMemo(() => {
    if (!isActive) {
      return 'Waiting to begin.';
    }

    if (phase === 'complete') {
      return totalCycles
        ? `Completed ${totalCycles} guided cycles.`
        : 'Guided breathing complete.';
    }

    const displayCycle = totalCycles ? Math.min(cycle, totalCycles) : cycle;

    return totalCycles
      ? `Cycle ${displayCycle} of ${totalCycles}`
      : `Cycle ${displayCycle}`;
  }, [cycle, isActive, phase, totalCycles]);

  const phaseLabel = useMemo(() => {
    if (!isActive) {
      return 'Awaiting start';
    }

    if (isPaused) {
      return 'Paused';
    }

    switch (phase) {
      case 'inhale':
        return 'Inhale';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Exhale';
      case 'complete':
        return 'Complete';
      default:
        return 'Breathe';
    }
  }, [isActive, isPaused, phase]);

  const scale = useMemo(() => {
    const minScale = 0.65;
    const maxScale = 1.15;

    if (!isActive || phase === 'idle') {
      return minScale;
    }

    if (phase === 'complete') {
      return minScale;
    }

    if (phase === 'hold') {
      return maxScale;
    }

    const clampedProgress = Math.min(Math.max(phaseProgress, 0), 1);

    if (phase === 'inhale') {
      return minScale + (maxScale - minScale) * clampedProgress;
    }

    if (phase === 'exhale') {
      return minScale + (maxScale - minScale) * (1 - clampedProgress);
    }

    return minScale;
  }, [isActive, phase, phaseProgress]);

  const progressPercentage = Math.min(100, Math.max(0, phaseProgress * 100));

  return (
    <Card className='p-6 backdrop-blur-lg bg-white/10'>
      <div className='flex flex-col items-center gap-6 text-center'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.35em] text-blue-200/80'>
            Breath Guidance
          </p>
          <h2 className='text-xl font-semibold text-white'>{techniqueName}</h2>
        </div>

        <div className='relative flex items-center justify-center'>
          <div
            className='relative flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-blue-200 via-indigo-200 to-blue-500/60 shadow-inner transition-transform duration-700 ease-in-out'
            style={{ transform: `scale(${scale})` }}
            aria-hidden='true'
          >
            <div className='absolute inset-4 rounded-full border border-white/50 backdrop-blur-sm' />
            <div className='absolute inset-1 rounded-full border border-white/20' />
          </div>
          <div className='absolute flex h-44 w-44 items-center justify-center'>
            <span className='text-lg font-semibold text-white drop-shadow-[0_6px_18px_rgba(15,23,42,0.45)]'>
              {phaseLabel}
            </span>
          </div>
        </div>

        <div className='w-full max-w-xs space-y-2'>
          <div className='h-2 w-full overflow-hidden rounded-full bg-white/15 backdrop-blur-sm'>
            <div
              className='h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 transition-all duration-150 ease-linear'
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className='text-sm font-medium text-slate-100/85'>{cycleLabel}</p>
          {secondsRemaining !== null && (
            <p className='text-xs uppercase tracking-wide text-slate-100/60'>
              {secondsRemaining > 0
                ? `${secondsRemaining}s remaining in this phase`
                : 'Transitioning to the next phase'}
            </p>
          )}
          {phase === 'complete' && (
            <p className='text-xs text-slate-100/60'>
              Continue at your own pace or pause the session when you are ready.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
