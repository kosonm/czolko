import { uid } from './util.js';
import { SEED_DECKS } from './seeds.js';

const DECKS_KEY = 'czolko.decks';
const SETTINGS_KEY = 'czolko.settings';
const SEEDED_KEY = 'czolko.seeded';

const DEFAULT_SETTINGS = { roundSeconds: 60, sounds: true };

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

export const playable = (deck) => deck.phrases.map((p) => p.trim()).filter(Boolean);

export const store = {
  decks: [],
  settings: { ...DEFAULT_SETTINGS },

  load() {
    this.decks = read(DECKS_KEY, []);
    this.settings = { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) };
    if (!read(SEEDED_KEY, false)) {
      this.restoreSeeds();
      write(SEEDED_KEY, true);
    }
  },

  saveDecks() { write(DECKS_KEY, this.decks); },
  saveSettings() { write(SETTINGS_KEY, this.settings); },

  getDeck(id) { return this.decks.find((d) => d.id === id); },

  addDeck({ name = '', emoji = '🎲', phrases = [] } = {}) {
    const deck = { id: uid(), name, emoji, phrases: [...phrases], createdAt: Date.now() };
    this.decks.push(deck);
    this.saveDecks();
    return deck;
  },

  updateDeck(id, patch) {
    const deck = this.getDeck(id);
    if (!deck) return;
    Object.assign(deck, patch);
    this.saveDecks();
  },

  deleteDeck(id) {
    this.decks = this.decks.filter((d) => d.id !== id);
    this.saveDecks();
  },

  updateSettings(patch) {
    Object.assign(this.settings, patch);
    this.saveSettings();
  },

  restoreSeeds() {
    SEED_DECKS.forEach((seed) => this.addDeck(seed));
  },
};
