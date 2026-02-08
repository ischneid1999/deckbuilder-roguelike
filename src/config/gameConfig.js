// Game configuration constants

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const COLORS = {
  background: [20, 20, 30],
  text: [255, 255, 255],
  cardAttack: [220, 50, 50],
  cardDefend: [50, 150, 220],
  cardSpecial: [150, 100, 220],
  energy: [100, 200, 255],
  hp: [200, 50, 50],
  block: [100, 150, 255],
  enemy: [100, 255, 100],
  button: [80, 150, 80],
  buttonHover: [100, 180, 100],
};

export const STARTING_DECK = [
  'basicBeat', 'basicBeat', 'basicBeat', 'basicBeat', 'basicBeat', 'basicBeat', 'basicBeat',
  'bassLine', 'bassLine', 'bassLine', 'bassLine', 'bassLine', 'bassLine', 'bassLine',
];

export const GAME_STATE_DEFAULTS = {
  maxHP: 60,
  maxEnergy: 3,
};
