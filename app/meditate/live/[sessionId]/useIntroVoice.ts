'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Technique } from '../../../../lib/techniques';

function formatSeconds(seconds: number) {
  if (seconds <= 0) {
    return '';
  }

  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}

function buildIntroScript(technique: Technique) {
  const { name, description, intention, pattern } = technique;
  const inhale = Math.max(pattern.inhale, 0);
  const hold = Math.max(pattern.hold ?? 0, 0);
  const exhale = Math.max(pattern.exhale, 0);

  const cycleSegments: string[] = [];
  if (inhale > 0) {
    cycleSegments.push(`inhale for ${formatSeconds(inhale)}`);
  }
  if (hold > 0) {
    cycleSegments.push(`rest for ${formatSeconds(hold)}`);
  }
  if (exhale > 0) {
    cycleSegments.push(`exhale for ${formatSeconds(exhale)}`);
  }

  const openingCycleLine = cycleSegments.length
    ? `We'll begin with ${cycleSegments.join(', ')}. During the first round I'll share the timing, then I'll simply guide you with gentle inhale${
        hold > 0 ? ', rest,' : ''
      } and exhale cues so you can settle into your own rhythm.`
    : '';

  const segments = [
    `Welcome to ${name}.`,
    description,
    intention,
    'Find a comfortable position and let your attention gather around the breath.',
    openingCycleLine,
    'When you feel ready, press start and we will breathe together.',
  ].filter(Boolean);

  return segments.join(' ');
}

function techniqueSignature(technique: Technique | null) {
  if (!technique) {
    return null;
  }

  const { name, pattern } = technique;
  return [name, pattern.inhale, pattern.hold ?? 0, pattern.exhale].join('|');
}

type IntroOptions = {
  technique: Technique | null;
  isVoiceGuideEnabled: boolean;
  initiallyCompleted: boolean;
};

type ResetOptions = {
  markCompleted?: boolean;
  played?: boolean;
};

type ManualIntroPlay = (() => Promise<void>) | null;

export function useIntroVoice({
  technique,
  isVoiceGuideEnabled,
  initiallyCompleted,
}: IntroOptions) {
  const introPlayedRef = useRef(initiallyCompleted || !isVoiceGuideEnabled);
  const [hasIntroCompleted, setHasIntroCompleted] = useState(
    introPlayedRef.current
  );
  const [isIntroPlaying, setIsIntroPlaying] = useState(false);
  const [introNeedsUserInteraction, setIntroNeedsUserInteraction] =
    useState(false);
  const [manualIntroPlay, setManualIntroPlay] = useState<ManualIntroPlay>(null);

  const introAbortControllerRef = useRef<AbortController | null>(null);
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const introAudioUrlRef = useRef<string | null>(null);
  const techniqueSignatureRef = useRef<string | null>(
    techniqueSignature(technique)
  );

  const releaseAudio = useCallback(() => {
    if (introAudioRef.current) {
      introAudioRef.current.pause();
      introAudioRef.current.currentTime = 0;
      introAudioRef.current = null;
    }

    if (introAudioUrlRef.current) {
      URL.revokeObjectURL(introAudioUrlRef.current);
      introAudioUrlRef.current = null;
    }
  }, []);

  const abortPendingIntro = useCallback(() => {
    if (introAbortControllerRef.current) {
      introAbortControllerRef.current.abort();
      introAbortControllerRef.current = null;
    }
  }, []);

  const cancelIntro = useCallback(() => {
    abortPendingIntro();
    releaseAudio();
    setIsIntroPlaying(false);
    setIntroNeedsUserInteraction(false);
    setManualIntroPlay(null);
  }, [abortPendingIntro, releaseAudio]);

  const markIntroComplete = useCallback(() => {
    releaseAudio();
    introPlayedRef.current = true;
    setHasIntroCompleted(true);
    setIsIntroPlaying(false);
    setIntroNeedsUserInteraction(false);
    setManualIntroPlay(null);
  }, [releaseAudio]);

  const markIntroPending = useCallback(() => {
    introPlayedRef.current = false;
    setHasIntroCompleted(false);
    setIsIntroPlaying(false);
    setIntroNeedsUserInteraction(false);
    setManualIntroPlay(null);
  }, []);

  const resetIntroState = useCallback(
    (options?: ResetOptions) => {
      cancelIntro();
      const played = options?.played ?? false;
      const completed = options?.markCompleted ?? played;

      introPlayedRef.current = played;
      setHasIntroCompleted(completed);
      setIsIntroPlaying(false);
      setIntroNeedsUserInteraction(false);
      setManualIntroPlay(null);
    },
    [cancelIntro]
  );

  const playIntro = useCallback(async () => {
    cancelIntro();

    if (!technique || !isVoiceGuideEnabled) {
      markIntroComplete();
      return;
    }

    if (introPlayedRef.current) {
      markIntroComplete();
      return;
    }

    const text = buildIntroScript(technique);

    if (!text) {
      markIntroComplete();
      return;
    }

    setHasIntroCompleted(false);
    setIntroNeedsUserInteraction(false);
    setIsIntroPlaying(true);

    const controller = new AbortController();
    introAbortControllerRef.current = controller;

    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve intro audio');
      }

      const arrayBuffer = await response.arrayBuffer();

      if (controller.signal.aborted) {
        return;
      }

      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      introAudioRef.current = audio;
      introAudioUrlRef.current = url;

      const completeIntro = () => {
        if (introAudioRef.current === audio) {
          introAudioRef.current = null;
        }
        if (introAudioUrlRef.current === url) {
          URL.revokeObjectURL(url);
          introAudioUrlRef.current = null;
        }
        markIntroComplete();
      };

      audio.onended = completeIntro;
      audio.onerror = completeIntro;

      try {
        await audio.play();
      } catch (error) {
        if (
          error instanceof DOMException &&
          (error.name === 'NotAllowedError' || error.name === 'AbortError')
        ) {
          setIsIntroPlaying(false);
          setIntroNeedsUserInteraction(true);
          const manualRetry = async () => {
            try {
              setIntroNeedsUserInteraction(false);
              setIsIntroPlaying(true);
              await audio.play();
            } catch (retryError) {
              if (
                !(retryError instanceof DOMException) ||
                retryError.name !== 'AbortError'
              ) {
                // eslint-disable-next-line no-console
                console.error('Voice intro playback error', retryError);
              }
              completeIntro();
            }
          };
          setManualIntroPlay(() => manualRetry);
          return;
        }

        if (!(error instanceof DOMException) || error.name !== 'AbortError') {
          // eslint-disable-next-line no-console
          console.error('Voice intro playback error', error);
        }

        completeIntro();
      }
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'AbortError') {
        // eslint-disable-next-line no-console
        console.error('Voice intro playback error', error);
      }
      markIntroComplete();
    } finally {
      if (introAbortControllerRef.current === controller) {
        introAbortControllerRef.current = null;
      }
    }
  }, [cancelIntro, isVoiceGuideEnabled, markIntroComplete, technique]);

  useEffect(() => {
    const signature = techniqueSignature(technique);

    if (techniqueSignatureRef.current === signature) {
      return;
    }

    techniqueSignatureRef.current = signature;

    if (!signature || !isVoiceGuideEnabled) {
      cancelIntro();
      markIntroComplete();
      return;
    }

    cancelIntro();
    markIntroPending();
  }, [
    cancelIntro,
    isVoiceGuideEnabled,
    markIntroComplete,
    markIntroPending,
    technique,
  ]);

  useEffect(() => {
    return () => {
      cancelIntro();
    };
  }, [cancelIntro]);

  return {
    isIntroPlaying,
    hasIntroCompleted,
    introNeedsUserInteraction,
    manualIntroPlay,
    playIntro,
    cancelIntro,
    resetIntroState,
  };
}
