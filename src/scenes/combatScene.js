// Combat scene - Musical loop gameplay with beat-by-beat resolution

import { CARDS } from '../config/cardData.js';
import { createCardSystem } from '../systems/cardSystem.js';
import { createMeasureUI } from '../ui/measureUI.js';
import { createDragDropSystem } from '../systems/dragDropSystem.js';

export function combatScene(k) {
  k.scene('combat', (data) => {
    const { gameState } = data;

    // Dynamic scaling enemy based on fight number
    const fightNumber = gameState.fightNumber || 1;
    const enemyHP = 10 + (fightNumber - 1) * 5;
    const enemy = {
      name: 'Slime',
      maxHP: enemyHP,
      color: [100, 255, 100],
    };

    // Initialize combat state
    const combatState = {
      playerHP: gameState.currentHP,
      playerMaxHP: gameState.maxHP,
      playerBlock: 0,
      enemyHP: enemy.maxHP,
      enemyMaxHP: enemy.maxHP,
      enemyBlock: 0,
      mana: gameState.maxEnergy,
      maxMana: gameState.maxEnergy,
      currentTurn: 'player',
      drawPile: [],
      hand: [],
      discardPile: [],
      turnNumber: 0,
      blockGainedThisLoop: 0,
      doubleDamageMultiplier: 1,
      nextLoopDoubleDamage: false,
    };

    // Initialize systems
    const cardSystem = createCardSystem(k);
    const measureUI = createMeasureUI(k);
    const dragDropSystem = createDragDropSystem(k, measureUI, cardSystem);

    // Background
    k.add([
      k.rect(k.width(), k.height()),
      k.color(20, 20, 30),
      k.pos(0, 0),
    ]);

    // Top bar - Mana and Floor
    k.add([
      k.pos(30, 25),
      k.z(10),
      {
        draw() {
          for (let i = 0; i < combatState.maxMana; i++) {
            const filled = i < combatState.mana;
            k.drawCircle({
              pos: k.vec2(i * 45, 0),
              radius: 18,
              color: filled ? k.rgb(100, 200, 255) : k.rgb(50, 50, 50),
              outline: { width: 3, color: k.WHITE },
            });
          }
          k.drawText({
            text: `${combatState.mana}/${combatState.maxMana}`,
            pos: k.vec2(combatState.maxMana * 45 + 15, 0),
            size: 24,
            font: 'sans-serif',
          });
        }
      }
    ]);

    // Fight number display
    k.add([
      k.text(`Fight ${fightNumber}`, { size: 24 }),
      k.pos(k.width() - 30, 30),
      k.anchor('right'),
      k.color(200, 200, 200),
    ]);

    // Deck pile viewer state
    let deckViewerOpen = false;
    let discardViewerOpen = false;

    // Draw pile button
    const drawPileBtn = k.add([
      k.rect(90, 50, { radius: 4 }),
      k.pos(30, 80),
      k.color(50, 80, 120),
      k.outline(2, k.rgb(100, 150, 200)),
      k.area(),
      k.z(10),
    ]);

    drawPileBtn.add([
      k.text('DRAW', { size: 14, font: 'sans-serif' }),
      k.pos(45, 15),
      k.anchor('center'),
      k.color(k.WHITE),
    ]);

    drawPileBtn.add([
      k.pos(45, 35),
      k.anchor('center'),
      k.z(1),
      {
        draw() {
          k.drawText({
            text: `${combatState.drawPile.length}`,
            size: 18,
            font: 'sans-serif',
            anchor: 'center',
            color: k.rgb(200, 220, 255),
          });
        }
      }
    ]);

    drawPileBtn.onHoverUpdate(() => {
      drawPileBtn.color = k.rgb(60, 90, 140);
      k.setCursor('pointer');
    });

    drawPileBtn.onHoverEnd(() => {
      drawPileBtn.color = k.rgb(50, 80, 120);
      k.setCursor('default');
    });

    drawPileBtn.onClick(() => {
      if (discardViewerOpen) return;
      deckViewerOpen = !deckViewerOpen;
      if (deckViewerOpen) showDeckViewer();
      else closeDeckViewer();
    });

    // Discard pile button
    const discardPileBtn = k.add([
      k.rect(90, 50, { radius: 4 }),
      k.pos(130, 80),
      k.color(80, 50, 80),
      k.outline(2, k.rgb(150, 100, 150)),
      k.area(),
      k.z(10),
    ]);

    discardPileBtn.add([
      k.text('DISCARD', { size: 14, font: 'sans-serif' }),
      k.pos(45, 15),
      k.anchor('center'),
      k.color(k.WHITE),
    ]);

    discardPileBtn.add([
      k.pos(45, 35),
      k.anchor('center'),
      k.z(1),
      {
        draw() {
          k.drawText({
            text: `${combatState.discardPile.length}`,
            size: 18,
            font: 'sans-serif',
            anchor: 'center',
            color: k.rgb(220, 180, 220),
          });
        }
      }
    ]);

    discardPileBtn.onHoverUpdate(() => {
      discardPileBtn.color = k.rgb(90, 60, 90);
      k.setCursor('pointer');
    });

    discardPileBtn.onHoverEnd(() => {
      discardPileBtn.color = k.rgb(80, 50, 80);
      k.setCursor('default');
    });

    discardPileBtn.onClick(() => {
      if (deckViewerOpen) return;
      discardViewerOpen = !discardViewerOpen;
      if (discardViewerOpen) showDiscardViewer();
      else closeDiscardViewer();
    });

    let viewerOverlay = null;
    let viewerCards = [];

    function showDeckViewer() {
      showPileViewer(combatState.drawPile, 'Draw Pile', () => {
        deckViewerOpen = false;
      });
    }

    function showDiscardViewer() {
      showPileViewer(combatState.discardPile, 'Discard Pile', () => {
        discardViewerOpen = false;
      });
    }

    function showPileViewer(pile, title, onClose) {
      // Dark overlay
      viewerOverlay = k.add([
        k.rect(k.width(), k.height()),
        k.pos(0, 0),
        k.color(0, 0, 0, 180),
        k.z(200),
        k.area(),
      ]);

      // Title
      viewerOverlay.add([
        k.text(title, { size: 32, font: 'sans-serif' }),
        k.pos(k.width() / 2, 40),
        k.anchor('center'),
        k.color(k.WHITE),
      ]);

      // Card count
      viewerOverlay.add([
        k.text(`${pile.length} cards`, { size: 18, font: 'sans-serif' }),
        k.pos(k.width() / 2, 75),
        k.anchor('center'),
        k.color(180, 180, 180),
      ]);

      // Close button
      const closeBtn = viewerOverlay.add([
        k.rect(100, 40, { radius: 4 }),
        k.pos(k.width() / 2, k.height() - 50),
        k.anchor('center'),
        k.color(100, 100, 100),
        k.outline(2, k.WHITE),
        k.area(),
        k.z(1),
      ]);

      closeBtn.add([
        k.text('CLOSE', { size: 18, font: 'sans-serif' }),
        k.anchor('center'),
        k.color(k.WHITE),
      ]);

      closeBtn.onHoverUpdate(() => {
        closeBtn.color = k.rgb(120, 120, 120);
        k.setCursor('pointer');
      });

      closeBtn.onHoverEnd(() => {
        closeBtn.color = k.rgb(100, 100, 100);
        k.setCursor('default');
      });

      closeBtn.onClick(() => {
        closePileViewer();
        onClose();
      });

      // Display cards in grid
      const cardScale = 0.65;
      const cardW = 110 * cardScale;
      const cardH = 150 * cardScale;
      const gap = 15;
      const cols = 8;
      const startX = (k.width() - (cols * (cardW + gap) - gap)) / 2;
      const startY = 120;

      pile.forEach((cardKey, i) => {
        const cardData = CARDS[cardKey];
        if (!cardData) return;

        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (cardW + gap);
        const y = startY + row * (cardH + gap);

        const cardObj = cardSystem.createCard(cardData, x, y, false);
        cardObj.scale = k.vec2(cardScale, cardScale);
        cardObj.z = 201;
        viewerCards.push(cardObj);
        viewerOverlay.add(cardObj);
      });

      // Click overlay to close
      viewerOverlay.onClick(() => {
        closePileViewer();
        onClose();
      });
    }

    function closePileViewer() {
      if (viewerOverlay) {
        viewerCards.forEach(c => c.destroy());
        viewerCards = [];
        viewerOverlay.destroy();
        viewerOverlay = null;
      }
    }

    function closeDeckViewer() {
      closePileViewer();
    }

    function closeDiscardViewer() {
      closePileViewer();
    }

    // Enemy display
    k.add([
      k.rect(100, 100),
      k.pos(k.width() / 2, 85),
      k.anchor('center'),
      k.color(...enemy.color),
      k.outline(3, k.BLACK),
      k.z(1),
    ]);

    k.add([
      k.text(enemy.name, { size: 20 }),
      k.pos(k.width() / 2, 25),
      k.anchor('center'),
      k.color(k.WHITE),
      k.z(2),
    ]);

    // Enemy HP bar
    k.add([
      k.pos(k.width() / 2, 148),
      k.anchor('center'),
      k.z(2),
      {
        draw() {
          const barWidth = 250;
          const barHeight = 28;
          const hpPercent = combatState.enemyHP / combatState.enemyMaxHP;

          k.drawRect({ pos: k.vec2(-barWidth / 2, 0), width: barWidth, height: barHeight, color: k.rgb(50, 50, 50) });
          k.drawRect({ pos: k.vec2(-barWidth / 2, 0), width: barWidth * hpPercent, height: barHeight, color: k.rgb(200, 50, 50) });
          k.drawText({ text: `HP: ${combatState.enemyHP}/${combatState.enemyMaxHP}`, pos: k.vec2(0, barHeight / 2), size: 18, anchor: 'center', font: 'sans-serif' });

          if (combatState.enemyBlock > 0) {
            k.drawText({ text: `Block: ${combatState.enemyBlock}`, pos: k.vec2(barWidth / 2 + 60, barHeight / 2), size: 16, color: k.rgb(100, 150, 255), anchor: 'left' });
          }
        }
      }
    ]);

    // Player HP bar
    k.add([
      k.pos(30, 320),
      k.z(2),
      {
        draw() {
          const barWidth = 250;
          const barHeight = 35;
          const hpPercent = combatState.playerHP / combatState.playerMaxHP;

          k.drawRect({ width: barWidth, height: barHeight, color: k.rgb(50, 50, 50) });
          k.drawRect({ width: barWidth * hpPercent, height: barHeight, color: k.rgb(200, 50, 50) });
          k.drawText({ text: `HP: ${combatState.playerHP}/${combatState.playerMaxHP}`, pos: k.vec2(barWidth / 2, barHeight / 2), size: 20, anchor: 'center', font: 'sans-serif' });

          if (combatState.playerBlock > 0) {
            k.drawText({ text: `Block: ${combatState.playerBlock}`, pos: k.vec2(barWidth + 20, barHeight / 2), size: 18, color: k.rgb(100, 150, 255), anchor: 'left' });
          }
        }
      }
    ]);

    // Beat resolution log (shows what happened on each beat)
    let beatLog = [];
    k.add([
      k.pos(k.width() - 300, 290),
      k.z(10),
      {
        draw() {
          k.drawText({ text: 'Beat Log:', size: 14, color: k.rgb(200, 200, 200), font: 'sans-serif' });
          beatLog.forEach((entry, i) => {
            k.drawText({
              text: entry,
              pos: k.vec2(0, 20 + i * 18),
              size: 12,
              color: k.rgb(180, 180, 180),
              font: 'sans-serif',
            });
          });
        }
      }
    ]);

    // Play Loop button
    const playLoopBtn = k.add([
      k.rect(150, 60),
      k.pos(k.width() - 100, 620),
      k.anchor('center'),
      k.color(100, 200, 100),
      k.outline(3, k.WHITE),
      k.area(),
      k.z(10),
      'playLoopButton',
    ]);

    playLoopBtn.add([
      k.text('Play Loop', { size: 20 }),
      k.anchor('center'),
      k.color(k.WHITE),
    ]);

    playLoopBtn.onHoverUpdate(() => {
      if (combatState.currentTurn === 'player') {
        playLoopBtn.color = k.rgb(120, 220, 120);
        k.setCursor('pointer');
      }
    });

    playLoopBtn.onHoverEnd(() => {
      playLoopBtn.color = k.rgb(100, 200, 100);
      k.setCursor('default');
    });

    playLoopBtn.onClick(() => {
      if (combatState.currentTurn === 'player') {
        playLoop();
      }
    });

    // =========================================
    // DECK SYSTEM
    // =========================================
    const handCards = [];

    function shuffleArray(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function buildStartingDeck() {
      return [...gameState.deck];
    }

    function drawCards(count) {
      for (let i = 0; i < count; i++) {
        if (combatState.drawPile.length === 0) {
          if (combatState.discardPile.length === 0) break;
          combatState.drawPile = shuffleArray([...combatState.discardPile]);
          combatState.discardPile = [];
          beatLog.push('--- Discard reshuffled into draw pile ---');
        }
        const cardKey = combatState.drawPile.pop();
        const cardData = CARDS[cardKey];
        if (!cardData) continue;
        const card = cardSystem.createCard(cardData, 0, 0, true);
        card.deckCardKey = cardKey;
        dragDropSystem.setupCardDrag(card, handCards, combatState);
        handCards.push(card);
      }
      cardSystem.layoutHand(handCards);
    }

    function discardHand() {
      handCards.forEach(card => {
        combatState.discardPile.push(card.deckCardKey);
        card.destroy();
      });
      handCards.length = 0;
    }

    // Initialize deck and draw first hand
    combatState.drawPile = shuffleArray(buildStartingDeck());
    combatState.discardPile = [];
    drawCards(5);

    // Generate random scaling enemy actions
    function generateEnemyActions() {
      const actions = [];
      const baseDmg = 3 + Math.floor(fightNumber * 1.5);
      const baseBlk = 2 + fightNumber;

      // More actions as fights progress
      const minActions = Math.min(2, 1 + Math.floor((fightNumber - 1) / 4));
      const maxActions = Math.min(4, 1 + Math.floor(fightNumber / 2));
      const numActions = minActions + Math.floor(Math.random() * (maxActions - minActions + 1));

      // Pick random unique beats
      const beats = [0, 1, 2, 3];
      for (let i = beats.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [beats[i], beats[j]] = [beats[j], beats[i]];
      }
      const selectedBeats = beats.slice(0, numActions).sort((a, b) => a - b);

      selectedBeats.forEach(beat => {
        const isAttack = Math.random() < 0.75;
        const variance = Math.floor(Math.random() * 3) - 1;
        if (isAttack) {
          actions.push({ beat, type: 'attack', value: Math.max(2, baseDmg + variance) });
        } else {
          actions.push({ beat, type: 'block', value: Math.max(2, baseBlk + variance) });
        }
      });

      measureUI.setEnemyActions(actions);
    }

    // Start first turn
    generateEnemyActions();

    // Debug displays
    k.add([
      k.pos(10, k.height() - 30),
      k.z(100),
      { draw() { k.drawText({ text: `Mouse: ${Math.floor(k.mousePos().x)}, ${Math.floor(k.mousePos().y)}`, size: 14, color: k.rgb(255, 255, 0) }); } }
    ]);

    k.add([
      k.pos(10, k.height() - 50),
      k.z(100),
      { draw() { k.drawText({ text: `Hand: ${handCards.length} | Draw: ${combatState.drawPile.length} | Discard: ${combatState.discardPile.length} | Mana: ${combatState.mana} | Turn: ${combatState.turnNumber}`, size: 14, color: k.rgb(255, 255, 0) }); } }
    ]);

    // Update loop
    k.onUpdate(() => {
      dragDropSystem.update(handCards, combatState);
    });

    k.onMouseRelease(() => {
      dragDropSystem.handleMouseRelease(handCards, combatState);
    });

    // =========================================
    // BEAT-BY-BEAT LOOP RESOLUTION
    // =========================================

    function playLoop() {
      combatState.currentTurn = 'resolving';
      combatState.blockGainedThisLoop = 0;
      beatLog = [];

      // Resolve beats 0 through 3 sequentially
      resolveBeat(0);
    }

    function resolveBeat(beat) {
      if (beat > 3) {
        // All beats resolved - finish the loop
        finishLoop();
        return;
      }

      // Move playhead
      measureUI.setPlayhead(beat);

      // Get all actions for this beat
      const actions = measureUI.getActionsForBeat(beat);

      // Resolve player effects first
      actions.playerEffects.forEach(cardData => {
        cardData.effects.forEach(effect => {
          const logEntry = executeEffect(effect, 'player', beat);
          if (logEntry) beatLog.push(`Beat ${beat + 1}: ${logEntry}`);
        });
      });

      // Then resolve enemy effects
      actions.enemyEffects.forEach(action => {
        const logEntry = executeEnemyAction(action);
        if (logEntry) beatLog.push(`Beat ${beat + 1}: ${logEntry}`);
      });

      // Check for combat end
      if (combatState.enemyHP <= 0 || combatState.playerHP <= 0) {
        measureUI.setPlayhead(-1);
        k.wait(0.5, () => {
          if (combatState.enemyHP <= 0) victory();
          else defeat();
        });
        return;
      }

      // Move to next beat after a delay
      k.wait(0.6, () => {
        resolveBeat(beat + 1);
      });
    }

    function dealDamageToEnemy(rawValue) {
      const dmg = rawValue * combatState.doubleDamageMultiplier;
      const blocked = Math.min(dmg, combatState.enemyBlock);
      combatState.enemyBlock -= blocked;
      const actual = dmg - blocked;
      combatState.enemyHP = Math.max(0, combatState.enemyHP - actual);
      const multi = combatState.doubleDamageMultiplier > 1 ? ' (x2!)' : '';
      return { actual, blocked, multi };
    }

    function executeEffect(effect, source, beat) {
      switch (effect.type) {
        case 'damage': {
          const { actual, blocked, multi } = dealDamageToEnemy(effect.value);
          return `You deal ${actual} damage${blocked > 0 ? ` (${blocked} blocked)` : ''}${multi}`;
        }
        case 'damagePerBeat': {
          const { actual, blocked, multi } = dealDamageToEnemy(effect.value);
          return `Flourish: ${actual} damage${blocked > 0 ? ` (${blocked} blocked)` : ''}${multi}`;
        }
        case 'damageEqualBlock': {
          const dmgValue = combatState.blockGainedThisLoop;
          if (dmgValue <= 0) return `Violent Riff: 0 damage (no block gained)`;
          const { actual, blocked, multi } = dealDamageToEnemy(dmgValue);
          return `Violent Riff: ${actual} damage (=${dmgValue} block)${blocked > 0 ? ` (${blocked} blocked)` : ''}${multi}`;
        }
        case 'conditionalDamage': {
          let conditionMet = false;
          let condLabel = effect.condition;
          if (effect.condition === 'rhythmFull') {
            conditionMet = measureUI.isRhythmFull();
            condLabel = 'rhythm full';
          } else if (effect.condition === 'bassPlaying') {
            conditionMet = measureUI.isBassPlayingOnBeat(beat);
            condLabel = 'bass playing';
          }
          if (!conditionMet) return `Condition not met (${condLabel})`;
          const { actual, blocked, multi } = dealDamageToEnemy(effect.value);
          return `Bonus ${actual} damage! (${condLabel})${blocked > 0 ? ` (${blocked} blocked)` : ''}${multi}`;
        }
        case 'delayEnemy': {
          measureUI.delayEnemyActions(effect.value, beat);
          return `Enemy actions delayed ${effect.value} beat!`;
        }
        case 'doubleDamageNext': {
          combatState.nextLoopDoubleDamage = true;
          return `Next loop deals double damage!`;
        }
        case 'block': {
          combatState.playerBlock += effect.value;
          combatState.blockGainedThisLoop += effect.value;
          return `You gain ${effect.value} block`;
        }
        case 'draw':
          drawCards(effect.value);
          return `Draw ${effect.value} cards`;
        case 'gainMana':
          combatState.mana += effect.value;
          return `Gain ${effect.value} mana`;
        default:
          return null;
      }
    }

    function executeEnemyAction(action) {
      if (action.type === 'attack') {
        const blocked = Math.min(action.value, combatState.playerBlock);
        combatState.playerBlock -= blocked;
        const actual = action.value - blocked;
        combatState.playerHP = Math.max(0, combatState.playerHP - actual);
        return `Enemy deals ${actual} damage${blocked > 0 ? ` (${blocked} blocked)` : ''}`;
      } else if (action.type === 'block') {
        combatState.enemyBlock += action.value;
        return `Enemy gains ${action.value} block`;
      }
      return null;
    }

      function finishLoop() {
      // Stop playhead
      measureUI.setPlayhead(-1);

      // Collect wrapped cards for next loop
      const wrappedCards = measureUI.getWrappedCards();
      if (wrappedCards.length > 0) {
        beatLog.push(`--- ${wrappedCards.length} card(s) wrap to next loop ---`);
      }

      // Collect wrapped enemy actions
      const wrappedEnemyActions = measureUI.getWrappedEnemyActions();
      if (wrappedEnemyActions.length > 0) {
        beatLog.push(`--- ${wrappedEnemyActions.length} enemy action(s) delayed to next loop ---`);
      }

      // Discard placed cards and clear measure
      const { rhythmCards, bassCards } = measureUI.getPlacedCards();
      [...rhythmCards, ...bassCards].forEach(card => {
        combatState.discardPile.push(card.deckCardKey);
        card.destroy();
      });
      measureUI.clearMeasure();

      // Discard remaining hand cards
      discardHand();

      // Set wrapped cards for next loop
      measureUI.setWrappedCards(wrappedCards);

      // Reset block at end of loop
      combatState.playerBlock = 0;
      combatState.enemyBlock = 0;

      // Handle double damage for next loop (Lead-in)
      if (combatState.nextLoopDoubleDamage) {
        combatState.doubleDamageMultiplier = 2;
        combatState.nextLoopDoubleDamage = false;
      } else {
        combatState.doubleDamageMultiplier = 1;
      }

      // Advance turn
      combatState.turnNumber++;

      k.wait(0.5, () => {
        // Start new player turn
        combatState.currentTurn = 'player';
        combatState.mana = combatState.maxMana;

        // Generate new enemy actions and merge with wrapped actions
        generateEnemyActions();
        const wrappedActions = measureUI.getWrappedEnemyActions();
        if (wrappedActions.length > 0) {
          const currentActions = measureUI.measureState.enemyActions;
          measureUI.setEnemyActions([...currentActions, ...wrappedActions]);
        }
        measureUI.setWrappedEnemyActions([]); // Clear wrapped actions

        // Draw new hand of 5
        drawCards(5);
      });
    }

    function victory() {
      gameState.currentHP = combatState.playerHP;
      gameState.currentFloor++;
      gameState.fightNumber++;
      k.go('reward', { gameState });
    }

    function defeat() {
      gameState.currentHP = combatState.playerHP;
      k.go('gameover', { gameState });
    }
  });
}
