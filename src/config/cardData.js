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
    beats: 1,
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
    id: 'quickHit',
    name: 'Quick Hit',
    type: 'rhythm',
    rarity: 'common',
    beats: 1,
    mana: 0,
    description: 'Deal 3 damage',
    effects: [
      { type: 'damage', value: 3, target: 'enemy' }
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
    description: 'Deal 3 damage every beat',
    effects: [
      { type: 'damagePerBeat', value: 3, target: 'enemy' }
    ],
  },

  violentRiff: {
    id: 'violentRiff',
    name: 'Violent Riff',
    type: 'rhythm',
    rarity: 'common',
    beats: 3,
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
    beats: 2,
    mana: 2,
    description: 'Deal 5 damage. Delay enemy attacks 1 beat.',
    effects: [
      { type: 'damage', value: 5, target: 'enemy' },
      { type: 'delayEnemy', value: 1 }
    ],
  },

  outro: {
    id: 'outro',
    name: 'Outro',
    type: 'rhythm',
    rarity: 'common',
    beats: 1,
    mana: 1,
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
    description: 'Deal 4 damage. Next loop deals double damage.',
    effects: [
      { type: 'damage', value: 4, target: 'enemy' },
      { type: 'doubleDamageNext' }
    ],
  },

  // ===== BASS CARDS (Block/Defense) =====

  bassLine: {
    id: 'bassLine',
    name: 'Bass Line',
    type: 'bass',
    rarity: 'starter',
    beats: 1,
    mana: 1,
    description: 'Gain 5 block',
    effects: [
      { type: 'block', value: 5, target: 'player' }
    ],
  },

  deepBass: {
    id: 'deepBass',
    name: 'Deep Bass',
    type: 'bass',
    rarity: 'common',
    beats: 2,
    mana: 2,
    description: 'Gain 12 block',
    effects: [
      { type: 'block', value: 12, target: 'player' }
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

  // ===== COMBO CARDS (Synergy effects) =====

  harmony: {
    id: 'harmony',
    name: 'Harmony',
    type: 'rhythm',
    rarity: 'rare',
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
    rarity: 'rare',
    beats: 1,
    mana: 1,
    description: 'Gain 3 block. Draw 1 card.',
    effects: [
      { type: 'block', value: 3, target: 'player' },
      { type: 'draw', value: 1, target: 'player' }
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
