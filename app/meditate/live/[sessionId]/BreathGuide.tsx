'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../../../../components/ui';
import type { Technique } from '../../../../lib/techniques';

const SPEECH_RATE = 0.92;
const SPEECH_PITCH = 1.05;

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'complete';

type BreathPattern = Technique['pattern'];

interface BreathGuideProps {
  pattern: BreathPattern;
  techniqueName: string;
  isActive: boolean;
  isPaused: boolean;
}

function formatDuration(seconds: number) {
  if (seconds <= 0) {
    return '';
  }

  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}

function createSpeechText(phase: BreathPhase, duration: number) {
  const roundedDuration = Math.round(duration);

  switch (phase) {
    case 'inhale':
      return roundedDuration > 0
        ? `Inhale for ${formatDuration(roundedDuration)}.`
        : 'Inhale.';
    case 'hold':
      return roundedDuration > 0
        ? `Hold gently for ${formatDuration(roundedDuration)}.`
        : 'Hold the breath softly.';
    case 'exhale':
      return roundedDuration > 0
        ? `Exhale for ${formatDuration(roundedDuration)}.`
        : 'Exhale.';
    case 'complete':
      return 'Guided breathing complete. Continue at your own pace.';
    default:
      return '';
  }
}

export default function BreathGuide({
  pattern,
  techniqueName,
  isActive,
  isPaused,
}: BreathGuideProps) {
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [cycle, setCycle] = useState(1);
  const [phaseDuration, setPhaseDuration] = useState(pattern.inhale);
  const [phaseStartedAt, setPhaseStartedAt] = useState<number | null>(null);
  const [phaseProgress, setPhaseProgress] = useState(0);

  const timeoutsRef = useRef<number[]>([]);
  const isActiveRef = useRef(isActive);
  const isPausedRef = useRef(isPaused);

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

  const cancelSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
  }, []);

  const speakPhase = useCallback((nextPhase: BreathPhase, duration: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const text = createSpeechText(nextPhase, duration);
    if (!text) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = SPEECH_RATE;
    utterance.pitch = SPEECH_PITCH;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

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
      speakPhase(nextPhase, duration);

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
          speakPhase('complete', 0);
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
    if (!isActive) {
      clearTimers();
      cancelSpeech();
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
      return;
    }

    clearTimers();
    cancelSpeech();
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
    <Card className='p-6 shadow-sm border border-blue-100 bg-white'>
      <div className='flex flex-col items-center gap-6 text-center'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.35em] text-blue-500'>
            Breath Guidance
          </p>
          <h2 className='text-xl font-semibold text-gray-900'>
            {techniqueName}
          </h2>
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
            <span className='text-lg font-semibold text-slate-800 drop-shadow-sm'>
              {phaseLabel}
            </span>
          </div>
        </div>

        <div className='w-full max-w-xs space-y-2'>
          <div className='h-2 w-full overflow-hidden rounded-full bg-blue-100'>
            <div
              className='h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 transition-all duration-150 ease-linear'
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className='text-sm font-medium text-gray-700'>{cycleLabel}</p>
          {secondsRemaining !== null && (
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              {secondsRemaining > 0
                ? `${secondsRemaining}s remaining in this phase`
                : 'Transitioning to the next phase'}
            </p>
          )}
          {phase === 'complete' && (
            <p className='text-xs text-gray-500'>
              Continue at your own pace or pause the session when you are ready.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
