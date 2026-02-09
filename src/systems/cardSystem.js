// Card rendering and interaction system

import { getCardColor, getRarityBorderColor } from '../config/cardData.js';

export function createCardSystem(k) {
  const handScale = 1;
  const hoverScale = 1.5;
  let currentlyHoveredCard = null; // Track which card is currently hovered

  return {
    // Create a visual card object
    createCard(cardData, x, y, isDraggable = true) {
      const cardWidth = 110;
      const cardHeight = 150;
      const borderColor = getRarityBorderColor(cardData.rarity);
      const bgColor = getCardColor(cardData);

      const card = k.add([
        k.rect(cardWidth, cardHeight, { radius: 4 }),
        k.pos(x, y),
        k.anchor('center'),
        k.color(...bgColor),
        k.outline(3, k.rgb(...borderColor)),
        k.area(),
        k.scale(1),
        k.rotate(0),
        k.z(10),
        isDraggable ? 'draggableCard' : 'card',
        {
          cardData: cardData,
          isDragging: false,
          originalPos: k.vec2(x, y),
          hoverY: y - 30,
          normalY: y,
          originalScale: 1,
          fanRotation: 0,
          handScale: handScale,
        }
      ]);

      // Mana cost circle (top-left)
      card.add([
        k.circle(16),
        k.pos(-cardWidth/2 + 20, -cardHeight/2 + 20),
        k.color(100, 200, 255),
        k.outline(2, k.BLACK),
        k.z(1),
      ]);

      card.add([
        k.text(cardData.mana.toString(), { size: 24, font: 'sans-serif' }),
        k.pos(-cardWidth/2 + 20, -cardHeight/2 + 20),
        k.anchor('center'),
        k.color(k.WHITE),
        k.z(2),
      ]);

      // Beats indicator (top-right) - only for rhythm/bass cards
      if (cardData.type !== 'utility' && cardData.beats > 0) {
        card.add([
          k.rect(30, 20, { radius: 2 }),
          k.pos(cardWidth/2 - 20, -cardHeight/2 + 20),
          k.anchor('center'),
          k.color(0, 0, 0, 150),
          k.outline(1, k.rgb(200, 200, 200)),
          k.z(1),
        ]);

        card.add([
          k.text(`${cardData.beats}♪`, { size: 18, font: 'sans-serif' }),
          k.pos(cardWidth/2 - 20, -cardHeight/2 + 20),
          k.anchor('center'),
          k.color(k.WHITE),
          k.z(2),
        ]);
      }

      // Card name
      card.add([
        k.text(cardData.name, { size: 16, font: 'sans-serif', width: cardWidth - 10 }),
        k.pos(0, -cardHeight/2 + 45),
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
        k.rect(cardWidth - 10, 16, { radius: 2 }),
        k.pos(0, -cardHeight/2 + 65),
        k.anchor('center'),
        k.color(...(typeColors[cardData.type] || [100, 100, 100])),
        k.z(1),
      ]);

      card.add([
        k.text(cardData.type.toUpperCase(), { size: 13, font: 'sans-serif' }),
        k.pos(0, -cardHeight/2 + 65),
        k.anchor('center'),
        k.color(k.BLACK),
        k.z(2),
      ]);

      // Description
      card.add([
        k.text(cardData.description, {
          size: 12,
          font: 'sans-serif',
          width: cardWidth - 20,
          lineSpacing: 3,
        }),
        k.pos(0, 10),
        k.anchor('center'),
        k.color(k.BLACK),
        k.z(1),
      ]);

      // Loop count indicator (dynamic, shown when loopCount > 0)
      card.add([
        k.pos(0, cardHeight/2 - 15),
        k.z(3),
        {
          draw() {
            if (card.loopCount && card.loopCount > 0) {
              const loopBgWidth = 50;
              const loopBgHeight = 18;

              k.drawRect({
                pos: k.vec2(-loopBgWidth/2, -loopBgHeight/2),
                width: loopBgWidth,
                height: loopBgHeight,
                radius: 3,
                color: k.rgb(255, 215, 0),
                outline: { width: 2, color: k.BLACK },
              });

              k.drawText({
                text: `LOOP ${card.loopCount}`,
                size: 14,
                font: 'sans-serif',
                anchor: 'center',
                color: k.BLACK,
              });
            }
          }
        }
      ]);

      // Hover effect (if draggable)
      // Scale up in place (don't move position) so the enlarged area
      // fully covers the small card - prevents hover flicker
      if (isDraggable) {
        card.onHoverUpdate(() => {
          if (!card.isDragging && !card.isPlaced) {
            // Only allow hover if no other card is currently hovered, or this is the hovered card
            if (currentlyHoveredCard === null || currentlyHoveredCard === card) {
              currentlyHoveredCard = card;
              card.z = 200; // High enough to be above all hand cards (which are 100-down)
              card.scale.x = hoverScale;
              card.scale.y = hoverScale;
              card.angle = 0;
              k.setCursor('grab');
            }
          }
        });

        card.onHoverEnd(() => {
          if (!card.isDragging && !card.isPlaced) {
            // Only end hover if this card is the currently hovered one
            if (currentlyHoveredCard === card) {
              currentlyHoveredCard = null;
              // Restore original z-index from hand position
              card.z = card.handZIndex || 10;
              card.scale.x = card.handScale;
              card.scale.y = card.handScale;
              card.angle = card.fanRotation;
              k.setCursor('default');
            }
          }
        });
      }

      return card;
    },

    // Layout cards in a fan shape
    layoutHand(cards, handY = 660) {
      const cardCount = cards.length;
      if (cardCount === 0) return;

      const spacing = Math.min(120, 700 / cardCount); // Increased from 80 and 500
      const fanAngle = 6; // degrees between cards
      const arcDrop = 10; // how much outer cards drop
      const startX = k.width() / 2 - ((cardCount - 1) * spacing) / 2;

      cards.forEach((card, i) => {
        const centerIndex = (cardCount - 1) / 2;
        const offset = i - centerIndex;
        const rotation = offset * fanAngle;
        const yOffset = Math.abs(offset) * arcDrop;

        const targetX = startX + i * spacing;
        const targetY = handY + yOffset;

        card.originalPos = k.vec2(targetX, targetY);
        card.fanRotation = rotation;
        card.handScale = handScale;

        // Leftmost cards get higher z-index (on top)
        // Use high base value (100) and count down
        const zIndex = 100 - i;
        card.handZIndex = zIndex;

        if (!card.isDragging && !card.isPlaced) {
          card.pos = k.vec2(targetX, targetY);
          card.normalY = targetY;
          card.hoverY = handY - 180; // Increased from -80 to show 3/4 of card
          card.scale.x = handScale;
          card.scale.y = handScale;
          card.angle = rotation;
          card.z = zIndex;
        }
      });
    },
  };
}
