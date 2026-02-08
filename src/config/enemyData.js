// Enemy definitions
//
// Enemy actions happen on specific beats of the measure.
// Each turn, generateActions() creates an array of beat-actions.
// Players can see what beat the enemy acts on, so they can plan around it.

export const ENEMIES = {
  slime: {
    id: 'slime',
    name: 'Slime',
    maxHP: 30,
    color: [100, 255, 100],
    // Generates actions for each loop. Returns array of { beat, type, value }
    generateActions(turnNumber) {
      // Slime: attacks on beat 2, sometimes defends on beat 0
      if (turnNumber % 3 === 2) {
        return [
          { beat: 0, type: 'block', value: 4 },
          { beat: 2, type: 'attack', value: 4 },
        ];
      }
      return [
        { beat: 2, type: 'attack', value: 6 },
      ];
    },
  },

  goblin: {
    id: 'goblin',
    name: 'Goblin',
    maxHP: 40,
    color: [150, 100, 50],
    generateActions(turnNumber) {
      // Goblin: fast attacks on multiple beats
      if (turnNumber % 2 === 0) {
        return [
          { beat: 1, type: 'attack', value: 4 },
          { beat: 3, type: 'attack', value: 4 },
        ];
      }
      return [
        { beat: 0, type: 'attack', value: 8 },
        { beat: 2, type: 'block', value: 5 },
      ];
    },
  },

  eliteSlime: {
    id: 'eliteSlime',
    name: 'Elite Slime',
    maxHP: 60,
    color: [50, 200, 100],
    generateActions(turnNumber) {
      // Elite: heavy hits spread across the measure
      const patterns = [
        [
          { beat: 0, type: 'attack', value: 6 },
          { beat: 2, type: 'attack', value: 6 },
        ],
        [
          { beat: 1, type: 'block', value: 6 },
          { beat: 3, type: 'attack', value: 10 },
        ],
        [
          { beat: 0, type: 'attack', value: 4 },
          { beat: 1, type: 'attack', value: 4 },
          { beat: 2, type: 'attack', value: 4 },
        ],
      ];
      return patterns[turnNumber % patterns.length];
    },
  },
};
