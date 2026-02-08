// Game over scene (victory or defeat)

export function gameOverScene(k) {
  k.scene('gameover', (data) => {
    const { gameState } = data;

    // Background
    k.add([
      k.rect(k.width(), k.height()),
      k.color(20, 20, 30),
      k.pos(0, 0),
    ]);

    k.add([
      k.text('DEFEATED', { size: 64 }),
      k.pos(k.width() / 2, 200),
      k.anchor('center'),
      k.color(255, 100, 100),
    ]);

    // Stats
    const fightsWon = (gameState.fightNumber || 1) - 1;
    const statsY = 320;
    k.add([
      k.text(`Fights Won: ${fightsWon}`, { size: 24 }),
      k.pos(k.width() / 2, statsY),
      k.anchor('center'),
      k.color(200, 200, 200),
    ]);

    k.add([
      k.text(`Final Deck Size: ${gameState.deck.length}`, { size: 24 }),
      k.pos(k.width() / 2, statsY + 40),
      k.anchor('center'),
      k.color(200, 200, 200),
    ]);

    // Return to menu button
    const menuBtn = k.add([
      k.rect(280, 70),
      k.pos(k.width() / 2, 500),
      k.anchor('center'),
      k.color(80, 80, 150),
      k.outline(3, k.WHITE),
      k.area(),
      'menuButton',
    ]);

    menuBtn.add([
      k.text('RETURN TO MENU', { size: 24 }),
      k.anchor('center'),
      k.color(k.WHITE),
    ]);

    menuBtn.onHoverUpdate(() => {
      menuBtn.color = k.rgb(100, 100, 180);
      k.setCursor('pointer');
    });

    menuBtn.onHoverEnd(() => {
      menuBtn.color = k.rgb(80, 80, 150);
      k.setCursor('default');
    });

    menuBtn.onClick(() => {
      k.go('menu');
    });
  });
}
