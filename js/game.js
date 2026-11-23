// Dungeon Cards — game state and turn logic. No DOM here except the
// log; ui.js renders whatever this module puts in DC.game.state.
window.DC = window.DC || {};

DC.game = {
  state: null,
  BEST_KEY: "dungeonCardsBest",

  bestScore: function () {
    try {
      return parseInt(window.localStorage.getItem(this.BEST_KEY) || "0", 10) || 0;
    } catch (e) { return 0; }
  },

  saveBest: function (score) {
    try {
      if (score > this.bestScore()) window.localStorage.setItem(this.BEST_KEY, String(score));
    } catch (e) { /* storage unavailable: best score just isn't kept */ }
  },

  log: function (msg) {
    if (!this.state) return;
    this.state.log.unshift(msg);
    if (this.state.log.length > 6) this.state.log.length = 6;
  },

  shuffle: function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  },

  newGame: function () {
    this.state = {
      screen: "fight",
      level: 1,
      hp: 60, maxHp: 60,
      gold: 0, score: 0,
      energy: 3, maxEnergy: 3,
      block: 0,
      deck: DC.STARTING_DECK.slice(),
      drawPile: [], discardPile: [], hand: [],
      monster: null,
      playerPoison: 0,
      weak: 0,
      log: [],
      draftChoices: [],
      turn: 1,
      over: false,
      won: false
    };
    this.startLevel(1);
    this.log("You descend into the dungeon. Level 1: Cave Rat!");
    DC.ui.renderAll();
  },

  startLevel: function (level) {
    var def = DC.monsterForLevel(level);
    var s = this.state;
    s.level = level;
    s.monster = {
      def: def, hp: def.hp, maxHp: def.hp,
      moveIndex: 0, poison: 0
    };
    s.drawPile = this.shuffle(s.deck.slice());
    s.discardPile = [];
    s.hand = [];
    s.block = 0;
    s.playerPoison = 0;
    s.weak = 0;
    s.turn = 1;
    this.startPlayerTurn();
  },

  startPlayerTurn: function () {
    var s = this.state;
    s.block = 0;
    s.energy = s.maxEnergy;
    if (s.playerPoison > 0) {
      var p = s.playerPoison;
      s.hp = Math.max(0, s.hp - p);
      this.log("Poison burns you for " + p + " damage.");
      s.playerPoison = 0;
      if (s.hp <= 0) { this.endGame(false); return; }
    }
    this.drawCards(5);
  },

  drawCards: function (n) {
    var s = this.state;
    for (var i = 0; i < n; i++) {
      if (s.drawPile.length === 0) {
        if (s.discardPile.length === 0) break;
        s.drawPile = this.shuffle(s.discardPile);
        s.discardPile = [];
        this.log("You reshuffle the discard pile into your deck.");
      }
      s.hand.push(s.drawPile.pop());
    }
  },

  monsterIntent: function () {
    var s = this.state;
    if (!s.monster) return null;
    var move = s.monster.def.moves[s.monster.moveIndex % s.monster.def.moves.length];
    var dmg = Math.max(0, move.dmg - s.weak);
    return { dmg: dmg, poison: move.poison || 0, heal: move.heal || 0, raw: move };
  },

  playCard: function (handIndex) {
    var s = this.state;
    if (!s || s.screen !== "fight" || s.over) return false;
    if (handIndex < 0 || handIndex >= s.hand.length) return false;
    var card = DC.cardById(s.hand[handIndex]);
    if (!card) return false;
    if (card.cost > s.energy) {
      this.log("Not enough energy for " + card.name + ".");
      return false;
    }
    s.energy -= card.cost;
    s.hand.splice(handIndex, 1);
    s.discardPile.push(card.id);
    DC.audio.play("card");

    if (card.loseHp) {
      s.hp = Math.max(1, s.hp - card.loseHp);
      this.log("Blood Pact: you lose " + card.loseHp + " HP.");
    }
    if (card.energy) {
      s.energy += card.energy;
      this.log(card.name + ": +" + card.energy + " energy.");
    }
    if (card.block) {
      s.block += card.block;
      DC.audio.play("block");
      this.log(card.name + ": +" + card.block + " block.");
    }
    if (card.heal) {
      var healed = Math.min(card.heal, s.maxHp - s.hp);
      s.hp += healed;
      DC.audio.play("heal");
      this.log(card.name + ": restore " + healed + " HP.");
    }
    if (card.draw) this.drawCards(card.draw);
    if (card.weak) {
      s.weak += card.weak;
      this.log(card.name + ": the monster is weakened (-" + card.weak + " attack).");
    }
    if (card.dmg) this.damageMonster(card.dmg, card.hits || 1);
    if (card.poison) {
      s.monster.poison += card.poison;
      this.log(card.name + ": the monster takes " + card.poison + " poison.");
    }

    if (s.monster && s.monster.hp <= 0) {
      this.levelCleared();
    } else {
      DC.ui.renderAll();
    }
    return true;
  },

  damageMonster: function (amount, hits) {
    var s = this.state;
    var total = 0;
    for (var h = 0; h < hits; h++) {
      var dmg = Math.max(0, amount - (s.monster.def.armor || 0));
      s.monster.hp = Math.max(0, s.monster.hp - dmg);
      total += dmg;
    }
    s.score += total;
    DC.audio.play("hit");
    this.log("You deal " + total + " damage.");
  },

  endTurn: function () {
    var s = this.state;
    if (!s || s.screen !== "fight" || s.over) return;
    // Discard the hand, then the monster acts.
    while (s.hand.length > 0) s.discardPile.push(s.hand.pop());
    this.monsterAct();
    if (s.over) { DC.ui.renderAll(); return; }
    // Poison ticks on the monster after it acts.
    if (s.monster.poison > 0) {
      var p = s.monster.poison;
      s.monster.hp = Math.max(0, s.monster.hp - p);
      s.score += p;
      s.monster.poison = Math.max(0, s.monster.poison - 1);
      this.log("Poison deals " + p + " damage to the monster.");
      if (s.monster.hp <= 0) { this.levelCleared(); return; }
    }
    s.turn += 1;
    this.startPlayerTurn();
    DC.ui.renderAll();
  },

  monsterAct: function () {
    var s = this.state;
    var intent = this.monsterIntent();
    if (!intent) return;
    var dmg = intent.dmg;
    var absorbed = Math.min(s.block, dmg);
    var through = dmg - absorbed;
    s.block -= absorbed;
    s.hp = Math.max(0, s.hp - through);
    DC.audio.play("hurt");
    this.log(s.monster.def.name + " attacks for " + dmg +
      (absorbed > 0 ? " (" + absorbed + " blocked)" : "") + ".");
    if (intent.poison) {
      s.playerPoison += intent.poison;
      this.log("The cultist's venom seeps in: you are poisoned (" + intent.poison + ").");
    }
    if (intent.heal) {
      var healed = Math.min(intent.heal, s.monster.def.hp - s.monster.hp);
      s.monster.hp += healed;
      this.log(s.monster.def.name + " drains your life and heals " + healed + " HP!");
    }
    s.monster.moveIndex += 1;
    s.weak = 0;
    if (s.hp <= 0) this.endGame(false);
  },

  levelCleared: function () {
    var s = this.state;
    var def = s.monster.def;
    s.gold += def.gold;
    s.score += 100 * s.level;
    DC.audio.play("coin");
    this.log(def.name + " is defeated! +" + def.gold + " gold, +" + (100 * s.level) + " score.");
    if (s.level >= 5) {
      s.score += s.hp * 5;
      this.endGame(true);
      return;
    }
    // Draft: 3 random distinct cards, then heal a little.
    var pool = DC.CARDS.slice();
    this.shuffle(pool);
    s.draftChoices = [pool[0].id, pool[1].id, pool[2].id];
    s.screen = "draft";
    DC.ui.renderAll();
  },

  pickDraft: function (cardId) {
    var s = this.state;
    if (!s || s.screen !== "draft") return;
    var card = DC.cardById(cardId);
    if (!card) return;
    s.deck.push(cardId);
    var healed = Math.min(10, s.maxHp - s.hp);
    s.hp += healed;
    DC.audio.play("draft");
    this.log("You add " + card.name + " to your deck and rest (+ " + healed + " HP).");
    s.screen = "fight";
    this.startLevel(s.level + 1);
    this.log("Level " + s.level + ": " + s.monster.def.name + " blocks the way!");
    DC.ui.renderAll();
  },

  endGame: function (won) {
    var s = this.state;
    s.over = true;
    s.won = won;
    s.screen = won ? "win" : "lose";
    if (won) {
      this.saveBest(s.score);
      DC.audio.play("win");
    } else {
      DC.audio.play("lose");
    }
    DC.ui.renderAll();
  },

  // Deterministic scenes for screenshots: ?shot=start|play|boss|win.
  // These set an exact state and render it, with no user input.
  setupShot: function (scene) {
    if (scene === "win") {
      this.state = {
        screen: "win", level: 5, hp: 34, maxHp: 60, gold: 110, score: 2450,
        energy: 0, maxEnergy: 3, block: 0,
        deck: DC.STARTING_DECK.slice(), drawPile: [], discardPile: [], hand: [],
        monster: null, playerPoison: 0, weak: 0, log: ["Lich King is defeated! +50 gold, +500 score."], 
        draftChoices: [], turn: 9, over: true, won: true
      };
      DC.ui.renderAll();
      return;
    }
    if (scene === "boss") {
      this.state = {
        screen: "fight", level: 5, hp: 41, maxHp: 60, gold: 60, score: 1870,
        energy: 2, maxEnergy: 3, block: 8,
        deck: DC.STARTING_DECK.slice(),
        drawPile: ["strike", "guard", "mend", "twin", "jab", "guard", "strike", "venom"],
        discardPile: ["strike", "guard"],
        hand: ["heavy", "wall", "leech", "venom", "focus"],
        monster: { def: DC.monsterForLevel(5), hp: 62, maxHp: 85, moveIndex: 2, poison: 3 },
        playerPoison: 0, weak: 2,
        log: ["Frost Shard: the monster is weakened (-2 attack).", "You deal 11 damage.", "Lich King attacks for 12 (8 blocked)."],
        draftChoices: [], turn: 6, over: false, won: false
      };
      DC.ui.renderAll();
      return;
    }
    if (scene === "play") {
      this.state = {
        screen: "fight", level: 2, hp: 48, maxHp: 60, gold: 10, score: 320,
        energy: 3, maxEnergy: 3, block: 6,
        deck: DC.STARTING_DECK.slice(),
        drawPile: ["strike", "guard", "mend", "twin", "jab", "guard", "strike", "heavy"],
        discardPile: ["jab", "guard"],
        hand: ["strike", "guard", "fireball", "mend", "twin"],
        monster: { def: DC.monsterForLevel(2), hp: 20, maxHp: 34, moveIndex: 1, poison: 0 },
        playerPoison: 0, weak: 0,
        log: ["You deal 6 damage.", "Goblin Cutpurse attacks for 7 (6 blocked).", "You descend into the dungeon. Level 2: Goblin Cutpurse!"],
        draftChoices: [], turn: 3, over: false, won: false
      };
      DC.ui.renderAll();
      return;
    }
    // "start" (or anything else): the title screen.
    this.state = null;
    DC.ui.renderAll();
  }
};
