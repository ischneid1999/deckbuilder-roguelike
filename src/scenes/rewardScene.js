// Reward scene - Pick a card after defeating an enemy

import { CARDS, getRewardCards, getCardColor, getRarityBorderColor } from '../config/cardData.js';

export function rewardScene(k) {
  k.scene('reward', (data) => {
    const { gameState } = data;

    // Dark background
    k.add([
      k.rect(k.width(), k.height()),
      k.color(10, 10, 20),
      k.pos(0, 0),
    ]);

    // Victory title
    k.add([
      k.text('VICTORY!', { size: 56 }),
      k.pos(k.width() / 2, 80),
      k.anchor('center'),
      k.color(100, 255, 100),
    ]);

    // Stats line
    k.add([
      k.text(`HP: ${gameState.currentHP}/${gameState.maxHP}  |  Deck: ${gameState.deck.length} cards  |  Fight ${gameState.fightNumber - 1} cleared`, { size: 18 }),
      k.pos(k.width() / 2, 140),
      k.anchor('center'),
      k.color(180, 180, 180),
    ]);

    // Subtitle
    k.add([
      k.text('Choose a card to add to your deck:', { size: 22 }),
      k.pos(k.width() / 2, 190),
      k.anchor('center'),
      k.color(255, 220, 100),
    ]);

    // Roll 3 reward cards
    const rewardKeys = getRewardCards(3);

    const cardWidth = 150;
    const cardHeight = 210;
    const cardSpacing = 220;
    const cardY = 380;
    const startX = k.width() / 2 - (rewardKeys.length - 1) * cardSpacing / 2;

    rewardKeys.forEach((cardKey, i) => {
      const cardData = CARDS[cardKey];
      if (!cardData) return;

      const cx = startX + i * cardSpacing;
      const bgColor = getCardColor(cardData);
      const borderColor = getRarityBorderColor(cardData.rarity);

      // Card background
      const card = k.add([
        k.rect(cardWidth, cardHeight, { radius: 6 }),
        k.pos(cx, cardY),
        k.anchor('center'),
        k.color(...bgColor),
        k.outline(4, k.rgb(...borderColor)),
        k.area(),
        k.scale(1),
        k.z(10),
      ]);

      // Mana cost circle
      card.add([
        k.circle(20),
        k.pos(-cardWidth / 2 + 24, -cardHeight / 2 + 24),
        k.color(100, 200, 255),
        k.outline(2, k.BLACK),
        k.z(1),
      ]);

      card.add([
        k.text(cardData.mana.toString(), { size: 22, font: 'sans-serif' }),
        k.pos(-cardWidth / 2 + 24, -cardHeight / 2 + 24),
        k.anchor('center'),
        k.color(k.WHITE),
        k.z(2),
      ]);

      // Beats indicator
      if (cardData.type !== 'utility' && cardData.beats > 0) {
        card.add([
          k.rect(40, 26, { radius: 3 }),
          k.pos(cardWidth / 2 - 26, -cardHeight / 2 + 24),
          k.anchor('center'),
          k.color(0, 0, 0, 150),
          k.outline(1, k.rgb(200, 200, 200)),
          k.z(1),
        ]);

        card.add([
          k.text(`${cardData.beats}♪`, { size: 18, font: 'sans-serif' }),
          k.pos(cardWidth / 2 - 26, -cardHeight / 2 + 24),
          k.anchor('center'),
          k.color(k.WHITE),
          k.z(2),
        ]);
      }

      // Card name
      card.add([
        k.text(cardData.name, { size: 16, font: 'sans-serif', width: cardWidth - 14 }),
        k.pos(0, -cardHeight / 2 + 58),
        k.anchor('center'),
        k.color(k.BLACK),
        k.z(1),
      ]);

      // Type badge
      const typeColors = {
        rhythm: [220, 50, 50],
        bass: [50, 150, 220],
        utility: [150, 220, 50],
      };

      card.add([
        k.rect(cardWidth - 14, 20, { radius: 3 }),
        k.pos(0, -cardHeight / 2 + 82),
        k.anchor('center'),
        k.color(...(typeColors[cardData.type] || [100, 100, 100])),
        k.z(1),
      ]);

      card.add([
        k.text(cardData.type.toUpperCase(), { size: 12, font: 'sans-serif' }),
        k.pos(0, -cardHeight / 2 + 82),
        k.anchor('center'),
        k.color(k.BLACK),
        k.z(2),
      ]);

      // Rarity label
      card.add([
        k.text(cardData.rarity.toUpperCase(), { size: 10, font: 'sans-serif' }),
        k.pos(0, -cardHeight / 2 + 102),
        k.anchor('center'),
        k.color(...borderColor),
        k.z(1),
      ]);

      // Description
      card.add([
        k.text(cardData.description, {
          size: 13,
          font: 'sans-serif',
          width: cardWidth - 24,
          lineSpacing: 3,
        }),
        k.pos(0, 20),
        k.anchor('center'),
        k.color(k.BLACK),
        k.z(1),
      ]);

      // Hover effect
      card.onHoverUpdate(() => {
        card.scale = k.vec2(1.1, 1.1);
        card.z = 20;
        card.outline.width = 6;
        k.setCursor('pointer');
      });

      card.onHoverEnd(() => {
        card.scale = k.vec2(1, 1);
        card.z = 10;
        card.outline.width = 4;
        k.setCursor('default');
      });

      // Click to pick this card
      card.onClick(() => {
        gameState.deck.push(cardKey);
        startNextFight();
      });
    });

    // Skip button
    const skipBtn = k.add([
      k.rect(180, 50, { radius: 4 }),
      k.pos(k.width() / 2, 560),
      k.anchor('center'),
      k.color(80, 80, 80),
      k.outline(2, k.rgb(150, 150, 150)),
      k.area(),
      k.z(10),
    ]);

    skipBtn.add([
      k.text('SKIP', { size: 22, font: 'sans-serif' }),
      k.anchor('center'),
      k.color(200, 200, 200),
    ]);

    skipBtn.onHoverUpdate(() => {
      skipBtn.color = k.rgb(100, 100, 100);
      k.setCursor('pointer');
    });

    skipBtn.onHoverEnd(() => {
      skipBtn.color = k.rgb(80, 80, 80);
      k.setCursor('default');
    });

    skipBtn.onClick(() => {
      startNextFight();
    });

    // Current deck preview label
    k.add([
      k.text(`Current deck (${gameState.deck.length} cards):`, { size: 14 }),
      k.pos(k.width() / 2, 620),
      k.anchor('center'),
      k.color(120, 120, 120),
    ]);

    // Show deck summary
    const deckSummary = {};
    gameState.deck.forEach(key => {
      const name = CARDS[key] ? CARDS[key].name : key;
      deckSummary[name] = (deckSummary[name] || 0) + 1;
    });
    const summaryText = Object.entries(deckSummary).map(([name, count]) => `${count}x ${name}`).join(', ');

    k.add([
      k.text(summaryText, { size: 12, width: k.width() - 100 }),
      k.pos(k.width() / 2, 650),
      k.anchor('center'),
      k.color(100, 100, 100),
    ]);

    function startNextFight() {
      k.go('combat', { gameState });
    }
  });
}
