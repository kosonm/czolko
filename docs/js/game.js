import { shuffle } from './util.js';

const FEEDBACK_MS = 650;

export class Game {
  constructor({ phrases, roundSeconds, audio, onChange, buildQueue }) {
    this.all = phrases;
    this.buildQueue = buildQueue || (() => shuffle(phrases));
    this.shown = [];
    this.roundSeconds = roundSeconds;
    this.audio = audio;
    this.onChange = onChange;
    this.phase = 'ready';
    this.count = 3;
    this.current = '';
    this.timeLeft = roundSeconds;
    this.results = [];
    this.lastCorrect = null;
  }

  get score() { return this.results.filter((r) => r.correct).length; }

  start() {
    this.clearTimers();
    this.results = [];
    this.shown = [];
    this.queue = this.buildQueue();
    this.timeLeft = this.roundSeconds;
    this.count = 3;
    this.phase = 'countdown';
    this.audio.play('tick');
    this.interval = setInterval(() => this.tick(), 1000);
    this.emit();
  }

  register(correct) {
    if (this.phase !== 'playing') return;
    this.results.push({ phrase: this.current, correct });
    this.lastCorrect = correct;
    this.phase = 'feedback';
    this.audio.play(correct ? 'correct' : 'pass');
    this.emit();
    this.feedbackTimer = setTimeout(() => {
      if (this.phase === 'feedback') this.next();
    }, FEEDBACK_MS);
  }

  tick() {
    if (this.phase === 'countdown') {
      if (this.count > 1) {
        this.count -= 1;
        this.audio.play('tick');
        this.emit();
      } else {
        this.audio.play('go');
        this.next();
      }
      return;
    }
    if (this.phase === 'playing' || this.phase === 'feedback') {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) this.finish();
      else this.emit();
    }
  }

  next() {
    const phrase = this.queue.pop();
    if (!phrase) {
      this.finish();
      return;
    }
    this.current = phrase;
    this.shown.push(phrase);
    this.phase = 'playing';
    this.emit();
  }

  finish() {
    this.clearTimers();
    this.timeLeft = Math.max(0, this.timeLeft);
    this.phase = 'finished';
    this.audio.play('timeUp');
    this.emit();
  }

  destroy() { this.clearTimers(); }

  clearTimers() {
    clearInterval(this.interval);
    clearTimeout(this.feedbackTimer);
  }

  emit() { this.onChange?.(this); }
}
