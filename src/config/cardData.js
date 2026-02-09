// Card definitions for musical loop deckbuilder
//
// Card Types:
//   - 'rhythm': Attack cards, placed on rhythm track
//   - 'bass': Block/defense cards, placed on bass track
//   - 'utility': Instant effects, not placed on measure
//
// Rarities: 'common', 'uncommon', 'rare'
//
// Beats: How many beats (1-4) the card takes up on the measure
// Mana: Energy cost to play the card
// Effects: What happens when the loop plays (or immediately for utility)

export const CARDS = {
  // ===== RHYTHM CARDS (Attack) =====

  basicBeat: {
    id: 'basicStrum',
    name: 'Basic Strum',
    type: 'rhythm',
    rarity: 'starter',
    beats: 2,
    mana: 1,
    description: 'Deal 6 damage',
    effects: [
      { type: 'damage', value: 6, target: 'enemy' }
    ],
  },

  doubleBeat: {
    id: 'doubleBeat',
    name: 'Double Beat',
    type: 'rhythm',
    rarity: 'common',
    beats: 2,
    mana: 2,
    description: 'Deal 14 damage',
    effects: [
      { type: 'damage', value: 14, target: 'enemy' }
    ],
  },

  quickHit: {
    id: 'rapidStrum',
    name: 'Rapid Strum',
    type: 'rhythm',
    rarity: 'uncommon',
    beats: 1,
    mana: 0,
    description: 'Deal 6 damage',
    effects: [
      { type: 'damage', value: 6, target: 'enemy' }
    ],
  },

  heavyDrum: {
    id: 'heavyDrum',
    name: 'Heavy Drum',
    type: 'rhythm',
    rarity: 'uncommon',
    beats: 3,
    mana: 3,
    description: 'Deal 24 damage',
    effects: [
      { type: 'damage', value: 24, target: 'enemy' }
    ],
  },

  crescendo: {
    id: 'crescendo',
    name: 'Crescendo',
    type: 'rhythm',
    rarity: 'rare',
    beats: 4,
    mana: 3,
    description: 'Deal 40 damage',
    effects: [
      { type: 'damage', value: 40, target: 'enemy' }
    ],
  },

  flourish: {
    id: 'flourish',
    name: 'Flourish',
    type: 'rhythm',
    rarity: 'common',
    beats: 2,
    mana: 1,
    description: 'Deal 4 damage every beat',
    effects: [
      { type: 'damagePerBeat', value: 4, target: 'enemy' }
    ],
  },

  violentRiff: {
    id: 'violentRiff',
    name: 'Violent Riff',
    type: 'rhythm',
    rarity: 'common',
    beats: 4,
    mana: 1,
    description: 'Deal damage equal to block built this loop',
    effects: [
      { type: 'damageEqualBlock', target: 'enemy' }
    ],
  },

  octaveSwitch: {
    id: 'octaveSwitch',
    name: 'Octave Switch',
    type: 'rhythm',
    rarity: 'common',
    beats: 1,
    mana: 1,
    description: 'Deal 5 damage. Delay 1.',
    effects: [
      { type: 'damage', value: 5, target: 'enemy' },
      { type: 'delayEnemy', value: 1 }
    ],
  },

  outro: {
    id: 'outro',
    name: 'Outro',
    type: 'rhythm',
    rarity: 'uncommon',
    beats: 1,
    mana: 0,
    description: 'Deal 10 damage if rhythm lane is full',
    effects: [
      { type: 'conditionalDamage', value: 10, condition: 'rhythmFull', target: 'enemy' }
    ],
  },

  leadIn: {
    id: 'leadIn',
    name: 'Lead-in',
    type: 'rhythm',
    rarity: 'common',
    beats: 1,
    mana: 1,
    description: 'Deal 4 damage. Next card deals double damage.',
    effects: [
      { type: 'damage', value: 4, target: 'enemy' },
      { type: 'doubleDamageNext' }
    ],
  },

  chordProgression: {
    id: 'chordProgression',
    name: 'Chord Progression',
    type: 'rhythm',
    rarity: 'uncommon',
    beats: 4,
    mana: 2,
    description: 'Deal damage equal to 2x the beat',
    effects: [
      { type: 'beatMultipliedDamage', value: 2, target: 'enemy' }
    ],
  },

  whammy: {
    id: 'whammy',
    name: 'Whammy',
    type: 'rhythm',
    rarity: 'common',
    beats: 2,
    mana: 1,
    description: 'Deal 8 damage. Draw a card',
    effects: [
      { type: 'damage', value: 8, target: 'enemy' },
      { type: 'draw', value: 1, target: 'player' }
    ],
  },

  surfWave: {
    id: 'surfWave',
    name: 'Surf Wave',
    type: 'rhythm',
    rarity: 'common',
    beats: 1,
    mana: 1,
    description: 'Deal 9 damage. Reverb',
    effects: [
      { type: 'damage', value: 9, target: 'enemy' },
      { type: 'reverb' }
    ],
  },

  freebird: {
    id: 'freebird',
    name: 'Freebird',
    type: 'rhythm',
    rarity: 'common',
    beats: 5,
    mana: 1,
    description: 'Deal 15 damage',
    effects: [
      { type: 'damage', value: 15, target: 'enemy' }
    ],
  },

  knockEmDead: {
    id: 'knockEmDead',
    name: 'Knock em dead',
    type: 'rhythm',
    rarity: 'common',
    beats: 2,
    mana: 1,
    description: 'Deal 8 damage. Finale x2 damage.',
    effects: [
      { type: 'damage', value: 8, target: 'enemy' },
      { type: 'finale', multiplier: 2, applyTo: 'damage' }
    ],
  },

  duelingGuitars: {
    id: 'duelingGuitars',
    name: 'Dueling Guitars',
    type: 'rhythm',
    rarity: 'common',
    beats: 2,
    mana: 1,
    description: 'Deal 7 damage. Negate an enemy attack on this beat',
    effects: [
      { type: 'damage', value: 7, target: 'enemy' },
      { type: 'negateEnemyAttack' }
    ],
  },

  wrongNote: {
    id: 'wrongNote',
    name: 'Wrong Note',
    type: 'rhythm',
    rarity: 'common',
    beats: 1,
    mana: 1,
    description: 'Deal 12 damage. Lose 4 health',
    effects: [
      { type: 'damage', value: 12, target: 'enemy' },
      { type: 'loseHealth', value: 4, target: 'player' }
    ],
  },

  // ===== BASS CARDS (Block/Defense) =====

  bassLine: {
    id: 'bassLine',
    name: 'Bass Line',
    type: 'bass',
    rarity: 'starter',
    beats: 2,
    mana: 1,
    description: 'Gain 5 block',
    effects: [
      { type: 'block', value: 5, target: 'player' }
    ],
  },

  fingerPluck: {
    id: 'fingerPluck',
    name: 'Finger Pluck',
    type: 'bass',
    rarity: 'common',
    beats: 1,
    mana: 1,
    description: 'Gain 7 block',
    effects: [
      { type: 'block', value: 7, target: 'player' }
    ],
  },

  deepBass: {
    id: 'deepBass',
    name: 'Deep Bass',
    type: 'bass',
    rarity: 'common',
    beats: 2,
    mana: 2,
    description: 'Gain 15 block',
    effects: [
      { type: 'block', value: 15, target: 'player' }
    ],
  },

  bassWall: {
    id: 'bassWall',
    name: 'Bass Wall',
    type: 'bass',
    rarity: 'uncommon',
    beats: 3,
    mana: 2,
    description: 'Gain 20 block',
    effects: [
      { type: 'block', value: 20, target: 'player' }
    ],
  },

  funkBass: {
    id: 'funkBass',
    name: 'Funk Bass',
    type: 'bass',
    rarity: 'common',
    beats: 3,
    mana: 2,
    description: 'Gain 8 block on the first and last beat of this sample',
    effects: [
      { type: 'beatPositionBlock', value: 8, positions: ['first', 'last'], target: 'player' }
    ],
  },

  wallOfSound: {
    id: 'wallOfSound',
    name: 'Wall of Sound',
    type: 'bass',
    rarity: 'uncommon',
    beats: 2,
    mana: 2,
    description: 'Block 7 on beat 1 and Block 7 on beat 2. Delay 1.',
    effects: [
      { type: 'beatPositionBlock', value: 7, positions: ['first', 'last'], target: 'player' },
      { type: 'delayEnemy', value: 1 }
    ],
  },

  subBass: {
    id: 'subBass',
    name: 'Sub Bass',
    type: 'bass',
    rarity: 'rare',
    beats: 4,
    mana: 3,
    description: 'Gain 35 block',
    effects: [
      { type: 'block', value: 35, target: 'player' }
    ],
  },

  walkingBassline: {
    id: 'walkingBassline',
    name: 'Walking bassline',
    type: 'bass',
    rarity: 'common',
    beats: 4,
    mana: 2,
    description: 'Gain 4 block every beat',
    effects: [
      { type: 'blockPerBeat', value: 4, target: 'player' }
    ],
  },

  echoingBass: {
    id: 'echoingBass',
    name: 'Echoing Bass',
    type: 'bass',
    rarity: 'uncommon',
    beats: 2,
    mana: 2,
    description: 'Gain 12 block. Echo 1',
    effects: [
      { type: 'block', value: 12, target: 'player' },
      { type: 'echo', echoCount: 1, echoType: 'block' }
    ],
  },

  sickLick: {
    id: 'sickLick',
    name: 'Sick Lick',
    type: 'bass',
    rarity: 'uncommon',
    beats: 1,
    mana: 1,
    description: 'Gain 16 Block. Improvise',
    effects: [
      { type: 'block', value: 16, target: 'player' },
      { type: 'improvise' }
    ],
  },

  // ===== UTILITY CARDS (Instant) =====

  tuneUp: {
    id: 'tuneUp',
    name: 'Tune Up',
    type: 'utility',
    rarity: 'common',
    beats: 0, // Utility cards don't use beats
    mana: 1,
    description: 'Draw 2 cards',
    effects: [
      { type: 'draw', value: 2, target: 'player' }
    ],
  },

  energize: {
    id: 'energize',
    name: 'Energize',
    type: 'utility',
    rarity: 'uncommon',
    beats: 0,
    mana: 0,
    description: 'Gain 2 mana',
    effects: [
      { type: 'gainMana', value: 2, target: 'player' }
    ],
  },

  looperPedal: {
    id: 'looperPedal',
    name: 'Looper Pedal',
    type: 'utility',
    rarity: 'uncommon',
    beats: 0,
    mana: 1,
    description: 'Add loop 1 to a card on the track',
    effects: [
      { type: 'targetLoop', value: 1 }
    ],
  },

  soundCheck: {
    id: 'soundCheck',
    name: 'Sound Check',
    type: 'utility',
    rarity: 'uncommon',
    beats: 0,
    mana: 1,
    description: 'Draw 1+X cards, where X is the number of samples on the track',
    effects: [
      { type: 'drawPerSample', value: 1 }
    ],
  },

  turnTo11: {
    id: 'turnTo11',
    name: 'Turn to 11',
    type: 'utility',
    rarity: 'common',
    beats: 0,
    mana: 1,
    description: 'Double the damage of a sample on the track',
    effects: [
      { type: 'targetDoubleDamage', value: 2 }
    ],
  },

  deafen: {
    id: 'deafen',
    name: 'Deafen',
    type: 'utility',
    rarity: 'common',
    beats: 0,
    mana: 1,
    description: 'Reduce all enemy damage by 5',
    effects: [
      { type: 'weakenEnemy', value: 5 }
    ],
  },

  rewind: {
    id: 'rewind',
    name: 'Rewind',
    type: 'utility',
    rarity: 'rare',
    beats: 0,
    mana: 1,
    description: 'Replay every card from the last loop',
    effects: [
      { type: 'rewind' }
    ],
  },

  guitarLessons: {
    id: 'guitarLessons',
    name: 'Guitar lessons',
    type: 'utility',
    rarity: 'uncommon',
    beats: 0,
    mana: 1,
    description: 'Put a random rhythm card from the draw pile in your hand',
    effects: [
      { type: 'tutorType', cardType: 'rhythm' }
    ],
  },

  // ===== COMBO CARDS (Synergy effects) =====

  harmony: {
    id: 'harmony',
    name: 'Harmony',
    type: 'rhythm',
    rarity: 'uncommon',
    beats: 2,
    mana: 2,
    description: 'Deal 10 damage. If bass is playing, deal 10 more.',
    effects: [
      { type: 'damage', value: 10, target: 'enemy' },
      { type: 'conditionalDamage', value: 10, condition: 'bassPlaying', target: 'enemy' }
    ],
  },

  syncopation: {
    id: 'syncopation',
    name: 'Syncopation',
    type: 'bass',
    rarity: 'common',
    beats: 1,
    mana: 1,
    description: 'Gain 5 block. Draw 1 card.',
    effects: [
      { type: 'block', value: 5, target: 'player' },
      { type: 'draw', value: 1, target: 'player' }
    ],
  },

  catchyHook: {
    id: 'catchyHook',
    name: 'Catchy Hook',
    type: 'bass',
    rarity: 'common',
    beats: 1,
    mana: 1,
    description: 'Gain 5 block. Loop 1.',
    effects: [
      { type: 'block', value: 5, target: 'player' },
      { type: 'loop', value: 1 }
    ],
  },

  // ===== DRUM CARDS (Permanent beat modifiers) =====

  kick: {
    id: 'kick',
    name: 'Kick',
    type: 'drum',
    rarity: 'uncommon',
    beats: 4,
    mana: 1,
    description: 'Permanent: +4 to beats 1 & 3',
    effects: [
      { type: 'beatBonus', value: 4, beats: [0, 2] } // Beats 1&3 (0-indexed)
    ],
  },

  snare: {
    id: 'snare',
    name: 'Snare',
    type: 'drum',
    rarity: 'uncommon',
    beats: 4,
    mana: 1,
    description: 'Permanent: +4 to beats 2 & 4',
    effects: [
      { type: 'beatBonus', value: 4, beats: [1, 3] } // Beats 2&4 (0-indexed)
    ],
  },

  hihat: {
    id: 'hihat',
    name: 'Hihat',
    type: 'drum',
    rarity: 'uncommon',
    beats: 4,
    mana: 1,
    description: 'Permanent: +1 to every beat',
    effects: [
      { type: 'beatBonus', value: 1, beats: [0, 1, 2, 3] } // All beats
    ],
  },

  tightBeat: {
    id: 'tightBeat',
    name: 'Tight beat',
    type: 'drum',
    rarity: 'uncommon',
    beats: 4,
    mana: 1,
    description: 'Permanent: 1 beat cards get +4. Cards cannot wrap',
    effects: [
      { type: 'conditionalBeatBonus', value: 4, condition: 'oneBeat' },
      { type: 'preventWrap' }
    ],
  },

  reggaeBeat: {
    id: 'reggaeBeat',
    name: 'Reggae beat',
    type: 'drum',
    rarity: 'rare',
    beats: 4,
    mana: 3,
    description: 'Permanent: Bassline cards have Delay 1',
    effects: [
      { type: 'giveTypeDelay', cardType: 'bass', value: 1 }
    ],
  },

  drumRoll: {
    id: 'drumRoll',
    name: 'Drum roll',
    type: 'drum',
    rarity: 'rare',
    beats: 4,
    mana: 3,
    description: 'Gain Crescendo 4 for this turn only',
    effects: [
      { type: 'crescendo', value: 4 }
    ],
  },
};

// Roll a rarity based on weighted chances: 60% common, 37% uncommon, 3% rare
function rollRarity() {
  const roll = Math.random() * 100;
  if (roll < 60) return 'common';
  if (roll < 97) return 'uncommon';
  return 'rare';
}

// Pick N unique reward cards from the non-starter pool, weighted by rarity
export function getRewardCards(count = 3) {
  const pool = Object.entries(CARDS).filter(([key, card]) => card.rarity !== 'starter');
  const rewards = [];
  const usedKeys = new Set();

  for (let i = 0; i < count; i++) {
    const rarity = rollRarity();
    let candidates = pool.filter(([key, card]) => card.rarity === rarity && !usedKeys.has(key));
    if (candidates.length === 0) {
      candidates = pool.filter(([key]) => !usedKeys.has(key));
    }
    if (candidates.length === 0) break;

    const [key] = candidates[Math.floor(Math.random() * candidates.length)];
    rewards.push(key);
    usedKeys.add(key);
  }

  return rewards;
}

// Helper to get card color based on type and rarity
export function getCardColor(card) {
  const baseColors = {
    rhythm: [220, 50, 50],    // Red
    bass: [50, 150, 220],      // Blue
    utility: [150, 220, 50],   // Green
    drum: [180, 120, 50],      // Orange/Brown
  };

  const rarityMultipliers = {
    common: 1.0,
    uncommon: 1.15,
    rare: 1.3,
  };

  const baseColor = baseColors[card.type] || [150, 150, 150];
  const multiplier = rarityMultipliers[card.rarity] || 1.0;

  return baseColor.map(c => Math.min(255, c * multiplier));
}

// Helper to get rarity border color
export function getRarityBorderColor(rarity) {
  switch (rarity) {
    case 'common':
      return [100, 100, 100];   // Gray
    case 'uncommon':
      return [50, 200, 255];    // Cyan
    case 'rare':
      return [255, 215, 0];     // Gold
    default:
      return [255, 255, 255];   // White
  }
}
