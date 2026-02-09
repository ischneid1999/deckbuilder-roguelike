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
          });
        }

        // Add click handler to pick up the card again
        this.setupPlacedCardPickup(card, hand, combatState);

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
        this.executeCardEffects(card, combatState);

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
    executeCardEffects(card, combatState) {
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
        }
      });
    },

    // Setup click handler for placed cards to pick them back up
    setupPlacedCardPickup(card, hand, combatState) {
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

      // Remove old click handler by replacing it
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

        // Can't pick up looping cards after they've started looping
        if (!card.canPickUp) {
          console.log('Cannot pick up looping card:', card.cardData.name, 'loops remaining:', card.loopCount);
          return;
        }

        console.log('Picking up placed card:', card.cardData.name);

        // Remove from measure
        measureUI.removeCard(card, card.placedTrack);

        // Refund mana
        combatState.mana = Math.min(combatState.maxMana, combatState.mana + card.cardData.mana);

        // Reset card state
        card.isPlaced = false;
        card.placedTrack = null;
        card.placedBeat = null;

        // Reset scale
        if (card.scale) {
          card.scale.x = 1;
          card.scale.y = 1;
        }

        // Add back to hand at original position
        const insertIndex = Math.min(card.originalHandIndex !== undefined ? card.originalHandIndex : hand.length, hand.length);
        hand.splice(insertIndex, 0, card);

        // Re-setup drag for the card BEFORE layoutHand
        this.setupCardDrag(card, hand, combatState);

        // Start dragging immediately at mouse position
        const mousePos = k.mousePos();
        draggedCard = card;
        isDragging = true;
        card.isDragging = true;
        card.angle = 0;
        card.z = 100;
        
        // Set card position to mouse with no offset (feels more natural)
        dragOffset = k.vec2(0, 0);
        card.pos = mousePos;
        
        k.setCursor('grabbing');

        // Layout hand but it won't affect the dragging card
        cardSystem.layoutHand(hand);
      });
    },
  };
}
