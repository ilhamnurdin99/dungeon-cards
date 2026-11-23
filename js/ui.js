// Dungeon Cards — DOM rendering and input. Reads DC.game.state and
// redraws the HUD, monster, hand, log and overlays.
window.DC = window.DC || {};

DC.ui = {
  el: function (id) { return document.getElementById(id); },

  init: function () {
    var self = this;
    this.el("play-btn").addEventListener("click", function () {
      DC.audio.ensure(); DC.audio.play("draft"); DC.game.newGame();
    });
    this.el("howto-btn").addEventListener("click", function () {
      self.el("howto").classList.toggle("open");
    });
    this.el("end-turn-btn").addEventListener("click", function () { DC.game.endTurn(); });
    this.el("pause-btn").addEventListener("click", function () { self.togglePause(); });
    this.el("mute-btn").addEventListener("click", function () {
      var muted = DC.audio.toggleMute();
      self.el("mute-btn").textContent = muted ? "\u{1F507} Muted" : "\u{1F50A} Sound";
    });
    this.el("resume-btn").addEventListener("click", function () { self.togglePause(); });
    this.el("restart-btn").addEventListener("click", function () { DC.game.newGame(); });
    this.el("again-btn").addEventListener("click", function () { DC.game.newGame(); });
    this.el("menu-btn").addEventListener("click", function () {
      DC.game.state = null; self.renderAll();
    });
    document.addEventListener("keydown", function (e) {
      var s = DC.game.state;
      if (!s) {
        if (e.key === "Enter") DC.game.newGame();
        return;
      }
      if (e.key === "p" || e.key === "P" || e.key === "Escape") { self.togglePause(); return; }
      if (e.key === "m" || e.key === "M") {
        var muted = DC.audio.toggleMute();
        self.el("mute-btn").textContent = muted ? "\u{1F507} Muted" : "\u{1F50A} Sound";
        return;
      }
      if (s.screen !== "fight" || s.over || self.el("pause-screen").classList.contains("show")) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); DC.game.endTurn(); return; }
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) DC.game.playCard(n - 1);
    });
    this.renderAll();
  },

  togglePause: function () {
    var s = DC.game.state;
    if (!s || (s.screen !== "fight" && s.screen !== "draft") || s.over) return;
    this.el("pause-screen").classList.toggle("show");
  },

  bar: function (cur, max, cls) {
    var pct = max > 0 ? Math.max(0, Math.min(100, Math.round(100 * cur / max))) : 0;
    return '<div class="bar ' + cls + '"><div class="fill" style="width:' + pct + '%"></div>' +
      '<span class="bar-text">' + cur + " / " + max + "</span></div>";
  },

  cardHtml: function (card, index, playable) {
    var cls = "card type-" + card.type + (playable ? "" : " unplayable");
    var key = (typeof index === "number") ? '<span class="key">' + (index + 1) + "</span>" : "";
    return '<div class="' + cls + '" data-card="' + card.id + '">' + key +
      '<span class="cost">' + card.cost + "</span>" +
      '<span class="card-icon">' + card.icon + "</span>" +
      '<span class="card-name">' + card.name + "</span>" +
      '<span class="card-text">' + card.text + "</span></div>";
  },

  renderAll: function () {
    var s = DC.game.state;
    var hasGame = !!s;
    this.el("title-screen").classList.toggle("show", !hasGame);
    this.el("draft-screen").classList.toggle("show", hasGame && s.screen === "draft");
    this.el("end-screen").classList.toggle("show", hasGame && (s.screen === "win" || s.screen === "lose"));
    this.el("board").classList.toggle("hidden", !hasGame || s.screen === "win" || s.screen === "lose");
    if (!hasGame) {
      this.el("best-line").textContent = "Best score: " + DC.game.bestScore();
      return;
    }
    this.renderHud(s);
    if (s.screen === "fight" || s.screen === "draft") this.renderFight(s);
    if (s.screen === "draft") this.renderDraft(s);
    if (s.screen === "win" || s.screen === "lose") this.renderEnd(s);
  },

  renderHud: function (s) {
    this.el("hud-level").textContent = "Level " + s.level + " / 5";
    this.el("hud-score").textContent = "Score " + s.score;
    this.el("hud-gold").textContent = "\u{1FA99} " + s.gold;
    this.el("hud-best").textContent = "Best " + Math.max(DC.game.bestScore(), s.score);
    this.el("hud-deck").textContent = "Deck " + s.deck.length +
      "  \u00B7  Draw " + s.drawPile.length + "  \u00B7  Discard " + s.discardPile.length;
  },

  renderFight: function (s) {
    var m = s.monster;
    var intent = DC.game.monsterIntent();
    var intentHtml = "";
    if (intent) {
      intentHtml = '<div class="intent">Next: \u2694\uFE0F ' + intent.dmg + " damage" +
        (intent.poison ? " + \u2620\uFE0F " + intent.poison + " poison" : "") +
        (intent.heal ? " + heals " + intent.heal : "") + "</div>";
    }
    this.el("monster-box").innerHTML =
      '<div class="monster-icon">' + m.def.icon + "</div>" +
      '<div class="monster-name">' + m.def.name + (m.def.boss ? ' <span class="boss-tag">BOSS</span>' : "") + "</div>" +
      '<div class="monster-desc">' + m.def.desc + "</div>" +
      this.bar(m.hp, m.maxHp, "hp-monster") +
      '<div class="monster-meta">' +
        (m.def.armor ? "<span>Thick hide: -" + m.def.armor + " per hit</span>" : "") +
        (m.poison > 0 ? "<span class='poison'>\u2620\uFE0F Poison " + m.poison + "</span>" : "") +
      "</div>" + intentHtml;

    this.el("player-box").innerHTML =
      '<div class="player-line"><span class="player-icon">\u{1F9DD}</span>' +
      '<span class="player-name">Delver</span>' +
      '<span class="player-stats">\u26A1\uFE0F Energy ' + s.energy + " / " + s.maxEnergy +
      (s.block > 0 ? ' &nbsp;\u{1F6E1}\uFE0F Block ' + s.block : "") +
      (s.weak > 0 ? " &nbsp;\u{1F319} Weak -" + s.weak : "") +
      (s.playerPoison > 0 ? ' &nbsp;<span class="poison">\u2620\uFE0F Poisoned</span>' : "") +
      "</span></div>" +
      this.bar(s.hp, s.maxHp, "hp-player");

    var hand = this.el("hand");
    hand.innerHTML = "";
    var self = this;
    s.hand.forEach(function (cardId, i) {
      var card = DC.cardById(cardId);
      var wrap = document.createElement("div");
      wrap.innerHTML = self.cardHtml(card, i, card.cost <= s.energy);
      var node = wrap.firstChild;
      node.addEventListener("click", function () { DC.game.playCard(i); });
      hand.appendChild(node);
    });
    if (s.hand.length === 0) {
      hand.innerHTML = '<div class="hand-empty">No cards in hand — end your turn to draw again.</div>';
    }

    this.el("end-turn-btn").disabled = (s.screen !== "fight");
    this.el("log").innerHTML = s.log.map(function (line) {
      return "<div>" + line + "</div>";
    }).join("");
  },

  renderDraft: function (s) {
    var box = this.el("draft-choices");
    box.innerHTML = "";
    var self = this;
    s.draftChoices.forEach(function (cardId) {
      var card = DC.cardById(cardId);
      var wrap = document.createElement("div");
      wrap.innerHTML = self.cardHtml(card, null, true);
      var node = wrap.firstChild;
      node.classList.add("draft-pick");
      node.addEventListener("click", function () { DC.game.pickDraft(cardId); });
      box.appendChild(node);
    });
    this.el("draft-note").textContent =
      "Level " + s.level + " cleared! Choose one card to add to your deck. You also rest and recover 10 HP.";
  },

  renderEnd: function (s) {
    var win = s.screen === "win";
    this.el("end-title").textContent = win ? "\u{1F3C6} VICTORY!" : "\u{1F480} GAME OVER";
    this.el("end-title").className = win ? "end-title win" : "end-title lose";
    this.el("end-text").textContent = win
      ? "The Lich King falls! You loot the dungeon vault and stride out into the sunlight, deck in hand."
      : "Your delving ends on level " + s.level + ". The dungeon keeps its gold... this time.";
    this.el("end-score").innerHTML =
      "Score: <b>" + s.score + "</b> &nbsp;\u00B7&nbsp; Level reached: <b>" + s.level +
      " / 5</b> &nbsp;\u00B7&nbsp; Gold: <b>" + s.gold + "</b><br>Best score: <b>" +
      Math.max(DC.game.bestScore(), s.score) + "</b>";
  }
};
