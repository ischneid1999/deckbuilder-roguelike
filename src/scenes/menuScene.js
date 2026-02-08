// Main menu scene

import { STARTING_DECK, GAME_STATE_DEFAULTS } from '../config/gameConfig.js';

export function menuScene(k) {
  k.scene('menu', () => {
    // Background
    k.add([
      k.rect(k.width(), k.height()),
      k.color(20, 20, 30),
      k.pos(0, 0),
      k.z(0),
    ]);

    // Title
    k.add([
      k.text('DECKBUILDER ROGUELIKE', { size: 48 }),
      k.pos(k.width() / 2, 200),
      k.anchor('center'),
      k.color(255, 200, 100),
    ]);

    // Subtitle
    k.add([
      k.text('A card-based dungeon crawler', { size: 20 }),
      k.pos(k.width() / 2, 260),
      k.anchor('center'),
      k.color(200, 200, 200),
    ]);

    // Start button
    const startBtn = k.add([
      k.rect(250, 70),
      k.pos(k.width() / 2, 400),
      k.anchor('center'),
      k.color(80, 150, 80),
      k.outline(3, k.WHITE),
      k.area(),
      k.z(1),
      'startButton',
    ]);

    startBtn.add([
      k.text('START GAME', { size: 28 }),
      k.anchor('center'),
      k.color(k.WHITE),
    ]);

    // Hover effect
    startBtn.onHoverUpdate(() => {
      startBtn.color = k.rgb(100, 180, 100);
      k.setCursor('pointer');
    });

    startBtn.onHoverEnd(() => {
      startBtn.color = k.rgb(80, 150, 80);
      k.setCursor('default');
    });

    // Click to start
    startBtn.onClick(() => {
      const gameState = initializeGameState();
      k.go('combat', { gameState });
    });

    // Instructions
    k.add([
      k.text('Build your deck. Defeat enemies. Survive!', { size: 16 }),
      k.pos(k.width() / 2, 550),
      k.anchor('center'),
      k.color(150, 150, 150),
    ]);
  });
}

function initializeGameState() {
  return {
    deck: [...STARTING_DECK],
    maxHP: GAME_STATE_DEFAULTS.maxHP,
    currentHP: GAME_STATE_DEFAULTS.maxHP,
    maxEnergy: GAME_STATE_DEFAULTS.maxEnergy,
    currentFloor: 1,
    fightNumber: 1,
  };
}
