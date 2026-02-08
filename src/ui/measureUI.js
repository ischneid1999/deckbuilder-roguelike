// Measure UI - 4 beat measure with rhythm, bass, and enemy tracks

export function createMeasureUI(k) {
  const measureWidth = 800;
  const trackHeight = 110;
  const intentBarHeight = 40;
  const beatWidth = measureWidth / 4;
  const measureX = k.width() / 2 - measureWidth / 2;
  const measureY = 270;
  const totalMeasureHeight = trackHeight + 20 + trackHeight; // rhythm + gap + bass

  // Measure state
  const measureState = {
    rhythmTrack: [null, null, null, null],
    bassTrack: [null, null, null, null],
    enemyActions: [],       // Array of { beat, type, value }
    wrappedCards: [],        // Cards that wrap to next loop: { cardData, resolveBeat }
    wrappedEnemyActions: [], // Enemy actions delayed to next loop
    playheadBeat: -1,        // Current beat during playback (-1 = not playing)
    isPlaying: false,
  };

  // Create measure container
  const measure = k.add([
    k.pos(measureX, measureY),
    k.z(1),
    'measure',
    {
      state: measureState,
      draw() {
        // Draw occupied beat indicators
        for (let i = 0; i < 4; i++) {
          if (measureState.rhythmTrack[i] !== null) {
            k.drawRect({
              pos: k.vec2(i * beatWidth, 0),
              width: beatWidth,
              height: trackHeight,
              color: k.rgb(255, 255, 0, 30),
            });
          }
          if (measureState.bassTrack[i] !== null) {
            k.drawRect({
              pos: k.vec2(i * beatWidth, trackHeight + 20),
              width: beatWidth,
              height: trackHeight,
              color: k.rgb(255, 255, 0, 30),
            });
          }
        }

        // Draw playhead during loop playback
        if (measureState.isPlaying && measureState.playheadBeat >= 0) {
          const phX = measureState.playheadBeat * beatWidth;
          const fullHeight = intentBarHeight + 10 + totalMeasureHeight + 10 + intentBarHeight;
          const topY = -intentBarHeight - 10;
          // Playhead highlight
          k.drawRect({
            pos: k.vec2(phX, topY),
            width: beatWidth,
            height: fullHeight,
            color: k.rgb(255, 255, 255, 40),
          });
          // Playhead bar
          k.drawRect({
            pos: k.vec2(phX, topY),
            width: 4,
            height: fullHeight,
            color: k.rgb(255, 255, 100),
          });
        }
      }
    }
  ]);

  // Enemy intention bar (above rhythm)
  const enemyTrack = measure.add([
    k.rect(measureWidth, intentBarHeight, { radius: 4 }),
    k.pos(0, -intentBarHeight - 10),
    k.color(60, 30, 30),
    k.outline(2, k.rgb(200, 80, 80)),
    'enemyTrack',
  ]);

  enemyTrack.add([
    k.text('ENEMY', { size: 10, font: 'sans-serif' }),
    k.pos(10, 5),
    k.color(200, 80, 80),
  ]);

  for (let i = 1; i < 4; i++) {
    enemyTrack.add([
      k.rect(2, intentBarHeight),
      k.pos(i * beatWidth, 0),
      k.color(255, 255, 255, 50),
    ]);
  }

  // Enemy action display (drawn dynamically)
  measure.add([
    k.pos(0, -intentBarHeight - 10),
    k.z(3),
    {
      draw() {
        measureState.enemyActions.forEach(action => {
          const x = action.beat * beatWidth;
          const iconColor = action.type === 'attack'
            ? k.rgb(255, 80, 80)
            : k.rgb(80, 150, 255);
          const symbol = action.type === 'attack' ? `${action.value} DMG` : `${action.value} BLK`;

          k.drawRect({
            pos: k.vec2(x + 4, 4),
            width: beatWidth - 8,
            height: intentBarHeight - 8,
            color: iconColor,
            radius: 3,
          });

          k.drawText({
            text: symbol,
            pos: k.vec2(x + beatWidth / 2, intentBarHeight / 2),
            size: 12,
            anchor: 'center',
            font: 'sans-serif',
            color: k.rgb(255, 255, 255),
          });
        });
      }
    }
  ]);

  // Player intention bar (below bass)
  const playerIntentY = trackHeight + 20 + trackHeight + 10;

  const playerTrack = measure.add([
    k.rect(measureWidth, intentBarHeight, { radius: 4 }),
    k.pos(0, playerIntentY),
    k.color(30, 50, 30),
    k.outline(2, k.rgb(80, 200, 80)),
    'playerTrack',
  ]);

  playerTrack.add([
    k.text('PLAYER', { size: 10, font: 'sans-serif' }),
    k.pos(10, 5),
    k.color(80, 200, 80),
  ]);

  for (let i = 1; i < 4; i++) {
    playerTrack.add([
      k.rect(2, intentBarHeight),
      k.pos(i * beatWidth, 0),
      k.color(255, 255, 255, 50),
    ]);
  }

  // Player intention display (updates dynamically based on placed cards)
  measure.add([
    k.pos(0, playerIntentY),
    k.z(3),
    {
      draw() {
        // Build per-beat summary from placed cards
        for (let beat = 0; beat < 4; beat++) {
          const effects = [];

          // Check rhythm cards (resolve beat = all effects, occupied beat = per-beat only)
          const seenRhythm = new Set();
          measureState.rhythmTrack.forEach(c => {
            if (c && !seenRhythm.has(c)) {
              seenRhythm.add(c);
              const beatsInMeasure = Math.min(c.cardData.beats, 4 - c.startBeat);
              const occupiesBeat = beat >= c.startBeat && beat < c.startBeat + beatsInMeasure;
              const resolvesOnBeat = c.resolveBeat === beat && !c.wrapsAround;
              if (resolvesOnBeat) {
                c.cardData.effects.forEach(e => effects.push(e));
              } else if (occupiesBeat) {
                c.cardData.effects.filter(e => e.type === 'damagePerBeat').forEach(e => effects.push(e));
              }
            }
          });

          // Check bass cards
          const seenBass = new Set();
          measureState.bassTrack.forEach(c => {
            if (c && !seenBass.has(c)) {
              seenBass.add(c);
              const beatsInMeasure = Math.min(c.cardData.beats, 4 - c.startBeat);
              const occupiesBeat = beat >= c.startBeat && beat < c.startBeat + beatsInMeasure;
              const resolvesOnBeat = c.resolveBeat === beat && !c.wrapsAround;
              if (resolvesOnBeat) {
                c.cardData.effects.forEach(e => effects.push(e));
              } else if (occupiesBeat) {
                c.cardData.effects.filter(e => e.type === 'damagePerBeat').forEach(e => effects.push(e));
              }
            }
          });

          // Check wrapped cards from previous loop
          measureState.wrappedCards.forEach(w => {
            if (w.resolveBeat === beat) {
              w.cardData.effects.forEach(e => effects.push(e));
            }
          });

          if (effects.length === 0) continue;

          // Summarize effects
          let totalDmg = 0;
          let totalBlk = 0;
          let hasConditional = false;
          let hasDynamic = false;
          effects.forEach(e => {
            if (e.type === 'damage' || e.type === 'damagePerBeat') totalDmg += e.value;
            if (e.type === 'block') totalBlk += e.value;
            if (e.type === 'conditionalDamage') { totalDmg += e.value; hasConditional = true; }
            if (e.type === 'damageEqualBlock') hasDynamic = true;
          });

          const parts = [];
          if (totalDmg > 0) parts.push(`${totalDmg}${hasConditional ? '?' : ''} DMG`);
          if (hasDynamic) parts.push('?? DMG');
          if (totalBlk > 0) parts.push(`${totalBlk} BLK`);
          const label = parts.join(' + ');

          const x = beat * beatWidth;
          const barColor = totalDmg > 0 && totalBlk > 0
            ? k.rgb(180, 150, 50)
            : totalDmg > 0 ? k.rgb(220, 100, 50) : k.rgb(50, 180, 100);

          k.drawRect({
            pos: k.vec2(x + 4, 4),
            width: beatWidth - 8,
            height: intentBarHeight - 8,
            color: barColor,
            radius: 3,
          });

          k.drawText({
            text: label,
            pos: k.vec2(x + beatWidth / 2, intentBarHeight / 2),
            size: 11,
            anchor: 'center',
            font: 'sans-serif',
            color: k.rgb(255, 255, 255),
          });
        }

        // Show wrapped cards with a special indicator
        const seenWrap = new Set();
        [...(measureState.rhythmTrack || []), ...(measureState.bassTrack || [])].forEach(c => {
          if (c && !seenWrap.has(c) && c.wrapsAround) {
            seenWrap.add(c);
            const wrapBeat = c.resolveBeat % 4;
            const x = wrapBeat * beatWidth;

            k.drawRect({
              pos: k.vec2(x + 4, 4),
              width: beatWidth - 8,
              height: intentBarHeight - 8,
              color: k.rgb(100, 100, 50),
              radius: 3,
              outline: { width: 1, color: k.rgb(200, 200, 100) },
            });

            k.drawText({
              text: 'NEXT',
              pos: k.vec2(x + beatWidth / 2, intentBarHeight / 2),
              size: 10,
              anchor: 'center',
              font: 'sans-serif',
              color: k.rgb(200, 200, 100),
            });
          }
        });
      }
    }
  ]);

  // Rhythm track background
  const rhythmTrack = measure.add([
    k.rect(measureWidth, trackHeight, { radius: 4 }),
    k.pos(0, 0),
    k.color(80, 30, 30),
    k.outline(3, k.rgb(220, 50, 50)),
    k.area(),
    'rhythmTrack',
  ]);

  rhythmTrack.add([
    k.text('RHYTHM', { size: 14, font: 'sans-serif' }),
    k.pos(10, 10),
    k.color(220, 50, 50),
  ]);

  // Bass track background
  const bassTrack = measure.add([
    k.rect(measureWidth, trackHeight, { radius: 4 }),
    k.pos(0, trackHeight + 20),
    k.color(30, 50, 80),
    k.outline(3, k.rgb(50, 150, 220)),
    k.area(),
    'bassTrack',
  ]);

  bassTrack.add([
    k.text('BASS', { size: 14, font: 'sans-serif' }),
    k.pos(10, 10),
    k.color(50, 150, 220),
  ]);

  // Draw beat divisions and numbers for both tracks
  for (let beat = 0; beat < 4; beat++) {
    // Dividers (skip first)
    if (beat > 0) {
      rhythmTrack.add([
        k.rect(2, trackHeight),
        k.pos(beat * beatWidth, 0),
        k.color(255, 255, 255, 50),
      ]);
      bassTrack.add([
        k.rect(2, trackHeight),
        k.pos(beat * beatWidth, 0),
        k.color(255, 255, 255, 50),
      ]);
    }

    // Beat numbers
    rhythmTrack.add([
      k.text((beat + 1).toString(), { size: 12, font: 'sans-serif' }),
      k.pos(beat * beatWidth + beatWidth / 2, trackHeight - 20),
      k.anchor('center'),
      k.color(255, 255, 255, 100),
    ]);
    bassTrack.add([
      k.text((beat + 1).toString(), { size: 12, font: 'sans-serif' }),
      k.pos(beat * beatWidth + beatWidth / 2, trackHeight - 20),
      k.anchor('center'),
      k.color(255, 255, 255, 100),
    ]);
  }

  return {
    measure,
    measureState,
    measureX,
    measureY,
    beatWidth,
    trackHeight,

    // Set enemy actions for this loop (displayed on enemy track)
    setEnemyActions(actions) {
      measureState.enemyActions = actions;
    },

    getBeatFromX(x) {
      const relativeX = x - measureX;
      if (relativeX < 0 || relativeX > measureWidth) return -1;
      const beat = Math.floor(relativeX / beatWidth);
      return Math.min(3, Math.max(0, beat));
    },

    // Check if card can be placed - allows wrap-around past beat 4
    canPlaceCard(track, startBeat, beats) {
      if (startBeat < 0 || startBeat > 3) return false;

      const trackArray = track === 'rhythm' ? measureState.rhythmTrack : measureState.bassTrack;

      // Check only the beats that fit in this measure (0-3)
      const beatsInMeasure = Math.min(beats, 4 - startBeat);
      for (let i = startBeat; i < startBeat + beatsInMeasure; i++) {
        if (trackArray[i] !== null) return false;
      }

      return true;
    },

    // Place card on measure
    placeCard(card, track, startBeat) {
      const trackArray = track === 'rhythm' ? measureState.rhythmTrack : measureState.bassTrack;
      const beats = card.cardData.beats;

      // Mark beats as occupied (only those within this measure)
      const beatsInMeasure = Math.min(beats, 4 - startBeat);
      for (let i = startBeat; i < startBeat + beatsInMeasure; i++) {
        trackArray[i] = card;
      }

      // Store placement info for resolution
      card.startBeat = startBeat;
      card.resolveBeat = startBeat + beats - 1; // The beat where the effect triggers
      card.wrapsAround = card.resolveBeat > 3;  // Does it wrap to next loop?

      // Position card on measure
      const cardX = measureX + startBeat * beatWidth + (beatsInMeasure * beatWidth) / 2;
      const cardY = track === 'rhythm' ? measureY + trackHeight / 2 : measureY + trackHeight + 20 + trackHeight / 2;

      card.pos = k.vec2(cardX, cardY);
      card.z = 15;

      // Scale card to fit beats and track height
      const cardWidth = 110;
      const cardHeight = 150;
      const targetWidth = beatsInMeasure * beatWidth - 10;
      const targetHeight = trackHeight - 10;
      const scaleX = targetWidth / cardWidth;
      const scaleY = targetHeight / cardHeight;
      card.scale.x = scaleX;
      card.scale.y = scaleY;

      // Counter-scale children to prevent text stretching
      card.get('*').forEach(child => {
        if (!child.scale) {
          child.use(k.scale(1 / scaleX, 1 / scaleY));
        } else {
          child.scale.x = 1 / scaleX;
          child.scale.y = 1 / scaleY;
        }
      });

      console.log(`Placed ${card.cardData.name} on ${track} beat ${startBeat}, resolves beat ${card.resolveBeat}${card.wrapsAround ? ' (WRAPS)' : ''}`);

      return true;
    },

    // Remove card from measure
    removeCard(card, track) {
      const trackArray = track === 'rhythm' ? measureState.rhythmTrack : measureState.bassTrack;

      for (let i = 0; i < 4; i++) {
        if (trackArray[i] === card) {
          trackArray[i] = null;
        }
      }

      if (card.scale) {
        card.scale.x = card.originalScale || 1;
        card.scale.y = 1;
      }

      card.get('*').forEach(child => {
        if (child.scale) {
          child.scale.x = 1;
          child.scale.y = 1;
        }
      });
    },

    // Clear all cards from measure
    clearMeasure() {
      measureState.rhythmTrack = [null, null, null, null];
      measureState.bassTrack = [null, null, null, null];
    },

    // Get all placed cards with their resolution info
    getPlacedCards() {
      const seen = new Set();
      const rhythmCards = [];
      const bassCards = [];

      measureState.rhythmTrack.forEach(c => {
        if (c !== null && !seen.has(c)) {
          seen.add(c);
          rhythmCards.push(c);
        }
      });

      measureState.bassTrack.forEach(c => {
        if (c !== null && !seen.has(c)) {
          seen.add(c);
          bassCards.push(c);
        }
      });

      return { rhythmCards, bassCards };
    },

    // Get cards and enemy actions that resolve on a specific beat
    getActionsForBeat(beat) {
      const result = { playerEffects: [], enemyEffects: [] };

      // Player cards
      const { rhythmCards, bassCards } = this.getPlacedCards();
      [...rhythmCards, ...bassCards].forEach(card => {
        const beatsInMeasure = Math.min(card.cardData.beats, 4 - card.startBeat);
        const occupiesBeat = beat >= card.startBeat && beat < card.startBeat + beatsInMeasure;
        const resolvesOnBeat = card.resolveBeat === beat && !card.wrapsAround;

        if (resolvesOnBeat) {
          // Resolve beat: all effects fire
          result.playerEffects.push(card.cardData);
        } else if (occupiesBeat) {
          // Non-resolve beat: only per-beat effects fire
          const perBeatEffects = card.cardData.effects.filter(e => e.type === 'damagePerBeat');
          if (perBeatEffects.length > 0) {
            result.playerEffects.push({ ...card.cardData, effects: perBeatEffects });
          }
        }
      });

      // Wrapped cards from previous loop
      measureState.wrappedCards.forEach(wrapped => {
        if (wrapped.resolveBeat === beat) {
          result.playerEffects.push(wrapped.cardData);
        }
      });

      // Enemy actions on this beat
      measureState.enemyActions.forEach(action => {
        if (action.beat === beat) {
          result.enemyEffects.push(action);
        }
      });

      return result;
    },

    // Get cards that wrap to next loop
    getWrappedCards() {
      const wrapped = [];
      const { rhythmCards, bassCards } = this.getPlacedCards();

      [...rhythmCards, ...bassCards].forEach(card => {
        if (card.wrapsAround) {
          wrapped.push({
            cardData: card.cardData,
            resolveBeat: card.resolveBeat % 4, // Wrap beat into 0-3 range
          });
        }
      });

      return wrapped;
    },

     // Set wrapped cards from previous loop
    setWrappedCards(cards) {
      measureState.wrappedCards = cards;
    },

    // Get enemy actions that wrapped to next loop
    getWrappedEnemyActions() {
      return measureState.wrappedEnemyActions || [];
    },

    // Set wrapped enemy actions from previous loop
    setWrappedEnemyActions(actions) {
      measureState.wrappedEnemyActions = actions || [];
    },

    // Check if all 4 rhythm beats are occupied
    isRhythmFull() {
      return measureState.rhythmTrack.every(slot => slot !== null);
    },

    // Check if a bass card resolves on a specific beat
    isBassPlayingOnBeat(beat) {
      const seen = new Set();
      return measureState.bassTrack.some(c => {
        if (c && !seen.has(c)) {
          seen.add(c);
          return c.resolveBeat === beat && !c.wrapsAround;
        }
        return false;
      });
    },

     // Delay all enemy actions by N beats (including current beat)
    // Actions that wrap past beat 3 are marked for next loop
    delayAllEnemyActions(beats, currentBeat) {
      const delayed = [];
      const wrappedToNext = [];

      measureState.enemyActions.forEach(action => {
        // Delay actions on current beat and future beats (>= instead of >)
        if (action.beat >= currentBeat) {
          const newBeat = action.beat + beats;
          if (newBeat > 3) {
            // Wrap to next loop
            wrappedToNext.push({
              ...action,
              beat: newBeat - 4, // Wrap: beat 4 → 0, beat 5 → 1, etc.
            });
          } else {
            delayed.push({
              ...action,
              beat: newBeat,
            });
          }
        } else {
          // Already happened, don't delay
          delayed.push(action);
        }
      });
      
      measureState.enemyActions = delayed;
      measureState.wrappedEnemyActions = wrappedToNext;
    },

    // Playhead control
    setPlayhead(beat) {
      measureState.playheadBeat = beat;
      measureState.isPlaying = beat >= 0;
    },
  };
}
