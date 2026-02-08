// Main entry point - Initialize Kaplay and register scenes

import kaplay from 'kaplay';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/gameConfig.js';
import { menuScene } from './scenes/menuScene.js';
import { combatScene } from './scenes/combatScene.js';
import { rewardScene } from './scenes/rewardScene.js';
import { gameOverScene } from './scenes/gameOverScene.js';

// Initialize Kaplay
const k = kaplay({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  background: COLORS.background,
  crisp: true,
  scale: 1,
  letterbox: true,
});

// Make k globally available for debugging (optional)
window.k = k;

// Register all scenes
menuScene(k);
combatScene(k);
rewardScene(k);
gameOverScene(k);

// Start at menu
k.go('menu');
