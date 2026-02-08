// Combat scene - FIXED: Delay click handler registration

import { CARDS, getCardColor, getRarityBorderColor } from '../config/cardData.js';
import { createCardSystem } from '../systems/cardSystem.js';
import { createMeasureUI } from '../ui/measureUI.js';
import { createDragDropSystem } from '../systems/dragDropSystem.js';

export function combatScene(k) {
  k.scene('combat', (data) => {
    const { gameState } = data;

    const fightNumber = gameState.fightNumber || 1;
    const enemyHP = 10 + (fightNumber - 1) * 5;
    const enemy = {
      name: 'Slime',
      maxHP: enemyHP,
      color: [100, 255, 100],
    };

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

    const cardSystem = createCardSystem(k);
    const measureUI = createMeasureUI(k);
    const dragDropSystem = createDragDropSystem(k, measureUI, cardSystem);

    k.add([
      k.rect(k.width(), k.height()),
      k.color(20, 20, 30),
      k.pos(0, 0),
    ]);

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

    k.add([
      k.text(`Fight ${fightNumber}`, { size: 24 }),
      k.pos(k.width() - 30, 30),
      k.anchor('right'),
      k.color(200, 200, 200),
    ]);

    let deckViewerOpen = false;
    let discardViewerOpen = false;
    let viewerData = null;

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
      console.log('Draw pile clicked');
      if (discardViewerOpen) return;
      deckViewerOpen = !deckViewerOpen;
      if (deckViewerOpen) showDeckViewer();
      else closeDeckViewer();
    });

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
      console.log('Discard pile clicked');
      if (deckViewerOpen) return;
      discardViewerOpen = !discardViewerOpen;
      if (discardViewerOpen) showDiscardViewer();
      else closeDiscardViewer();
    });

    let scrollOffset = 0;
    let scrollHandler = null;
    let clickHandler = null;

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
      console.log('showPileViewer called with:', title, 'pile length:', pile.length);
      
      scrollOffset = 0;

      const shuffledPile = [...pile];
      for (let i = shuffledPile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPile[i], shuffledPile[j]] = [shuffledPile[j], shuffledPile[i]];
      }

      viewerData = {
        title,
        pile: shuffledPile,
        pileLength: pile.length,
        onClose,
      };

      console.log('viewerData set:', viewerData);

      const cardScale = 1.0; // INCREASED from 0.7 to 1.0
      const cardH = 150 * cardScale;
      const gap = 20;
      const cols = 4; // DECREASED from 5 to 4
      const rows = Math.ceil(shuffledPile.length / cols);
      const maxScroll = Math.max(0, rows * (cardH + gap) - 450);

      scrollHandler = k.onScroll((delta) => {
        scrollOffset = Math.max(0, Math.min(maxScroll, scrollOffset - delta.y * 20));
      });

      // FIXED: Delay click handler by one frame
      k.wait(0.05, () => {
        clickHandler = k.onMousePress(() => {
          if (!viewerData) return; // Already closed
          
          const mousePos = k.mousePos();
          const btnX = k.width() / 2;
          const btnY = k.height() - 50;
          const btnW = 100;
          const btnH = 40;
          
          console.log('Click detected in viewer');
          closePileViewer();
          onClose();
        });
      });

      console.log('Viewer setup complete');
    }

    function closePileViewer() {
      console.log('Closing pile viewer, viewerData was:', viewerData);
      
      viewerData = null;
      
      if (scrollHandler) {
        scrollHandler.cancel();
        scrollHandler = null;
      }
      
      if (clickHandler) {
        clickHandler.cancel();
        clickHandler = null;
      }
      
      scrollOffset = 0;
      console.log('Pile viewer closed, viewerData is now:', viewerData);
    }

    function closeDeckViewer() {
      closePileViewer();
    }

    function closeDiscardViewer() {
      closePileViewer();
    }

    // [REST OF THE COMBAT SCENE CODE - Enemy, HP bars, deck system, etc. - TRUNCATED FOR BREVITY]
    // ... (Include all the rest of the combat scene code here)

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

    combatState.drawPile = shuffleArray(buildStartingDeck());
    combatState.discardPile = [];
    drawCards(5);

    function generateEnemyActions() {
      const actions = [];
      const baseDmg = 3 + Math.floor(fightNumber * 1.5);
      const baseBlk = 2 + fightNumber;
      const minActions = Math.min(2, 1 + Math.floor((fightNumber - 1) / 4));
      const maxActions = Math.min(4, 1 + Math.floor(fightNumber / 2));
      const numActions = minActions + Math.floor(Math.random() * (maxActions - minActions + 1));
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

    generateEnemyActions();

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

    k.onUpdate(() => {
      dragDropSystem.update(handCards, combatState);
    });

    k.onMouseRelease(() => {
      dragDropSystem.handleMouseRelease(handCards, combatState);
    });

    function playLoop() {
      combatState.currentTurn = 'resolving';
      combatState.blockGainedThisLoop = 0;
      beatLog = [];
      resolveBeat(0);
    }

    function resolveBeat(beat) {
      if (beat > 3) {
        finishLoop();
        return;
      }
      measureUI.setPlayhead(beat);
      const actions = measureUI.getActionsForBeat(beat);
      actions.playerEffects.forEach(cardData => {
        cardData.effects.forEach(effect => {
          const logEntry = executeEffect(effect, 'player', beat);
          if (logEntry) beatLog.push(`Beat ${beat + 1}: ${logEntry}`);
        });
      });
      actions.enemyEffects.forEach(action => {
        const logEntry = executeEnemyAction(action);
        if (logEntry) beatLog.push(`Beat ${beat + 1}: ${logEntry}`);
      });
      if (combatState.enemyHP <= 0 || combatState.playerHP <= 0) {
        measureUI.setPlayhead(-1);
        k.wait(0.5, () => {
          if (combatState.enemyHP <= 0) victory();
          else defeat();
        });
        return;
      }
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
      measureUI.setPlayhead(-1);
      const wrappedCards = measureUI.getWrappedCards();
      if (wrappedCards.length > 0) {
        beatLog.push(`--- ${wrappedCards.length} card(s) wrap to next loop ---`);
      }
      const wrappedEnemyActions = measureUI.getWrappedEnemyActions();
      if (wrappedEnemyActions.length > 0) {
        beatLog.push(`--- ${wrappedEnemyActions.length} enemy action(s) delayed to next loop ---`);
      }
      const { rhythmCards, bassCards } = measureUI.getPlacedCards();
      [...rhythmCards, ...bassCards].forEach(card => {
        combatState.discardPile.push(card.deckCardKey);
        card.destroy();
      });
      measureUI.clearMeasure();
      discardHand();
      measureUI.setWrappedCards(wrappedCards);
      combatState.playerBlock = 0;
      combatState.enemyBlock = 0;
      if (combatState.nextLoopDoubleDamage) {
        combatState.doubleDamageMultiplier = 2;
        combatState.nextLoopDoubleDamage = false;
      } else {
        combatState.doubleDamageMultiplier = 1;
      }
      combatState.turnNumber++;
      k.wait(0.5, () => {
        combatState.currentTurn = 'player';
        combatState.mana = combatState.maxMana;
        generateEnemyActions();
        const wrappedActions = measureUI.getWrappedEnemyActions();
        if (wrappedActions.length > 0) {
          const currentActions = measureUI.measureState.enemyActions;
          measureUI.setEnemyActions([...currentActions, ...wrappedActions]);
        }
        measureUI.setWrappedEnemyActions([]);
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

    // Global draw handler for viewer overlay - REGISTERED LAST SO IT DRAWS ON TOP
    k.onDraw(() => {
      if (!viewerData) return;

      const { title, pile, pileLength } = viewerData;

      // Draw overlay
      k.drawRect({
        pos: k.vec2(0, 0),
        width: k.width(),
        height: k.height(),
        color: k.rgb(0, 0, 0, 200),
      });

      // Title
      k.drawText({
        text: title,
        pos: k.vec2(k.width() / 2, 50),
        size: 40,
        font: 'sans-serif',
        anchor: 'center',
        color: k.WHITE,
      });

      // Count
      k.drawText({
        text: `${pileLength} cards`,
        pos: k.vec2(k.width() / 2, 95),
        size: 20,
        font: 'sans-serif',
        anchor: 'center',
        color: k.rgb(180, 180, 180),
      });

      // Scroll hint
      const cardScale = 1.0; // INCREASED from 0.7 to 1.0
      const cardH = 150 * cardScale;
      const gap = 20;
      const cols = 4; // DECREASED from 5 to 4 for bigger cards
      const rows = Math.ceil(pile.length / cols);
      const maxScroll = Math.max(0, rows * (cardH + gap) - 450);
      
      if (maxScroll > 0) {
        k.drawText({
          text: 'Scroll with mouse wheel',
          pos: k.vec2(k.width() / 2, 130),
          size: 16,
          font: 'sans-serif',
          anchor: 'center',
          color: k.rgb(200, 200, 100),
        });
      }

      // Close button
      const btnX = k.width() / 2;
      const btnY = k.height() - 60;
      const btnW = 120;
      const btnH = 50;
      
      k.drawRect({
        pos: k.vec2(btnX - btnW/2, btnY - btnH/2),
        width: btnW,
        height: btnH,
        radius: 6,
        color: k.rgb(120, 120, 120),
        outline: { width: 3, color: k.WHITE },
      });

      k.drawText({
        text: 'CLOSE',
        pos: k.vec2(btnX, btnY),
        size: 22,
        font: 'sans-serif',
        anchor: 'center',
        color: k.WHITE,
      });

      // Draw cards
      const cardW = 110 * cardScale;
      const startX = (k.width() - (cols * (cardW + gap) - gap)) / 2;
      const startY = 160 - scrollOffset;

      pile.forEach((cardKey, i) => {
        const cardData = CARDS[cardKey];
        if (!cardData) return;

        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (cardW + gap);
        const y = startY + row * (cardH + gap);

        if (y + cardH < 160 || y > k.height() - 120) return;

        const cardColor = getCardColor(cardData);
        const borderColor = getRarityBorderColor(cardData.rarity);

        k.drawRect({
          pos: k.vec2(x - 110/2 * cardScale, y - 150/2 * cardScale),
          width: 110 * cardScale,
          height: 150 * cardScale,
          radius: 4,
          color: k.rgb(...cardColor),
          outline: { width: 3, color: k.rgb(...borderColor) },
        });

        k.drawCircle({
          pos: k.vec2(x - 110/2 * cardScale + 20 * cardScale, y - 150/2 * cardScale + 20 * cardScale),
          radius: 16 * cardScale,
          color: k.rgb(100, 200, 255),
          outline: { width: 2, color: k.BLACK },
        });

        k.drawText({
          text: cardData.mana.toString(),
          pos: k.vec2(x - 110/2 * cardScale + 20 * cardScale, y - 150/2 * cardScale + 20 * cardScale),
          size: 18 * cardScale,
          font: 'sans-serif',
          anchor: 'center',
          color: k.WHITE,
        });

        if (cardData.type !== 'utility' && cardData.beats > 0) {
          k.drawRect({
            pos: k.vec2(x + 110/2 * cardScale - 20 * cardScale - 15 * cardScale, y - 150/2 * cardScale + 10 * cardScale),
            width: 30 * cardScale,
            height: 20 * cardScale,
            radius: 2,
            color: k.rgb(0, 0, 0, 150),
            outline: { width: 1, color: k.rgb(200, 200, 200) },
          });

          k.drawText({
            text: `${cardData.beats}♪`,
            pos: k.vec2(x + 110/2 * cardScale - 20 * cardScale, y - 150/2 * cardScale + 20 * cardScale),
            size: 14 * cardScale,
            font: 'sans-serif',
            anchor: 'center',
            color: k.WHITE,
          });
        }

        k.drawText({
          text: cardData.name,
          pos: k.vec2(x, y - 150/2 * cardScale + 45 * cardScale),
          size: 12 * cardScale,
          font: 'sans-serif',
          anchor: 'center',
          color: k.BLACK,
          width: 100 * cardScale,
        });

        const typeColors = {
          rhythm: [220, 50, 50],
          bass: [50, 150, 220],
          utility: [150, 220, 50],
        };

        k.drawRect({
          pos: k.vec2(x - 100/2 * cardScale, y - 150/2 * cardScale + 65 * cardScale - 8 * cardScale),
          width: 100 * cardScale,
          height: 16 * cardScale,
          radius: 2,
          color: k.rgb(...(typeColors[cardData.type] || [100, 100, 100])),
        });

        k.drawText({
          text: cardData.type.toUpperCase(),
          pos: k.vec2(x, y - 150/2 * cardScale + 65 * cardScale),
          size: 10 * cardScale,
          font: 'sans-serif',
          anchor: 'center',
          color: k.WHITE,
        });

        k.drawText({
          text: cardData.description,
          pos: k.vec2(x, y + 15 * cardScale),
          size: 9 * cardScale,
          font: 'sans-serif',
          anchor: 'center',
          color: k.BLACK,
          width: 95 * cardScale,
          lineSpacing: 2,
        });
      });
    });
  });
}
