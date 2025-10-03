export type TechniqueKey =
  | 'box_breathing'
  | 'body_scan'
  | 'mindfulness'
  | 'loving_kindness'
  | 'mantra'
  | 'transcendental'
  | 'zen'
  | 'yoga_nidra'
  | 'nadi_shodhana';

type BreathPattern = {
  inhale: number;
  hold?: number;
  exhale: number;
  cycles?: number;
};

export interface Technique {
  key: TechniqueKey;
  name: string;
  description: string;
  intention: string;
  defaultDurationMinutes: number;
  benefits: string[];
  pattern: BreathPattern;
  cues: string[];
}

const TECHNIQUES: Technique[] = [
  {
    key: 'box_breathing',
    name: 'Box Breathing',
    description:
      'Steady, four-part breathing to settle the nervous system and restore balance.',
    intention: 'Find calm and focus in just a few minutes.',
    defaultDurationMinutes: 5,
    benefits: [
      'Stabilises the heart rate',
      'Clears mental fog',
      'Creates a sense of grounded presence',
    ],
    pattern: {
      inhale: 4,
      hold: 4,
      exhale: 4,
      cycles: 12,
    },
    cues: [
      'Inhale smoothly for four counts',
      'Hold with soft shoulders',
      'Exhale fully and evenly',
      'Pause briefly before the next round',
    ],
  },
  {
    key: 'body_scan',
    name: 'Body Scan',
    description:
      'A gentle tour through the body that softens tension and invites deep rest.',
    intention: 'Release the day and prepare for nourishing sleep.',
    defaultDurationMinutes: 12,
    benefits: [
      'Eases physical tightness',
      'Calms racing thoughts',
      'Supports better sleep quality',
    ],
    pattern: {
      inhale: 5,
      exhale: 5,
    },
    cues: [
      'Notice contact points with the ground',
      'Scan slowly from toes to crown',
      'Breathe into any sensations that arise',
      'Let heaviness melt into the earth',
    ],
  },
  {
    key: 'mindfulness',
    name: 'Mindful Breathing',
    description:
      'Rest in the simplicity of natural breath while observing thoughts without judgement.',
    intention: 'Cultivate steady awareness and a spacious mind.',
    defaultDurationMinutes: 8,
    benefits: [
      'Enhances focus',
      'Reduces stress reactivity',
      'Builds emotional clarity',
    ],
    pattern: {
      inhale: 4,
      exhale: 6,
    },
    cues: [
      'Rest attention on the tip of the nose',
      'Let the breath be easy and unforced',
      'Label distractions gently',
      'Return kindly to the next inhale',
    ],
  },
  {
    key: 'loving_kindness',
    name: 'Loving Kindness',
    description:
      'Nurture warmth and compassion through affirmations for yourself and others.',
    intention: 'Open the heart and reconnect with kindness.',
    defaultDurationMinutes: 10,
    benefits: [
      'Increases positive emotion',
      'Softens self-criticism',
      'Strengthens connection to others',
    ],
    pattern: {
      inhale: 4,
      exhale: 6,
    },
    cues: [
      'Anchor in the breath for a few rounds',
      'Repeat phrases like “May I be at ease”',
      'Extend the wishes to someone you love',
      'Radiate the well-wishing outward',
    ],
  },
  {
    key: 'mantra',
    name: 'Mantra Meditation',
    description:
      'Silently repeat a chosen phrase to steady the mind and invite clarity.',
    intention: 'Soften distractions by resting on a gentle mantra.',
    defaultDurationMinutes: 15,
    benefits: [
      'Improves concentration',
      'Eases anxious rumination',
      'Supports consistent daily practice',
    ],
    pattern: {
      inhale: 4,
      exhale: 4,
    },
    cues: [
      'Select a soothing word or phrase',
      'Whisper it mentally on each breath',
      'If thoughts arise, notice and return',
      'Close with a few grateful breaths',
    ],
  },
  {
    key: 'transcendental',
    name: 'Transcendental Ease',
    description:
      'Settle deeply beyond thought with effortless mantra repetition.',
    intention: 'Rest in quiet alertness beneath surface-level thinking.',
    defaultDurationMinutes: 20,
    benefits: [
      'Reduces stress hormones',
      'Enhances emotional resilience',
      'Encourages deeply restorative rest',
    ],
    pattern: {
      inhale: 4,
      exhale: 4,
    },
    cues: [
      'Sit comfortably with eyes closed',
      'Repeat your personal mantra softly',
      'Allow attention to drift as needed',
      'Return gently when you notice wandering',
    ],
  },
  {
    key: 'zen',
    name: 'Zen Stillness',
    description:
      'Practice upright stillness with attention on the breath and posture.',
    intention: 'Cultivate calm alertness and spacious awareness.',
    defaultDurationMinutes: 25,
    benefits: [
      'Builds equanimity',
      'Encourages disciplined focus',
      'Deepens body-breath connection',
    ],
    pattern: {
      inhale: 4,
      exhale: 6,
    },
    cues: [
      'Sit tall with relaxed shoulders',
      'Let the breath flow through the nose',
      'Count the breath from one to ten',
      'Reset the count when the mind wanders',
    ],
  },
  {
    key: 'yoga_nidra',
    name: 'Yoga Nidra Drift',
    description:
      'Guide awareness through the body and imagination for deep rest.',
    intention: 'Melt into profound relaxation while remaining gently aware.',
    defaultDurationMinutes: 30,
    benefits: [
      'Supports restorative sleep',
      'Soothes chronic tension',
      'Restores nervous system balance',
    ],
    pattern: {
      inhale: 4,
      exhale: 6,
    },
    cues: [
      'Settle into a reclined, supported posture',
      'Rotate awareness through the body slowly',
      'Visualise comforting imagery or light',
      'Stay awake with effortless, slow breathing',
    ],
  },
  {
    key: 'nadi_shodhana',
    name: 'Alternate Nostril Breath',
    description:
      'Balance the subtle energy channels with alternating nasal breathing.',
    intention: 'Reset when feeling scattered or overstimulated.',
    defaultDurationMinutes: 6,
    benefits: [
      'Balances nervous system',
      'Clears lingering agitation',
      'Brightens concentration',
    ],
    pattern: {
      inhale: 4,
      hold: 2,
      exhale: 4,
      cycles: 10,
    },
    cues: [
      'Use the right thumb to close the right nostril',
      'Breathe in through the left, then switch',
      'Keep the shoulders relaxed',
      'Finish with a deep, even breath through both nostrils',
    ],
  },
];

export function getTechniqueByKey(
  key: string | null | undefined
): Technique | null {
  if (!key) {
    return null;
  }

  return TECHNIQUES.find(technique => technique.key === key) ?? null;
}

export function listTechniques(): Technique[] {
  return [...TECHNIQUES];
}

export type Mood = 'stressed' | 'tired' | 'restless';
export type Goal = 'calm' | 'sleep' | 'focus' | 'self_love';

export interface GuruProfile {
  mood: Mood;
  goal: Goal;
}

export function chooseTechniqueForProfile(profile: GuruProfile): Technique {
  const priorityKeys: TechniqueKey[] = [];

  switch (profile.goal) {
    case 'sleep':
      priorityKeys.push('body_scan');
      break;
    case 'focus':
      priorityKeys.push('box_breathing', 'mindfulness');
      break;
    case 'self_love':
      priorityKeys.push('loving_kindness');
      break;
    default:
      priorityKeys.push('mindfulness');
      break;
  }

  switch (profile.mood) {
    case 'tired':
      priorityKeys.push('loving_kindness', 'mindfulness');
      break;
    case 'restless':
      priorityKeys.push('nadi_shodhana', 'box_breathing');
      break;
    default:
      priorityKeys.push('box_breathing');
      break;
  }

  for (const key of priorityKeys) {
    const match = getTechniqueByKey(key);
    if (match) {
      return match;
    }
  }

  return pickRandomTechnique();
}

export function pickRandomTechnique(): Technique {
  if (TECHNIQUES.length === 0) {
    throw new Error('No techniques available to choose from.');
  }
  const index = Math.floor(Math.random() * TECHNIQUES.length);
  const technique = TECHNIQUES[index];
  if (!technique) {
    throw new Error('Failed to select a technique.');
  }
  return technique;
}

export function formatPattern(pattern: BreathPattern): string {
  const parts = [`Inhale ${pattern.inhale}s`];
  if (pattern.hold) {
    parts.push(`Hold ${pattern.hold}s`);
  }
  parts.push(`Exhale ${pattern.exhale}s`);
  if (pattern.cycles) {
    parts.push(`${pattern.cycles} cycles`);
  }
  return parts.join(' • ');
}
