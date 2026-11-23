// Dungeon Cards — canvas art. Everything is drawn with the 2D canvas API:
// a full-viewport dungeon background (bricks, floor, torches, fog, embers),
// canvas monster portraits, a player avatar, title art, treasure art and
// small card-art motifs. No images, no network. Vanilla JS only.
window.DC = window.DC || {};

DC.art = {
  _bg: null, _bgCtx: null, _static: null, _embers: [], _start: 0,

  // Deterministic pseudo-random from a seed (so stills look consistent).
  _rand: function (seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  },

  // ---------- Full-viewport dungeon background ----------
  initBackground: function () {
    var cv = document.getElementById("bg-canvas");
    if (!cv) return;
    this._bg = cv;
    this._bgCtx = cv.getContext("2d");
    this._start = Date.now();
    var self = this;
    var build = function () { self._buildStatic(); };
    build();
    window.addEventListener("resize", build);
    // Ember particles, seeded.
    var rnd = this._rand(1337);
    this._embers = [];
    for (var i = 0; i < 42; i++) {
      this._embers.push({ x: rnd(), y: rnd(), r: 0.8 + rnd() * 2.2, s: 0.00004 + rnd() * 0.00009, w: rnd() * 6.28 });
    }
    var loop = function () {
      self._drawBackground();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  _buildStatic: function () {
    var cv = this._bg;
    var w = cv.width = window.innerWidth;
    var h = cv.height = window.innerHeight;
    var off = document.createElement("canvas");
    off.width = w; off.height = h;
    var g = off.getContext("2d");
    var rnd = this._rand(4242);
    // Wall gradient.
    var wall = g.createLinearGradient(0, 0, 0, h);
    wall.addColorStop(0, "#241c33"); wall.addColorStop(0.6, "#1a1426"); wall.addColorStop(1, "#100b1a");
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    // Brick rows.
    var bh = 46, bw = 92;
    for (var y = 0; y < h * 0.72; y += bh) {
      var offX = (Math.floor(y / bh) % 2) ? -bw / 2 : 0;
      for (var x = offX; x < w; x += bw) {
        var v = 0.85 + rnd() * 0.3;
        var r = Math.floor(52 * v), gg = Math.floor(44 * v), b = Math.floor(72 * v);
        g.fillStyle = "rgb(" + r + "," + gg + "," + b + ")";
        g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
        g.fillStyle = "rgba(255,220,160,0.05)";
        g.fillRect(x + 2, y + 2, bw - 4, 5);
      }
    }
    // Dark mortar lines.
    g.strokeStyle = "rgba(0,0,0,0.45)"; g.lineWidth = 2;
    for (var yy = 0; yy < h * 0.72; yy += bh) {
      g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke();
    }
    // Floor: big stone slabs, bottom quarter.
    var fy = Math.floor(h * 0.72);
    var fg = g.createLinearGradient(0, fy, 0, h);
    fg.addColorStop(0, "#2c2438"); fg.addColorStop(1, "#14101d");
    g.fillStyle = fg; g.fillRect(0, fy, w, h - fy);
    g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 2;
    for (var i = 0; i < 6; i++) {
      var fx = Math.floor(w * (i / 5)) + Math.floor(rnd() * 30 - 15);
      g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx - 40 + rnd() * 80, h); g.stroke();
    }
    g.beginPath(); g.moveTo(0, fy); g.lineTo(w, fy); g.stroke();
    // Big arched doorway in the center background.
    var cx = w / 2, aw = Math.min(340, w * 0.28), ah = h * 0.62, ay = h * 0.72;
    g.fillStyle = "#0a0712";
    g.beginPath();
    g.moveTo(cx - aw / 2, ay);
    g.lineTo(cx - aw / 2, ay - ah + aw / 2);
    g.arc(cx, ay - ah + aw / 2, aw / 2, Math.PI, 0);
    g.lineTo(cx + aw / 2, ay);
    g.closePath(); g.fill();
    // Arch rim stones.
    g.strokeStyle = "#4a3a68"; g.lineWidth = 10;
    g.beginPath();
    g.moveTo(cx - aw / 2, ay);
    g.lineTo(cx - aw / 2, ay - ah + aw / 2);
    g.arc(cx, ay - ah + aw / 2, aw / 2, Math.PI, 0);
    g.lineTo(cx + aw / 2, ay);
    g.stroke();
    // Faint glow from inside the doorway.
    var dg = g.createRadialGradient(cx, ay - ah * 0.45, 10, cx, ay - ah * 0.45, aw);
    dg.addColorStop(0, "rgba(255,170,60,0.28)"); dg.addColorStop(1, "rgba(255,170,60,0)");
    g.fillStyle = dg;
    g.beginPath(); g.arc(cx, ay - ah * 0.45, aw, 0, 6.29); g.fill();
    // Wall torches (brackets + flame drawn static; glow animates).
    this._drawTorch(g, Math.max(70, w * 0.08), h * 0.30);
    this._drawTorch(g, Math.min(w - 70, w * 0.92), h * 0.30);
    // Vignette.
    var vg = g.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.35, w / 2, h * 0.5, Math.max(w, h) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.55)");
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    this._static = off;
  },

  _drawTorch: function (g, x, y) {
    // Bracket.
    g.fillStyle = "#3a2c1c";
    g.fillRect(x - 4, y, 8, 34);
    g.fillStyle = "#6b4a08";
    g.beginPath(); g.moveTo(x - 12, y); g.lineTo(x + 12, y); g.lineTo(x, y + 14); g.closePath(); g.fill();
    // Flame (static core; animated glow is drawn per frame).
    var fl = g.createRadialGradient(x, y - 12, 2, x, y - 12, 26);
    fl.addColorStop(0, "#fff3b0"); fl.addColorStop(0.45, "#ffb347"); fl.addColorStop(1, "rgba(255,90,0,0)");
    g.fillStyle = fl;
    g.beginPath(); g.arc(x, y - 12, 26, 0, 6.29); g.fill();
    g.fillStyle = "#ffdd66";
    g.beginPath();
    g.moveTo(x, y - 30); g.quadraticCurveTo(x + 9, y - 12, x, y - 2);
    g.quadraticCurveTo(x - 9, y - 12, x, y - 30);
    g.fill();
  },

  _drawBackground: function () {
    var cv = this._bg, g = this._bgCtx;
    if (!cv || !this._static) return;
    var w = cv.width, h = cv.height;
    g.drawImage(this._static, 0, 0);
    var t = (Date.now() - this._start) / 1000;
    // Flickering torch glow.
    var flick = 0.75 + 0.25 * Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1.7);
    var tx1 = Math.max(70, w * 0.08), tx2 = Math.min(w - 70, w * 0.92), ty = h * 0.30;
    var glow = function (x) {
      var gg = g.createRadialGradient(x, ty - 12, 4, x, ty - 12, 190 * flick);
      gg.addColorStop(0, "rgba(255,170,70," + (0.22 * flick) + ")");
      gg.addColorStop(1, "rgba(255,170,70,0)");
      g.fillStyle = gg;
      g.beginPath(); g.arc(x, ty - 12, 190 * flick, 0, 6.29); g.fill();
    };
    glow(tx1); glow(tx2);
    // Drifting fog band.
    g.fillStyle = "rgba(180,170,220,0.045)";
    for (var i = 0; i < 3; i++) {
      var fx = ((t * 12 + i * w * 0.4) % (w + 400)) - 200;
      g.beginPath(); g.ellipse(fx, h * (0.62 + i * 0.1), 260, 34, 0, 0, 6.29); g.fill();
    }
    // Rising embers.
    g.fillStyle = "rgba(255,180,90,0.8)";
    for (var j = 0; j < this._embers.length; j++) {
      var e = this._embers[j];
      var ey = h - ((e.y * h + t * e.s * h * 1000) % h);
      var ex = e.x * w + Math.sin(t + e.w) * 14;
      g.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(t * 2 + e.w));
      g.beginPath(); g.arc(ex, ey, e.r, 0, 6.29); g.fill();
    }
    g.globalAlpha = 1;
  },

  // ---------- Monster portraits (220 x 200) ----------
  drawMonster: function (cv, def) {
    if (!cv || !def) return;
    var g = cv.getContext("2d");
    g.clearRect(0, 0, cv.width, cv.height);
    // Draw in a fixed 220x200 space, scaled to the canvas size.
    g.save();
    g.scale(cv.width / 220, cv.height / 200);
    var w = 220, h = 200;
    // Portrait backdrop: dark alcove with rim light.
    var bg = g.createRadialGradient(w / 2, h * 0.42, 8, w / 2, h * 0.5, w * 0.62);
    var tint = { rat: "#5a4632", goblin: "#2d4a22", golem: "#3a3a44", cultist: "#3a2350", lich: "#12284a" }[def.icon === "\u{1F400}" ? "rat" : def.name === "Goblin Cutpurse" ? "goblin" : def.name === "Stone Golem" ? "golem" : def.name === "Dark Cultist" ? "cultist" : "lich"] || "#2a2138";
    bg.addColorStop(0, tint); bg.addColorStop(1, "#0d0a14");
    g.fillStyle = bg;
    g.beginPath(); g.arc(w / 2, h * 0.46, w * 0.46, 0, 6.29); g.fill();
    g.strokeStyle = "rgba(255,217,122,0.35)"; g.lineWidth = 3;
    g.beginPath(); g.arc(w / 2, h * 0.46, w * 0.46, 0, 6.29); g.stroke();
    var cx = w / 2;
    if (def.name === "Cave Rat") {
      // Body.
      g.fillStyle = "#6b5a48";
      g.beginPath(); g.ellipse(cx, 138, 62, 52, 0, 0, 6.29); g.fill();
      g.fillStyle = "#7d6b58";
      g.beginPath(); g.ellipse(cx, 118, 48, 40, 0, 0, 6.29); g.fill();
      // Ears.
      g.fillStyle = "#8a7663";
      g.beginPath(); g.arc(cx - 34, 66, 20, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 34, 66, 20, 0, 6.29); g.fill();
      g.fillStyle = "#d98a8a";
      g.beginPath(); g.arc(cx - 34, 66, 10, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 34, 66, 10, 0, 6.29); g.fill();
      // Head.
      g.fillStyle = "#7d6b58";
      g.beginPath(); g.ellipse(cx, 92, 42, 34, 0, 0, 6.29); g.fill();
      // Snout + nose.
      g.fillStyle = "#8a7663";
      g.beginPath(); g.ellipse(cx, 108, 20, 12, 0, 0, 6.29); g.fill();
      g.fillStyle = "#c25a6a";
      g.beginPath(); g.arc(cx, 100, 6, 0, 6.29); g.fill();
      // Eyes (red).
      g.fillStyle = "#ff4444";
      g.beginPath(); g.arc(cx - 16, 82, 6, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 16, 82, 6, 0, 6.29); g.fill();
      g.fillStyle = "#1a0d0d";
      g.beginPath(); g.arc(cx - 16, 82, 2.5, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 16, 82, 2.5, 0, 6.29); g.fill();
      // Whiskers.
      g.strokeStyle = "#d8cde8"; g.lineWidth = 1.5;
      [[-1, -4], [-1, 0], [-1, 4], [1, -4], [1, 0], [1, 4]].forEach(function (o) {
        g.beginPath(); g.moveTo(cx + o[0] * 18, 106 + o[1]);
        g.lineTo(cx + o[0] * 44, 100 + o[1] * 2); g.stroke();
      });
      // Tail curl.
      g.strokeStyle = "#c9a0a0"; g.lineWidth = 5;
      g.beginPath(); g.arc(cx + 58, 168, 16, 0.6, 4.4); g.stroke();
    } else if (def.name === "Goblin Cutpurse") {
      // Hooded head.
      g.fillStyle = "#2f5d23";
      g.beginPath(); g.moveTo(cx - 52, 150); g.quadraticCurveTo(cx - 58, 70, cx, 52);
      g.quadraticCurveTo(cx + 58, 70, cx + 52, 150); g.closePath(); g.fill();
      // Face.
      g.fillStyle = "#58a83c";
      g.beginPath(); g.ellipse(cx, 100, 36, 40, 0, 0, 6.29); g.fill();
      // Long ears.
      g.fillStyle = "#4c9434";
      g.beginPath(); g.moveTo(cx - 32, 88); g.lineTo(cx - 72, 62); g.lineTo(cx - 28, 106); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(cx + 32, 88); g.lineTo(cx + 72, 62); g.lineTo(cx + 28, 106); g.closePath(); g.fill();
      // Eyes (yellow, sly).
      g.fillStyle = "#ffe14d";
      g.beginPath(); g.ellipse(cx - 14, 92, 8, 5, -0.2, 0, 6.29); g.fill();
      g.beginPath(); g.ellipse(cx + 14, 92, 8, 5, 0.2, 0, 6.29); g.fill();
      g.fillStyle = "#111";
      g.beginPath(); g.arc(cx - 14, 92, 2.5, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 14, 92, 2.5, 0, 6.29); g.fill();
      // Grin with teeth.
      g.fillStyle = "#1c2b12";
      g.beginPath(); g.ellipse(cx, 122, 20, 9, 0, 0, 3.14); g.fill();
      g.fillStyle = "#fff";
      g.fillRect(cx - 12, 118, 5, 5); g.fillRect(cx - 2, 118, 5, 5); g.fillRect(cx + 8, 118, 5, 5);
      // Dagger.
      g.save(); g.translate(cx + 62, 150); g.rotate(0.7);
      g.fillStyle = "#c8d2dc"; g.beginPath(); g.moveTo(0, -26); g.lineTo(7, -4); g.lineTo(-7, -4); g.closePath(); g.fill();
      g.fillStyle = "#6b4a08"; g.fillRect(-4, -4, 8, 16); g.fill();
      g.restore();
      // Coin pouch.
      g.fillStyle = "#c98f1e";
      g.beginPath(); g.arc(cx - 58, 160, 14, 0, 6.29); g.fill();
      g.strokeStyle = "#8a6410"; g.lineWidth = 2;
      g.beginPath(); g.arc(cx - 58, 160, 14, 0, 6.29); g.stroke();
      g.fillStyle = "#ffd97a"; g.font = "bold 13px Georgia"; g.textAlign = "center";
      g.fillText("$", cx - 58, 165);
    } else if (def.name === "Stone Golem") {
      // Rocky body.
      g.fillStyle = "#6f6f7d";
      g.beginPath(); g.moveTo(cx - 66, 190); g.lineTo(cx - 58, 120); g.lineTo(cx - 30, 96);
      g.lineTo(cx + 30, 96); g.lineTo(cx + 58, 120); g.lineTo(cx + 66, 190); g.closePath(); g.fill();
      // Rock plates.
      g.fillStyle = "#83838f";
      g.beginPath(); g.moveTo(cx - 40, 130); g.lineTo(cx - 10, 118); g.lineTo(cx + 4, 142); g.lineTo(cx - 26, 156); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(cx + 12, 150); g.lineTo(cx + 44, 134); g.lineTo(cx + 52, 166); g.lineTo(cx + 22, 176); g.closePath(); g.fill();
      // Head: stacked stone.
      g.fillStyle = "#7d7d8a";
      g.beginPath(); g.moveTo(cx - 34, 96); g.lineTo(cx - 26, 56); g.lineTo(cx + 26, 56); g.lineTo(cx + 34, 96); g.closePath(); g.fill();
      g.fillStyle = "#8f8f9c";
      g.fillRect(cx - 22, 48, 44, 14);
      // Cracks.
      g.strokeStyle = "#2c2c34"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx - 10, 60); g.lineTo(cx - 2, 74); g.lineTo(cx - 12, 88); g.stroke();
      g.beginPath(); g.moveTo(cx + 18, 66); g.lineTo(cx + 10, 82); g.stroke();
      // Glowing orange eyes.
      g.fillStyle = "#ff9a2a";
      g.beginPath(); g.arc(cx - 13, 74, 6, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 13, 74, 6, 0, 6.29); g.fill();
      g.fillStyle = "#fff3b0";
      g.beginPath(); g.arc(cx - 13, 74, 2.5, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 13, 74, 2.5, 0, 6.29); g.fill();
      // Mouth slit.
      g.fillStyle = "#23232b"; g.fillRect(cx - 12, 88, 24, 4);
      // Moss.
      g.fillStyle = "#4c7a3a";
      g.beginPath(); g.ellipse(cx - 26, 58, 12, 5, 0, 0, 6.29); g.fill();
      g.beginPath(); g.ellipse(cx + 30, 122, 14, 6, 0, 0, 6.29); g.fill();
    } else if (def.name === "Dark Cultist") {
      // Robe.
      g.fillStyle = "#3a2350";
      g.beginPath(); g.moveTo(cx - 58, 192); g.quadraticCurveTo(cx - 52, 120, cx - 34, 96);
      g.lineTo(cx + 34, 96); g.quadraticCurveTo(cx + 52, 120, cx + 58, 192); g.closePath(); g.fill();
      // Hood.
      g.fillStyle = "#4a2d66";
      g.beginPath(); g.moveTo(cx - 46, 108); g.quadraticCurveTo(cx - 50, 44, cx, 38);
      g.quadraticCurveTo(cx + 50, 44, cx + 46, 108); g.closePath(); g.fill();
      // Shadow face.
      g.fillStyle = "#0d0716";
      g.beginPath(); g.ellipse(cx, 82, 30, 34, 0, 0, 6.29); g.fill();
      // Glowing violet eyes.
      g.fillStyle = "#c07dff";
      g.beginPath(); g.arc(cx - 12, 78, 6, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 12, 78, 6, 0, 6.29); g.fill();
      g.fillStyle = "#fff";
      g.beginPath(); g.arc(cx - 12, 78, 2, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 12, 78, 2, 0, 6.29); g.fill();
      // Candle in hand.
      g.fillStyle = "#e8dcc0"; g.fillRect(cx + 44, 138, 8, 22);
      var cg = g.createRadialGradient(cx + 48, 132, 1, cx + 48, 132, 18);
      cg.addColorStop(0, "#fff3b0"); cg.addColorStop(0.5, "#c07dff"); cg.addColorStop(1, "rgba(192,125,255,0)");
      g.fillStyle = cg; g.beginPath(); g.arc(cx + 48, 132, 18, 0, 6.29); g.fill();
      // Poison vial.
      g.fillStyle = "#8dff6e";
      g.beginPath(); g.arc(cx - 46, 156, 9, 0, 6.29); g.fill();
      g.fillStyle = "#3a6e2a"; g.fillRect(cx - 50, 142, 8, 6);
      // Robe trim.
      g.strokeStyle = "#c07dff"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx - 44, 186); g.lineTo(cx + 44, 186); g.stroke();
    } else {
      // Lich King — crowned skeleton, blue glow.
      // Aura.
      var ag = g.createRadialGradient(cx, 96, 6, cx, 96, 92);
      ag.addColorStop(0, "rgba(80,160,255,0.35)"); ag.addColorStop(1, "rgba(80,160,255,0)");
      g.fillStyle = ag; g.beginPath(); g.arc(cx, 96, 92, 0, 6.29); g.fill();
      // Robe.
      g.fillStyle = "#141428";
      g.beginPath(); g.moveTo(cx - 60, 192); g.quadraticCurveTo(cx - 56, 120, cx - 36, 100);
      g.lineTo(cx + 36, 100); g.quadraticCurveTo(cx + 56, 120, cx + 60, 192); g.closePath(); g.fill();
      g.strokeStyle = "#3a5a9a"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx - 48, 186); g.lineTo(cx + 48, 186); g.stroke();
      // Skull.
      g.fillStyle = "#e8e4d8";
      g.beginPath(); g.ellipse(cx, 76, 34, 36, 0, 0, 6.29); g.fill();
      g.fillRect(cx - 22, 96, 44, 14);
      // Eye sockets (blue fire).
      g.fillStyle = "#0a1428";
      g.beginPath(); g.arc(cx - 13, 72, 9, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 13, 72, 9, 0, 6.29); g.fill();
      g.fillStyle = "#66c2ff";
      g.beginPath(); g.arc(cx - 13, 72, 5, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 13, 72, 5, 0, 6.29); g.fill();
      g.fillStyle = "#fff";
      g.beginPath(); g.arc(cx - 13, 72, 2, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 13, 72, 2, 0, 6.29); g.fill();
      // Nose + teeth.
      g.fillStyle = "#0a1428";
      g.beginPath(); g.moveTo(cx, 82); g.lineTo(cx - 4, 92); g.lineTo(cx + 4, 92); g.closePath(); g.fill();
      g.strokeStyle = "#8a8578"; g.lineWidth = 1.5;
      for (var ti = -2; ti <= 2; ti++) {
        g.beginPath(); g.moveTo(cx + ti * 8, 100); g.lineTo(cx + ti * 8, 110); g.stroke();
      }
      // Crown.
      g.fillStyle = "#e8b64c";
      g.beginPath();
      g.moveTo(cx - 30, 52); g.lineTo(cx - 30, 30); g.lineTo(cx - 15, 42); g.lineTo(cx, 22);
      g.lineTo(cx + 15, 42); g.lineTo(cx + 30, 30); g.lineTo(cx + 30, 52); g.closePath(); g.fill();
      g.strokeStyle = "#8a6410"; g.lineWidth = 2; g.stroke();
      // Crown gems.
      g.fillStyle = "#3fae5a"; g.beginPath(); g.arc(cx - 22, 44, 3.5, 0, 6.29); g.fill();
      g.fillStyle = "#e5484d"; g.beginPath(); g.arc(cx, 36, 3.5, 0, 6.29); g.fill();
      g.fillStyle = "#3fae5a"; g.beginPath(); g.arc(cx + 22, 44, 3.5, 0, 6.29); g.fill();
      // Scepter.
      g.save(); g.translate(cx + 62, 120); g.rotate(0.35);
      g.fillStyle = "#5a4632"; g.fillRect(-3, -50, 6, 100);
      g.fillStyle = "#66c2ff";
      g.beginPath(); g.arc(0, -56, 10, 0, 6.29); g.fill();
      g.fillStyle = "#bfe6ff"; g.beginPath(); g.arc(0, -56, 4, 0, 6.29); g.fill();
      g.restore();
    }
    g.restore();
  },

  // ---------- Player avatar (54 x 54) ----------
  drawPlayer: function (cv) {
    if (!cv) return;
    var g = cv.getContext("2d");
    var w = cv.width, h = cv.height, cx = w / 2;
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#1e2a44";
    g.beginPath(); g.arc(cx, h / 2, w * 0.48, 0, 6.29); g.fill();
    g.strokeStyle = "rgba(159,216,255,0.5)"; g.lineWidth = 2;
    g.beginPath(); g.arc(cx, h / 2, w * 0.48, 0, 6.29); g.stroke();
    // Hood.
    g.fillStyle = "#3a5a8a";
    g.beginPath(); g.moveTo(cx - 16, h); g.quadraticCurveTo(cx - 18, 10, cx, 8);
    g.quadraticCurveTo(cx + 18, 10, cx + 16, h); g.closePath(); g.fill();
    // Face.
    g.fillStyle = "#f0c8a0";
    g.beginPath(); g.ellipse(cx, 26, 11, 12, 0, 0, 6.29); g.fill();
    // Eyes.
    g.fillStyle = "#1a1a2a";
    g.beginPath(); g.arc(cx - 4, 24, 1.8, 0, 6.29); g.fill();
    g.beginPath(); g.arc(cx + 4, 24, 1.8, 0, 6.29); g.fill();
    // Sword peeking out.
    g.save(); g.translate(cx + 16, 40); g.rotate(0.6);
    g.fillStyle = "#c8d2dc"; g.fillRect(-2, -14, 4, 14);
    g.fillStyle = "#8a6410"; g.fillRect(-3, 0, 6, 5);
    g.restore();
  },

  // ---------- Title art (560 x 200): dungeon gate + Lich silhouette ----------
  drawTitle: function (cv) {
    if (!cv) return;
    var g = cv.getContext("2d");
    var w = cv.width, h = cv.height;
    g.clearRect(0, 0, w, h);
    // Night sky + moon.
    var sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#0d0a1a"); sky.addColorStop(1, "#241c33");
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = "#f0e9d8";
    g.beginPath(); g.arc(w - 70, 34, 20, 0, 6.29); g.fill();
    g.fillStyle = "rgba(240,233,216,0.25)";
    g.beginPath(); g.arc(w - 70, 34, 30, 0, 6.29); g.fill();
    // Castle silhouette.
    g.fillStyle = "#120d1e";
    g.fillRect(0, 120, w, 80);
    var towers = [[30, 70, 46], [120, 40, 56], [420, 44, 56], [500, 76, 40]];
    towers.forEach(function (t) {
      g.fillRect(t[0], t[1], t[2], 200 - t[1]);
      g.fillRect(t[0] - 5, t[1] - 8, t[2] + 10, 10);
    });
    // Gate: stone arch with glowing doorway.
    var cx = w / 2;
    g.fillStyle = "#3a3048";
    g.beginPath();
    g.moveTo(cx - 95, h); g.lineTo(cx - 95, 84); g.arc(cx, 84, 95, Math.PI, 0);
    g.lineTo(cx + 95, h); g.closePath(); g.fill();
    g.strokeStyle = "#6b558f"; g.lineWidth = 4; g.stroke();
    var gg = g.createRadialGradient(cx, 150, 6, cx, 150, 90);
    gg.addColorStop(0, "rgba(255,180,70,0.85)"); gg.addColorStop(1, "rgba(255,140,40,0.05)");
    g.fillStyle = gg;
    g.beginPath();
    g.moveTo(cx - 62, h); g.lineTo(cx - 62, 108); g.arc(cx, 108, 62, Math.PI, 0);
    g.lineTo(cx + 62, h); g.closePath(); g.fill();
    // Portcullis bars.
    g.strokeStyle = "#1a1426"; g.lineWidth = 5;
    for (var i = -2; i <= 2; i++) {
      g.beginPath(); g.moveTo(cx + i * 24, 60); g.lineTo(cx + i * 24, h); g.stroke();
    }
    g.beginPath(); g.moveTo(cx - 62, 130); g.lineTo(cx + 62, 130); g.stroke();
    // Lich silhouette in the doorway.
    g.fillStyle = "#0a0714";
    g.beginPath(); g.ellipse(cx, 168, 26, 34, 0, 0, 6.29); g.fill();
    g.beginPath(); g.arc(cx, 128, 20, 0, 6.29); g.fill();
    g.fillStyle = "#66c2ff";
    g.beginPath(); g.arc(cx - 7, 126, 3, 0, 6.29); g.fill();
    g.beginPath(); g.arc(cx + 7, 126, 3, 0, 6.29); g.fill();
    // Crown glint.
    g.fillStyle = "#e8b64c";
    g.beginPath();
    g.moveTo(cx - 14, 112); g.lineTo(cx - 14, 102); g.lineTo(cx - 7, 108);
    g.lineTo(cx, 100); g.lineTo(cx + 7, 108); g.lineTo(cx + 14, 102);
    g.lineTo(cx + 14, 112); g.closePath(); g.fill();
    // Torches flanking the gate.
    this._drawTorch(g, 52, 150);
    this._drawTorch(g, w - 52, 150);
    // Bats.
    g.strokeStyle = "#0a0714"; g.lineWidth = 3;
    [[150, 40], [400, 30], [330, 56]].forEach(function (b) {
      g.beginPath();
      g.moveTo(b[0] - 12, b[1]); g.quadraticCurveTo(b[0] - 5, b[1] - 7, b[0], b[1]);
      g.quadraticCurveTo(b[0] + 5, b[1] - 7, b[0] + 12, b[1]);
      g.stroke();
    });
  },

  // ---------- Treasure art (560 x 150) for the victory screen ----------
  drawTreasure: function (cv) {
    if (!cv) return;
    var g = cv.getContext("2d");
    var w = cv.width, h = cv.height;
    g.clearRect(0, 0, w, h);
    // Vault glow.
    var vg = g.createRadialGradient(w / 2, h - 10, 8, w / 2, h - 10, w * 0.55);
    vg.addColorStop(0, "rgba(255,200,90,0.5)"); vg.addColorStop(1, "rgba(255,200,90,0)");
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    // Coin piles.
    var piles = [[w * 0.2, 96, 62], [w * 0.5, 108, 84], [w * 0.8, 96, 62]];
    var rnd = this._rand(99);
    piles.forEach(function (p) {
      for (var i = 0; i < 26; i++) {
        var x = p[0] + (rnd() - 0.5) * p[2] * 1.6;
        var y = p[1] - rnd() * p[2] * 0.55;
        g.fillStyle = rnd() > 0.5 ? "#e8b64c" : "#c98f1e";
        g.beginPath(); g.ellipse(x, y, 9, 5, 0, 0, 6.29); g.fill();
        g.fillStyle = "rgba(255,240,180,0.7)";
        g.beginPath(); g.ellipse(x - 2, y - 1, 3, 1.5, 0, 0, 6.29); g.fill();
      }
    });
    // Gems.
    var gems = [[w * 0.32, 66, "#e5484d"], [w * 0.62, 58, "#3fae5a"], [w * 0.5, 44, "#66c2ff"], [w * 0.74, 76, "#c07dff"]];
    gems.forEach(function (gm) {
      g.fillStyle = gm[2];
      g.beginPath();
      g.moveTo(gm[0], gm[1] - 12); g.lineTo(gm[0] + 10, gm[1]); g.lineTo(gm[0], gm[1] + 12); g.lineTo(gm[0] - 10, gm[1]);
      g.closePath(); g.fill();
      g.fillStyle = "rgba(255,255,255,0.65)";
      g.beginPath(); g.moveTo(gm[0], gm[1] - 12); g.lineTo(gm[0] + 5, gm[1] - 4); g.lineTo(gm[0], gm[1]); g.closePath(); g.fill();
    });
    // Crown on the middle pile.
    g.fillStyle = "#e8b64c";
    g.beginPath();
    g.moveTo(w * 0.5 - 26, 58); g.lineTo(w * 0.5 - 26, 38); g.lineTo(w * 0.5 - 13, 48);
    g.lineTo(w * 0.5, 32); g.lineTo(w * 0.5 + 13, 48); g.lineTo(w * 0.5 + 26, 38);
    g.lineTo(w * 0.5 + 26, 58); g.closePath(); g.fill();
    g.strokeStyle = "#8a6410"; g.lineWidth = 2; g.stroke();
    // Sparkles.
    g.fillStyle = "#fff3b0";
    for (var s = 0; s < 12; s++) {
      var sx = rnd() * w, sy = 12 + rnd() * 60, sr = 1.5 + rnd() * 2.5;
      g.beginPath(); g.arc(sx, sy, sr, 0, 6.29); g.fill();
    }
  },

  // ---------- Card art (120 x 64): motif by card tone ----------
  toneOf: function (card) {
    if (card.heal) return "heal";
    if (card.block) return "block";
    if (card.type === "attack") return "attack";
    return "arcane";
  },

  drawCardArt: function (cv, card) {
    if (!cv || !card) return;
    var g = cv.getContext("2d");
    var w = cv.width, h = cv.height;
    var tone = this.toneOf(card);
    var bg = { attack: ["#5a1f16", "#c65a2a"], block: ["#16283f", "#2f7fc2"], heal: ["#14301c", "#3fae5a"], arcane: ["#2a1740", "#8a5ac2"] }[tone];
    var gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // Decorative ring.
    g.strokeStyle = "rgba(255,255,255,0.25)"; g.lineWidth = 2;
    g.beginPath(); g.arc(w / 2, h / 2 + 4, 22, 0, 6.29); g.stroke();
    g.fillStyle = "rgba(255,255,255,0.92)";
    g.strokeStyle = "rgba(255,255,255,0.92)";
    var cx = w / 2, cy = h / 2 + 4;
    if (tone === "attack") {
      // Sword.
      g.save(); g.translate(cx, cy); g.rotate(-0.7);
      g.beginPath(); g.moveTo(0, -22); g.lineTo(5, -6); g.lineTo(2, 12); g.lineTo(-2, 12); g.lineTo(-5, -6); g.closePath(); g.fill();
      g.fillStyle = "#8a6410"; g.fillRect(-7, 12, 14, 4);
      g.restore();
      // Flame licks.
      g.fillStyle = "#ffb347";
      g.beginPath(); g.arc(cx - 26, cy + 12, 5, 0, 6.29); g.fill();
      g.beginPath(); g.arc(cx + 26, cy + 12, 5, 0, 6.29); g.fill();
    } else if (tone === "block") {
      // Shield.
      g.beginPath();
      g.moveTo(cx - 16, cy - 16); g.lineTo(cx + 16, cy - 16); g.lineTo(cx + 16, cy + 2);
      g.quadraticCurveTo(cx + 14, cy + 18, cx, cy + 24);
      g.quadraticCurveTo(cx - 14, cy + 18, cx - 16, cy + 2);
      g.closePath(); g.fill();
      g.strokeStyle = "#1a2a44"; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = "#2f7fc2";
      g.beginPath(); g.arc(cx, cy - 2, 6, 0, 6.29); g.fill();
    } else if (tone === "heal") {
      // Cross + leaves.
      g.fillRect(cx - 5, cy - 18, 10, 36);
      g.fillRect(cx - 18, cy - 5, 36, 10);
      g.fillStyle = "#2a6e3a";
      g.beginPath(); g.ellipse(cx - 24, cy + 16, 10, 5, -0.5, 0, 6.29); g.fill();
      g.beginPath(); g.ellipse(cx + 24, cy + 16, 10, 5, 0.5, 0, 6.29); g.fill();
    } else {
      // Arcane orb + stars.
      g.fillStyle = "#e8d5ff";
      g.beginPath(); g.arc(cx, cy, 13, 0, 6.29); g.fill();
      g.fillStyle = "#8a5ac2";
      g.beginPath(); g.arc(cx - 3, cy - 3, 6, 0, 6.29); g.fill();
      g.fillStyle = "#fff";
      [[-30, -14], [28, -16], [-26, 14], [30, 12]].forEach(function (s) {
        g.beginPath(); g.arc(cx + s[0], cy + s[1], 2.2, 0, 6.29); g.fill();
      });
    }
  },

  // ---------- Floating damage number ----------
  floatText: function (container, text, kind) {
    if (!container || !document) return;
    var span = document.createElement("span");
    span.className = "float-dmg " + (kind || "dmg");
    span.textContent = text;
    container.appendChild(span);
    setTimeout(function () { if (span.parentNode) span.parentNode.removeChild(span); }, 1000);
  }
};
