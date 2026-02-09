// Measure UI - 4 beat measure with rhythm, bass, and enemy tracks

export function createMeasureUI(k) {
  const measureWidth = 800;
  const trackHeight = 110;
  const drumTrackHeight = 60;
  const intentBarHeight = 40;
  const beatWidth = measureWidth / 4;
  const measureX = k.width() / 2 - measureWidth / 2;
  const measureY = 230;
  const totalMeasureHeight = trackHeight + 10 + drumTrackHeight + 10 + trackHeight; // rhythm + gap + drum + gap + bass

  // Measure state
  const measureState = {
    rhythmTrack: [null, null, null, null],
    bassTrack: [null, null, null, null],
    drumCards: [],           // Permanent drum cards: [{ card, boostedBeats, bonus, conditionalBonus, condition }]
    enemyActions: [],       // Array of { beat, type, value }
    wrappedCards: [],        // Cards that wrap to next loop: { cardData, resolveBeat }
    wrappedEnemyActions: [], // Enemy actions delayed to next loop
    playheadBeat: -1,        // Current beat during playback (-1 = not playing)
    isPlaying: false,
    enemyDamageReduction: 0, // Damage reduction from Deafen
    crescendo: 0,            // Crescendo bonus for rhythm cards
    preventWrap: false,      // If true, cards cannot wrap to next loop
    typeModifiers: {         // Modifiers applied to cards of certain types
      bass: { delay: 0 },    // e.g., bass cards get delay 1 from reggae beat
      rhythm: { delay: 0 }
    },
    echoEffects: []          // Echo effects: [{ beat, type, value, remainingEchoes }]
  };
  const getEchoesForBeat = (beat) => {
      return measureState.echoEffects.filter(echo => echo.beat === beat);
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
    k.text('ENEMY', { size: 14, font: 'sans-serif' }),
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

          let symbol = '';
          if (action.type === 'attack') {
            const reducedDamage = Math.max(0, action.value - measureState.enemyDamageReduction);
            symbol = measureState.enemyDamageReduction > 0
              ? `${reducedDamage} DMG (${action.value})`
              : `${action.value} DMG`;
          } else {
            symbol = `${action.value} BLK`;
          }

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
            size: 14,
            anchor: 'center',
            font: 'sans-serif',
            color: k.rgb(255, 255, 255),
          });
        });
      }
    }
  ]);

  // Player intention bar (below bass)
  const playerIntentY = trackHeight + 10 + drumTrackHeight + 10 + trackHeight + 10;

  const playerTrack = measure.add([
    k.rect(measureWidth, intentBarHeight, { radius: 4 }),
    k.pos(0, playerIntentY),
    k.color(30, 50, 30),
    k.outline(2, k.rgb(80, 200, 80)),
    'playerTrack',
  ]);

  playerTrack.add([
    k.text('PLAYER', { size: 14, font: 'sans-serif' }),
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
          let damageMultiplier = 1; // Track damage multiplier from Turn to 11

          // Check rhythm cards (resolve beat = all effects, occupied beat = per-beat only)
          const seenRhythm = new Set();
          let finaleMultiplier = 1; // Track finale multiplier separately
          measureState.rhythmTrack.forEach(c => {
            if (c && !seenRhythm.has(c)) {
              seenRhythm.add(c);
              const beatsInMeasure = Math.min(c.cardData.beats, 4 - c.startBeat);
              const occupiesBeat = beat >= c.startBeat && beat < c.startBeat + beatsInMeasure;
              const resolvesOnBeat = c.resolveBeat === beat && !c.wrapsAround;

              // Per-beat effects trigger on every occupied beat
              if (occupiesBeat) {
                c.cardData.effects.filter(e => e.type === 'damagePerBeat' || e.type === 'beatMultipliedDamage').forEach(e => effects.push(e));
                // Apply damage multiplier from card if present
                if (c.damageMultiplier && c.damageMultiplier > damageMultiplier) {
                  damageMultiplier = c.damageMultiplier;
                }
              }

              // Non-per-beat effects trigger only on resolve beat
              if (resolvesOnBeat) {
                c.cardData.effects.filter(e => e.type !== 'damagePerBeat' && e.type !== 'beatMultipliedDamage' && e.type !== 'beatPositionBlock').forEach(e => effects.push(e));
                // Apply damage multiplier from card if present
                if (c.damageMultiplier && c.damageMultiplier > damageMultiplier) {
                  damageMultiplier = c.damageMultiplier;
                }
              }

              // Check for beatPositionBlock effects (trigger on occupied beats that match position)
              if (occupiesBeat) {
                const beatPosition = beat - c.startBeat;
                const lastPosition = c.cardData.beats - 1;
                c.cardData.effects.filter(e => e.type === 'beatPositionBlock').forEach(e => {
                  let shouldApply = false;
                  if (e.positions) {
                    e.positions.forEach(pos => {
                      if (pos === 'first' && beatPosition === 0) shouldApply = true;
                      if (pos === 'last' && beatPosition === lastPosition) shouldApply = true;
                    });
                  }
                  if (shouldApply) {
                    effects.push(e);
                  }
                });
              }

              // Check for finale effect (only once per card)
              if (occupiesBeat || resolvesOnBeat) {
                const finalBeat = c.startBeat + c.cardData.beats - 1;
                const isFinalBeat = beat === finalBeat;
                const finaleEffect = c.cardData.effects.find(e => e.type === 'finale' && e.applyTo === 'damage');
                if (isFinalBeat && finaleEffect && finaleEffect.multiplier > finaleMultiplier) {
                  finaleMultiplier = finaleEffect.multiplier;
                }
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

              // Per-beat effects trigger on every occupied beat
              if (occupiesBeat) {
                c.cardData.effects.filter(e => e.type === 'damagePerBeat' || e.type === 'beatMultipliedDamage').forEach(e => effects.push(e));
                // Apply damage multiplier from card if present
                if (c.damageMultiplier && c.damageMultiplier > damageMultiplier) {
                  damageMultiplier = c.damageMultiplier;
                }
              }

              // Non-per-beat effects trigger only on resolve beat
              if (resolvesOnBeat) {
                c.cardData.effects.filter(e => e.type !== 'damagePerBeat' && e.type !== 'beatMultipliedDamage' && e.type !== 'beatPositionBlock').forEach(e => effects.push(e));
                // Apply damage multiplier from card if present
                if (c.damageMultiplier && c.damageMultiplier > damageMultiplier) {
                  damageMultiplier = c.damageMultiplier;
                }
              }

              // Check for beatPositionBlock effects (trigger on occupied beats that match position)
              if (occupiesBeat) {
                const beatPosition = beat - c.startBeat;
                const lastPosition = c.cardData.beats - 1;
                c.cardData.effects.filter(e => e.type === 'beatPositionBlock').forEach(e => {
                  let shouldApply = false;
                  if (e.positions) {
                    e.positions.forEach(pos => {
                      if (pos === 'first' && beatPosition === 0) shouldApply = true;
                      if (pos === 'last' && beatPosition === lastPosition) shouldApply = true;
                    });
                  }
                  if (shouldApply) {
                    effects.push(e);
                  }
                });
              }

              // Check for finale effect (only once per card)
              if (occupiesBeat || resolvesOnBeat) {
                const finalBeat = c.startBeat + c.cardData.beats - 1;
                const isFinalBeat = beat === finalBeat;
                const finaleEffect = c.cardData.effects.find(e => e.type === 'finale' && e.applyTo === 'damage');
                if (isFinalBeat && finaleEffect && finaleEffect.multiplier > finaleMultiplier) {
                  finaleMultiplier = finaleEffect.multiplier;
                }
              }
            }
          });
            
          // Check wrapped cards from previous loop
          measureState.wrappedCards.forEach(w => {
            if (w.resolveBeat === beat) {
              w.cardData.effects.forEach(e => effects.push(e));
            }
          });

          // Check echo effects for this beat
          const echoes = getEchoesForBeat(beat);
          echoes.forEach(echo => {
            effects.push({ type: echo.type, value: echo.value, target: 'player' });
          });

          if (effects.length === 0) continue;

          // Get drum bonus for this beat
          const drumBonus = measureState.drumCards.reduce((total, drumCard) => {
            return drumCard.boostedBeats.includes(beat) ? total + drumCard.bonus : total;
          }, 0);

          // Summarize effects
          let baseDmg = 0;
          let totalBlk = 0;
          let hasConditional = false;
          let hasDynamic = false;
          effects.forEach(e => {
            if (e.type === 'damage' || e.type === 'damagePerBeat') baseDmg += e.value;
            if (e.type === 'beatMultipliedDamage') baseDmg += e.value * (beat + 1); // Calculate damage for this specific beat
            if (e.type === 'block' || e.type === 'blockPerBeat') totalBlk += e.value;
            if (e.type === 'beatPositionBlock') totalBlk += e.value; // beatPositionBlock already filtered by position
            if (e.type === 'conditionalDamage') { baseDmg += e.value; hasConditional = true; }
            if (e.type === 'damageEqualBlock') hasDynamic = true;
          });

          // Apply drum bonus BEFORE multipliers
          baseDmg += drumBonus;
          totalBlk += drumBonus;

          // Apply damage multipliers
          const totalMultiplier = damageMultiplier * finaleMultiplier;
          const totalDmg = baseDmg * totalMultiplier;

          const parts = [];
          if (totalDmg > 0) {
            // Show damage with multipliers
            let dmgText;
            if (finaleMultiplier > 1) {
              // Show finale format: "8 x2" instead of "16 (8)"
              dmgText = `${baseDmg} DMG x${finaleMultiplier}`;
            } else if (damageMultiplier > 1) {
              // Show regular multiplier format: "16 DMG (8)"
              dmgText = `${totalDmg} DMG (${baseDmg})`;
            } else {
              // No multiplier
              dmgText = `${totalDmg}${hasConditional ? '?' : ''} DMG`;
            }
            parts.push(dmgText);
          }
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
            size: 15,
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
    k.text('RHYTHM', { size: 18, font: 'sans-serif' }),
    k.pos(10, 10),
    k.color(220, 50, 50),
  ]);

  // Drum track background
  const drumTrackY = trackHeight + 10;
  let drumInfoPanel = null; // Track the info panel

  // Function to create drum info panel
  function createDrumInfoPanel() {
    console.log('createDrumInfoPanel called, drum cards:', measureState.drumCards.length);
    const panelWidth = 400;
    const panelHeight = 300;
    const panelX = k.width() / 2 - panelWidth / 2;
    const panelY = k.height() / 2 - panelHeight / 2;

    console.log('Panel dimensions:', { panelX, panelY, panelWidth, panelHeight });

    // Semi-transparent background overlay
    const overlay = k.add([
      k.rect(k.width(), k.height()),
      k.pos(0, 0),
      k.color(0, 0, 0, 150),
      k.area(),
      k.z(150),
      'drumInfoOverlay',
    ]);
    console.log('Overlay created');

    // Panel background
    const panel = k.add([
      k.rect(panelWidth, panelHeight, { radius: 8 }),
      k.pos(panelX, panelY),
      k.color(40, 35, 25),
      k.outline(4, k.rgb(180, 120, 50)),
      k.z(151),
      'drumInfoPanel',
    ]);
    console.log('Panel created');

    // Title
    panel.add([
      k.text('DRUM CARDS', { size: 24, font: 'sans-serif' }),
      k.pos(panelWidth / 2, 25),
      k.anchor('center'),
      k.color(255, 200, 100),
    ]);

    // Close instruction
    panel.add([
      k.text('Click outside or press ESC to close', { size: 14, font: 'sans-serif' }),
      k.pos(panelWidth / 2, 55),
      k.anchor('center'),
      k.color(220, 220, 220),
    ]);

    // Display drum cards
    if (measureState.drumCards.length === 0) {
      panel.add([
        k.text('No drum cards played yet', { size: 18, font: 'sans-serif' }),
        k.pos(panelWidth / 2, panelHeight / 2),
        k.anchor('center'),
        k.color(255, 255, 255),
      ]);
    } else {
      let yOffset = 90;
      measureState.drumCards.forEach((drumCard) => {
        // Card name
        panel.add([
          k.text(drumCard.card.cardData.name, { size: 20, font: 'sans-serif' }),
          k.pos(20, yOffset),
          k.color(255, 240, 180),
        ]);

        // Effect description
        const beatNumbers = drumCard.boostedBeats.map(b => b + 1).join(', ');
        const effectText = `+${drumCard.bonus} to beats ${beatNumbers}`;
        panel.add([
          k.text(effectText, { size: 16, font: 'sans-serif' }),
          k.pos(40, yOffset + 28),
          k.color(240, 240, 240),
        ]);

        // Full description
        panel.add([
          k.text(drumCard.card.cardData.description, { size: 14, font: 'sans-serif' }),
          k.pos(40, yOffset + 52),
          k.color(200, 200, 200),
        ]);

        yOffset += 90;
      });
    }

    // Click overlay to close (with small delay to prevent immediate close)
    let canClose = false;
    k.wait(0.1, () => {
      canClose = true;
    });

    overlay.onClick(() => {
      if (!canClose) {
        console.log('Overlay clicked but too soon, ignoring');
        return;
      }
      console.log('Overlay clicked, closing panel');
      overlay.destroy();
      panel.destroy();
      drumInfoPanel = null;
    });

    // Store reference
    drumInfoPanel = { overlay, panel };
    console.log('Panel setup complete, drumInfoPanel stored');
  }

  const drumTrack = measure.add([
    k.rect(measureWidth, drumTrackHeight, { radius: 4 }),
    k.pos(0, drumTrackY),
    k.color(60, 45, 30),
    k.outline(3, k.rgb(180, 120, 50)),
    k.area(),
    'drumTrack',
  ]);

  // Make drum track clickable to show drum card info
  drumTrack.onClick(() => {
    console.log('Drum track clicked!');
    if (drumInfoPanel) {
      console.log('Closing existing panel');
      // Close panel if already open
      drumInfoPanel.overlay.destroy();
      drumInfoPanel.panel.destroy();
      drumInfoPanel = null;
    } else {
      console.log('Creating new panel');
      // Open panel showing drum cards
      createDrumInfoPanel();
    }
  });

  drumTrack.add([
    k.text('DRUMS', { size: 16, font: 'sans-serif' }),
    k.pos(10, 8),
    k.color(180, 120, 50),
  ]);

  // Beat divisions for drum track
  for (let beat = 1; beat < 4; beat++) {
    drumTrack.add([
      k.rect(2, drumTrackHeight),
      k.pos(beat * beatWidth, 0),
      k.color(255, 255, 255, 50),
    ]);
  }

  // Drum bonus display (shows which beats are boosted)
  measure.add([
    k.pos(0, drumTrackY),
    k.z(3),
    {
      draw() {
        for (let beat = 0; beat < 4; beat++) {
          // Calculate total drum bonus for this beat
          const drumBonus = measureState.drumCards.reduce((total, drumCard) => {
            return drumCard.boostedBeats.includes(beat) ? total + drumCard.bonus : total;
          }, 0);

          if (drumBonus > 0) {
            const x = beat * beatWidth;

            // Draw bonus indicator on the drum track
            k.drawRect({
              pos: k.vec2(x + 4, 4),
              width: beatWidth - 8,
              height: drumTrackHeight - 8,
              color: k.rgb(200, 150, 80, 150),
              radius: 3,
            });

            k.drawText({
              text: `+${drumBonus}`,
              pos: k.vec2(x + beatWidth / 2, drumTrackHeight / 2),
              size: 16,
              anchor: 'center',
              font: 'sans-serif',
              color: k.rgb(255, 255, 255),
            });
          }
        }
      }
    }
  ]);

  // Bass track background
  const bassTrackY = trackHeight + 10 + drumTrackHeight + 10;
  const bassTrack = measure.add([
    k.rect(measureWidth, trackHeight, { radius: 4 }),
    k.pos(0, bassTrackY),
    k.color(30, 50, 80),
    k.outline(3, k.rgb(50, 150, 220)),
    k.area(),
    'bassTrack',
  ]);

  bassTrack.add([
    k.text('BASS', { size: 18, font: 'sans-serif' }),
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

    // Set enemy damage reduction (from Deafen)
    setEnemyDamageReduction(reduction) {
      measureState.enemyDamageReduction = reduction;
    },

    // Set crescendo bonus (from Drum roll)
    setCrescendo(value) {
      measureState.crescendo = value;
    },

    getBeatFromX(x) {
      const relativeX = x - measureX;
      if (relativeX < 0 || relativeX > measureWidth) return -1;
      const beat = Math.floor(relativeX / beatWidth);
      return Math.min(3, Math.max(0, beat));
    },

    // Check if card can be placed - allows wrap-around past beat 4 unless preventWrap is true
    canPlaceCard(track, startBeat, beats) {
      if (startBeat < 0 || startBeat > 3) return false;

      // If preventWrap is active, don't allow cards that would wrap
      if (measureState.preventWrap && startBeat + beats > 4) {
        return false;
      }

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
      const cardY = track === 'rhythm' 
        ? measureY + trackHeight / 2 
        : measureY + trackHeight + 10 + drumTrackHeight + 10 + trackHeight / 2;

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
 // Get echo effects for a specific beat
    getEchoesForBeat(beat) {
      return getEchoesForBeat(beat);
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
          // Include damageMultiplier if present (from Turn to 11)
          const effectData = { ...card.cardData };
          if (card.damageMultiplier) {
            effectData.damageMultiplier = card.damageMultiplier;
          }
          // Include startBeat for finale effects
          effectData.startBeat = card.startBeat;
          result.playerEffects.push(effectData);
        } else if (occupiesBeat) {
          // Non-resolve beat: only per-beat effects fire
          const perBeatEffects = card.cardData.effects.filter(e => e.type === 'damagePerBeat' || e.type === 'beatMultipliedDamage');
          if (perBeatEffects.length > 0) {
            const effectData = { ...card.cardData, effects: perBeatEffects };
            if (card.damageMultiplier) {
              effectData.damageMultiplier = card.damageMultiplier;
            }
            // Include startBeat for finale effects
            effectData.startBeat = card.startBeat;
            result.playerEffects.push(effectData);
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

      // Echo effects on this beat
      const echoes = this.getEchoesForBeat(beat);
      echoes.forEach(echo => {
        // Create a synthetic card effect for the echo
        const echoCardData = {
          id: 'echo',
          name: 'Echo',
          type: 'echo',
          effects: [{ type: echo.type, value: echo.value, target: 'player' }]
        };
        result.playerEffects.push(echoCardData);
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

    // Add a drum card (permanent)
    addDrumCard(card) {
      // Extract beat bonus effects from card data
      const beatBonusEffect = card.cardData.effects.find(e => e.type === 'beatBonus');
      const conditionalBonusEffect = card.cardData.effects.find(e => e.type === 'conditionalBeatBonus');
      const preventWrapEffect = card.cardData.effects.find(e => e.type === 'preventWrap');
      const giveTypeDelayEffect = card.cardData.effects.find(e => e.type === 'giveTypeDelay');

      // Handle regular beat bonus
      if (beatBonusEffect) {
        measureState.drumCards.push({
          card,
          boostedBeats: beatBonusEffect.beats,
          bonus: beatBonusEffect.value,
          conditionalBonus: null
        });
        console.log(`Added drum card: ${card.cardData.name}, boosts beats ${beatBonusEffect.beats.map(b => b + 1).join(', ')} by +${beatBonusEffect.value}`);
      }

      // Handle conditional beat bonus (e.g., bonus for 1-beat cards)
      if (conditionalBonusEffect) {
        measureState.drumCards.push({
          card,
          boostedBeats: [0, 1, 2, 3], // Apply to all beats but conditionally
          bonus: 0, // Base bonus is 0
          conditionalBonus: conditionalBonusEffect.value,
          condition: conditionalBonusEffect.condition
        });
        console.log(`Added drum card: ${card.cardData.name}, conditional +${conditionalBonusEffect.value} for ${conditionalBonusEffect.condition}`);
      }

      // Handle prevent wrap
      if (preventWrapEffect) {
        measureState.preventWrap = true;
        console.log(`Added drum card: ${card.cardData.name}, cards cannot wrap`);
      }

      // Handle type delay modifiers (e.g., bass cards get delay 1)
      if (giveTypeDelayEffect) {
        const cardType = giveTypeDelayEffect.cardType;
        if (measureState.typeModifiers[cardType]) {
          measureState.typeModifiers[cardType].delay += giveTypeDelayEffect.value;
          console.log(`Added drum card: ${card.cardData.name}, ${cardType} cards now have delay ${measureState.typeModifiers[cardType].delay}`);
        }
      }

      // Hide the card visual (bonuses are shown on the track, card info in panel)
      card.opacity = 0;
      card.z = -1; // Move behind everything
    },

    // Get total drum bonus for a specific beat
    getDrumBonus(beat, cardData = null) {
      let totalBonus = 0;
      measureState.drumCards.forEach(drumCard => {
        // Regular beat bonus
        if (drumCard.boostedBeats.includes(beat)) {
          totalBonus += drumCard.bonus;
        }

        // Conditional bonus (requires cardData)
        if (drumCard.conditionalBonus && cardData) {
          let conditionMet = false;

          // Check condition based on card properties
          if (drumCard.condition === 'oneBeat' && cardData.beats === 1) {
            conditionMet = true;
          }

          if (conditionMet && drumCard.boostedBeats.includes(beat)) {
            totalBonus += drumCard.conditionalBonus;
          }
        }
      });
      return totalBonus;
    },

    // Get type modifiers for a card type (e.g., 'bass' or 'rhythm')
    getTypeModifiers(cardType) {
      return measureState.typeModifiers[cardType] || { delay: 0 };
    },

    // Get all drum cards
    getDrumCards() {
      return measureState.drumCards;
    },

    // Close drum info panel (exposed for ESC key handler)
    // Returns true if a panel was closed, false otherwise
    closeDrumInfoPanel() {
      if (drumInfoPanel) {
        drumInfoPanel.overlay.destroy();
        drumInfoPanel.panel.destroy();
        drumInfoPanel = null;
        return true;
      }
      return false;
    },

    // Add an echo effect
    addEchoEffect(echoData) {
      measureState.echoEffects.push(echoData);
    },

    // Process echoes at end of loop (halve values, decrement counts)
    processEchoes() {
      measureState.echoEffects = measureState.echoEffects
        .map(echo => ({
          ...echo,
          value: Math.floor(echo.value / 2),
          remainingEchoes: echo.remainingEchoes - 1
        }))
        .filter(echo => echo.remainingEchoes > 0 && echo.value > 0);
    },

    // Get echo effects for a specific beat
    getEchoesForBeat(beat) {
      return measureState.echoEffects.filter(echo => echo.beat === beat);
    },
  };
}
