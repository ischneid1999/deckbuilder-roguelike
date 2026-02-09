// Drag and drop system for cards

export function createDragDropSystem(k, measureUI, cardSystem) {
  let draggedCard = null;
  let dragOffset = k.vec2(0, 0);
  let isDragging = false;

  return {
    // Initialize drag and drop for a card
    setupCardDrag(card, hand, combatState) {
      // Store references for event handlers
      card.hand = hand;
      card.combatState = combatState;

      // Click to start dragging
      card.onClick(() => {
        console.log('Card clicked:', card.cardData.name);

        if (combatState.currentTurn !== 'player') {
          console.log('Not player turn');
          return;
        }

        // Don't start dragging if card is already placed
        if (card.isPlaced) {
          console.log('Card is placed, not dragging');
          return;
        }

        // Start dragging
        console.log('Starting drag');
        draggedCard = card;
        isDragging = true;
        card.isDragging = true;

        // Reset fan rotation and scale for dragging
        card.angle = 0;
        card.scale.x = 1;
        card.scale.y = 1;

        const mousePos = k.mousePos();
        dragOffset = card.pos.sub(mousePos);
        card.z = 100;
        k.setCursor('grabbing');
      });
    },

    // Update dragging cards (call in scene update)
    update(hand, combatState) {
      if (isDragging && draggedCard) {
        // Update card position to follow mouse
        const mousePos = k.mousePos();
        draggedCard.pos = mousePos.add(dragOffset);
      }
    },

    // Handle mouse release (call from scene's global onMouseRelease)
    handleMouseRelease(hand, combatState) {
      if (!isDragging || !draggedCard) return;

      console.log('Mouse released');

      const card = draggedCard;
      const mousePos = k.mousePos();
      console.log('Release position:', mousePos.x, mousePos.y);

      // Check if card is over measure
      const isOverRhythm = this.isOverTrack(mousePos, 'rhythm');
      const isOverBass = this.isOverTrack(mousePos, 'bass');
      const isOverDrum = this.isOverTrack(mousePos, 'drum');
      console.log('Over rhythm:', isOverRhythm, 'Over bass:', isOverBass);

      let placed = false;

      // Try to place card on rhythm track
      if (isOverRhythm && card.cardData.type === 'rhythm') {
        placed = this.tryPlaceCard(card, 'rhythm', mousePos, hand, combatState);
      }
      // Try to place card on bass track
      else if (isOverBass && card.cardData.type === 'bass') {
        placed = this.tryPlaceCard(card, 'bass', mousePos, hand, combatState);
      }
      // Try to place drum card on drum track
      else if (isOverDrum && card.cardData.type === 'drum') {
        placed = this.placeDrumCard(card, hand, combatState);
      }
      // Utility cards play immediately when clicked
      else if (card.cardData.type === 'utility' && !isOverRhythm && !isOverBass) {
        placed = this.playUtilityCard(card, hand, combatState);
      }

      // If not placed, return to hand with fan layout
      if (!placed) {
        card.pos = card.originalPos;
        card.z = 10;
        card.scale.x = card.handScale;
        card.scale.y = card.handScale;
        card.angle = card.fanRotation;
        cardSystem.layoutHand(hand);
      }

      // Reset drag state
      card.isDragging = false;
      isDragging = false;
      draggedCard = null;
      k.setCursor('default');

      // Re-layout hand
      cardSystem.layoutHand(hand);
    },

    // Check if mouse is over a track
    isOverTrack(mousePos, track) {
      const y = track === 'rhythm'
        ? measureUI.measureY
        : measureUI.measureY + measureUI.trackHeight + 20;

      const inYRange = mousePos.y >= y && mousePos.y <= y + measureUI.trackHeight;
      const inXRange = mousePos.x >= measureUI.measureX && mousePos.x <= measureUI.measureX + 800;

      return inYRange && inXRange;
    },

 // Place drum card on drum track (permanent)
    placeDrumCard(card, hand, combatState) {
      console.log('Trying to place drum card');

      if (combatState.mana >= card.cardData.mana) {
        // Spend mana
        combatState.mana -= card.cardData.mana;

        // Check for crescendo effect (applies immediately)
        const crescendoEffect = card.cardData.effects.find(e => e.type === 'crescendo');
        if (crescendoEffect) {
          combatState.crescendo += crescendoEffect.value;
          measureUI.setCrescendo(combatState.crescendo);
          console.log(`${card.cardData.name}: Added ${crescendoEffect.value} crescendo (now ${combatState.crescendo})`);
        }

        // Add to drum track (permanent)
        measureUI.addDrumCard(card);

        // Remove from hand
        const index = hand.indexOf(card);
        if (index !== -1) {
          hand.splice(index, 1);
        }

        // Mark as placed and permanent (won't be discarded)
        card.isPlaced = true;
        card.placedTrack = 'drum';
        card.isPermanent = true; // Drum cards stay on track forever
        card.angle = 0;

        console.log('Drum card placed successfully!');
        return true;
      }

      console.log('Cannot place drum card - not enough mana');
      return false;
    },

   // Try to place card on track
    tryPlaceCard(card, track, mousePos, hand, combatState) {
      const beat = measureUI.getBeatFromX(mousePos.x, track === 'rhythm');
      console.log('Trying to place at beat:', beat);

      if (beat === -1) {
        console.log('Beat is -1, outside measure');
        return false;
      }

      const canPlace = measureUI.canPlaceCard(track, beat, card.cardData.beats);
      console.log('Can place:', canPlace, 'Mana:', combatState.mana, 'Cost:', card.cardData.mana);

      if (canPlace && combatState.mana >= card.cardData.mana) {
        // Spend mana
        combatState.mana -= card.cardData.mana;

        // Place card
        measureUI.placeCard(card, track, beat);

        // Store original hand index before removing
        const index = hand.indexOf(card);
        card.originalHandIndex = index;

        // Remove from hand
        if (index !== -1) {
          hand.splice(index, 1);
        }

        // Mark as placed
        card.isPlaced = true;
        card.placedTrack = track;
        card.placedBeat = beat;
        card.angle = 0;
        card.canPickUp = true; // Can always pick up on the turn it's placed

        // Check for loop effects and set initial loop count
        card.loopCount = 0;
        let hasReverb = false;
        let echoEffect = null;
        let hasImprovise = false;
        if (card.cardData.effects) {
          card.cardData.effects.forEach(effect => {
            // Draw effects happen immediately, not during beat resolution
            if (effect.type === 'draw') {
              if (combatState.drawCards) {
                combatState.drawCards(effect.value);
                console.log(`${card.cardData.name}: Drew ${effect.value} card(s) instantly`);
              }
            }
            // Set loop count for looping cards
            if (effect.type === 'loop') {
              card.loopCount = effect.value;
              console.log(`${card.cardData.name}: Loop ${effect.value} set`);
            }
            // Check for reverb
            if (effect.type === 'reverb') {
              hasReverb = true;
            }
            // Check for echo
            if (effect.type === 'echo') {
              echoEffect = effect;
            }
            // Check for improvise
            if (effect.type === 'improvise') {
              hasImprovise = true;
            }
          });
        }

        // Mark card as improvise if it has the effect
        if (hasImprovise) {
          card.hasImprovise = true;
          console.log(`${card.cardData.name}: Marked for improvise (will be removed from game)`);
        }

        // Handle echo: create echo entries for each beat the card occupies
        if (echoEffect) {
          // Find the primary effect value (block or damage)
          const primaryEffect = card.cardData.effects.find(e =>
            e.type === 'block' || e.type === 'damage' ||
            e.type === 'blockPerBeat' || e.type === 'damagePerBeat'
          );

          if (primaryEffect) {
            // Create echo entries for each beat the card occupies
            for (let i = 0; i < card.cardData.beats; i++) {
              const echoBeat = (beat + i) % 4; // Wrap around if needed
              measureUI.addEchoEffect({
                beat: echoBeat,
                type: echoEffect.echoType, // 'block' or 'damage'
                value: primaryEffect.value,
                remainingEchoes: echoEffect.echoCount
              });
            }
            console.log(`${card.cardData.name}: Created echo effects (${echoEffect.echoCount} echoes)`);
          }
        }

        // Handle reverb: create a temporary copy and add to hand
        if (hasReverb && !card.isReverbCopy) {
          // Create copy of card data without reverb effect
          const copyCardData = {
            ...card.cardData,
            effects: card.cardData.effects.filter(e => e.type !== 'reverb')
          };

          // Create the reverb copy
          const reverbCopy = cardSystem.createCard(copyCardData, 0, 0, true);
          reverbCopy.deckCardKey = card.deckCardKey; // Same deck key
          reverbCopy.isReverbCopy = true; // Mark as reverb copy
          reverbCopy.opacity = 0.7; // Make it transparent

          // Add to hand
          hand.push(reverbCopy);
          this.setupCardDrag(reverbCopy, hand, combatState);

          // Re-layout hand to show new card
          cardSystem.layoutHand(hand);

          console.log(`${card.cardData.name}: Created reverb copy`);
        }

        // Add click handler for targeting mode
        this.setupPlacedCardPickup(card, combatState);

        console.log('Card placed successfully!');
        return true;
      }

      if (!canPlace) {
        console.log('Cannot place - beats already occupied');
      } else {
        console.log('Cannot place - not enough mana');
      }

      return false;
    },

    // Play utility card immediately
    playUtilityCard(card, hand, combatState) {
      if (combatState.mana >= card.cardData.mana) {
        // Check if this is a targeting card (like Looper Pedal or Turn to 11)
        const hasTargetEffect = card.cardData.effects.some(e =>
          e.type === 'targetLoop' || e.type === 'targetDoubleDamage'
        );

        if (hasTargetEffect) {
          // Spend mana
          combatState.mana -= card.cardData.mana;

          // Remove from hand
          const index = hand.indexOf(card);
          if (index !== -1) {
            hand.splice(index, 1);
          }

          // Enter targeting mode
          combatState.targetingMode = true;
          combatState.targetingCard = card;

          // Store callback for when target is selected
          combatState.targetingCallback = (targetCard) => {
            // Apply the loop effect to the target
            const loopEffect = card.cardData.effects.find(e => e.type === 'targetLoop');
            if (loopEffect && targetCard.loopCount !== undefined) {
              targetCard.loopCount += loopEffect.value;
              console.log(`${card.cardData.name}: Added ${loopEffect.value} loop to ${targetCard.cardData.name}, now has ${targetCard.loopCount} loops`);
            }

            // Apply damage multiplier to the target
            const doubleDamageEffect = card.cardData.effects.find(e => e.type === 'targetDoubleDamage');
            if (doubleDamageEffect) {
              // Initialize damageMultiplier if not set
              if (!targetCard.damageMultiplier) {
                targetCard.damageMultiplier = 1;
              }
              targetCard.damageMultiplier *= doubleDamageEffect.value;
              console.log(`${card.cardData.name}: Multiplied damage of ${targetCard.cardData.name} by ${doubleDamageEffect.value}x, now ${targetCard.damageMultiplier}x`);

              // Update the card's description text to show the multiplier
              targetCard.get('*').forEach(child => {
                if (child.text && child.text.includes('Deal') || child.text && child.text.includes('damage')) {
                  // Find the description text element and add multiplier indicator
                  const originalDesc = child.text;
                  if (!originalDesc.includes('x)')) {
                    child.text = originalDesc + ` (x${targetCard.damageMultiplier})`;
                  }
                }
              });
            }

            // Destroy the utility card
            card.destroy();

            // Exit targeting mode
            combatState.targetingMode = false;
            combatState.targetingCard = null;
            combatState.targetingCallback = null;
          };

          return true;
        }

        // Non-targeting utility cards
        // Spend mana
        combatState.mana -= card.cardData.mana;

        // Execute effects immediately
        this.executeCardEffects(card, combatState, hand);

        // Remove from hand
        const index = hand.indexOf(card);
        if (index !== -1) {
          hand.splice(index, 1);
        }

        // Destroy card
        card.destroy();

        return true;
      }

      return false;
    },

    // Execute card effects
    executeCardEffects(card, combatState, hand) {
      card.cardData.effects.forEach(effect => {
        switch (effect.type) {
          case 'draw':
            if (combatState.drawCards) {
              combatState.drawCards(effect.value);
              console.log(`${card.cardData.name}: Drew ${effect.value} card(s)`);
            }
            break;
          case 'gainMana':
            combatState.mana += effect.value;
            console.log(`${card.cardData.name}: Gained ${effect.value} mana`);
            break;
          case 'drawPerSample':
            // Count cards on both rhythm and bass tracks
            const rhythmCards = measureUI.rhythmTrack.filter(c => c !== null).length;
            const bassCards = measureUI.bassTrack.filter(c => c !== null).length;
            const totalSamples = rhythmCards + bassCards;
            const cardsToDraw = effect.value + totalSamples;
            if (combatState.drawCards) {
              combatState.drawCards(cardsToDraw);
              console.log(`${card.cardData.name}: Drew ${cardsToDraw} cards (${effect.value} base + ${totalSamples} samples)`);
            }
            break;
          case 'weakenEnemy':
            combatState.enemyDamageReduction += effect.value;
            measureUI.setEnemyDamageReduction(combatState.enemyDamageReduction);
            console.log(`${card.cardData.name}: Enemy damage reduced by ${effect.value}, total reduction: ${combatState.enemyDamageReduction}`);
            break;
          case 'clearMeasure':
            console.log('Clear measure');
            break;
          case 'rewind':
            // Replay all cards from the last loop
            if (combatState.lastLoopCards && combatState.lastLoopCards.length > 0) {
              console.log(`${card.cardData.name}: Rewinding ${combatState.lastLoopCards.length} cards from last loop`);

              combatState.lastLoopCards.forEach(cardData => {
                // Create a temporary copy (similar to reverb)
                const rewindCopy = cardSystem.createCard(cardData, 0, 0, true);
                rewindCopy.deckCardKey = `rewind_${Math.random()}`; // Unique key
                rewindCopy.isReverbCopy = true; // Use same flag as reverb (temporary card)
                rewindCopy.opacity = 0.8; // Slightly transparent

                // Add to hand
                hand.push(rewindCopy);
                this.setupCardDrag(rewindCopy, hand, combatState);

                console.log(`  - Added ${cardData.name} to hand`);
              });

              // Re-layout hand to show new cards
              cardSystem.layoutHand(hand);
            } else {
              console.log(`${card.cardData.name}: No cards from last loop to rewind`);
            }
            break;
          case 'tutorType':
            // Find and draw a random card of the specified type from draw pile
            if (combatState.drawPile && combatState.drawPile.length > 0) {
              // Import cardData to check card types
              const { CARD_DATA } = require('../config/cardData.js');

              // Filter draw pile for cards matching the type
              const matchingCards = combatState.drawPile.filter(deckCardKey => {
                const cardId = deckCardKey.split('_')[0]; // Extract card ID from deck key
                const cardData = CARD_DATA[cardId];
                return cardData && cardData.type === effect.cardType;
              });

              if (matchingCards.length > 0) {
                // Pick a random matching card
                const randomIndex = Math.floor(Math.random() * matchingCards.length);
                const selectedKey = matchingCards[randomIndex];

                // Remove from draw pile
                const drawPileIndex = combatState.drawPile.indexOf(selectedKey);
                combatState.drawPile.splice(drawPileIndex, 1);

                // Get card data and create card object
                const cardId = selectedKey.split('_')[0];
                const selectedCardData = CARD_DATA[cardId];
                const tutorCard = cardSystem.createCard(selectedCardData, 0, 0, true);
                tutorCard.deckCardKey = selectedKey;

                // Add to hand
                hand.push(tutorCard);
                this.setupCardDrag(tutorCard, hand, combatState);

                // Re-layout hand
                cardSystem.layoutHand(hand);

                console.log(`${card.cardData.name}: Added ${selectedCardData.name} (${effect.cardType}) to hand from draw pile`);
              } else {
                console.log(`${card.cardData.name}: No ${effect.cardType} cards in draw pile`);
              }
            } else {
              console.log(`${card.cardData.name}: Draw pile is empty`);
            }
            break;
        }
      });
    },

    // Setup click handler for placed cards (for targeting only)
    setupPlacedCardPickup(card, combatState) {
      // Store original color for hover effect (extract RGB values from Color object)
      card.originalColor = card.color ? [card.color.r, card.color.g, card.color.b] : null;

      // Add hover handlers for targeting mode
      card.onHover(() => {
        if (combatState.targetingMode && card.isPlaced) {
          // Yellow highlight when targeting
          card.color = k.rgb(255, 255, 100);
        }
      });

      card.onHoverEnd(() => {
        if (combatState.targetingMode && card.isPlaced && card.originalColor) {
          // Restore original color
          card.color = k.rgb(...card.originalColor);
        }
      });

      // Click handler for targeting mode only (cards cannot be picked up once played)
      card.onClick(() => {
        if (combatState.currentTurn !== 'player') return;
        if (!card.isPlaced) return;

        // If in targeting mode, select this card as the target
        if (combatState.targetingMode) {
          console.log('Selected target:', card.cardData.name);
          if (combatState.targetingCallback) {
            combatState.targetingCallback(card);
          }
          // Restore original color after targeting
          if (card.originalColor) {
            card.color = k.rgb(...card.originalColor);
          }
          return;
        }

        // Cards cannot be picked up once played
        console.log('Card is locked in place:', card.cardData.name);
      });
    },
  };
}
