// Dungeon Cards — tiny WebAudio synth. No audio files, no network.
// Sounds are short oscillator blips; the AudioContext is created lazily
// on the first user gesture so browsers never block it.
window.DC = window.DC || {};

DC.audio = {
  ctx: null,
  muted: false,

  ensure: function () {
    if (!this.ctx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },

  tone: function (freq, dur, type, vol, delay) {
    if (this.muted) return;
    var ctx = this.ensure();
    if (!ctx) return;
    var t0 = ctx.currentTime + (delay || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  play: function (name) {
    if (this.muted) return;
    switch (name) {
      case "card":   this.tone(660, 0.07, "triangle", 0.10); break;
      case "hit":    this.tone(170, 0.14, "sawtooth", 0.10); this.tone(90, 0.16, "square", 0.06, 0.02); break;
      case "block":  this.tone(320, 0.09, "triangle", 0.09); break;
      case "heal":   this.tone(523, 0.10, "sine", 0.10); this.tone(784, 0.14, "sine", 0.10, 0.08); break;
      case "coin":   this.tone(988, 0.08, "sine", 0.09); this.tone(1319, 0.12, "sine", 0.09, 0.07); break;
      case "draft":  this.tone(440, 0.08, "triangle", 0.10); this.tone(554, 0.08, "triangle", 0.10, 0.07); this.tone(659, 0.12, "triangle", 0.10, 0.14); break;
      case "hurt":   this.tone(140, 0.18, "sawtooth", 0.10); break;
      case "win":
        this.tone(523, 0.12, "triangle", 0.11);
        this.tone(659, 0.12, "triangle", 0.11, 0.11);
        this.tone(784, 0.12, "triangle", 0.11, 0.22);
        this.tone(1047, 0.24, "triangle", 0.11, 0.33);
        break;
      case "lose":
        this.tone(392, 0.16, "sawtooth", 0.09);
        this.tone(311, 0.16, "sawtooth", 0.09, 0.15);
        this.tone(233, 0.30, "sawtooth", 0.09, 0.30);
        break;
      default:       this.tone(440, 0.06, "sine", 0.08); break;
    }
  },

  toggleMute: function () {
    this.muted = !this.muted;
    return this.muted;
  }
};
