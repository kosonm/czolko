export class Beeper {
  constructor(isEnabled) {
    this.isEnabled = isEnabled;
    this.ctx = null;
  }

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this.ctx = new Ctx();
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  play(name) {
    if (!this.isEnabled() || !this.ctx) return;
    switch (name) {
      case 'tick': this.tone(880, 0.08); break;
      case 'go': this.tone(1320, 0.18); break;
      case 'correct': this.tone(660, 0.1); this.tone(990, 0.16, 0.1); break;
      case 'pass': this.tone(240, 0.22, 0, 'triangle'); break;
      case 'timeUp': [0, 0.18, 0.36].forEach((at) => this.tone(440, 0.14, at, 'square')); break;
    }
  }

  tone(freq, duration, at = 0, type = 'sine') {
    const t0 = this.ctx.currentTime + at;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }
}
