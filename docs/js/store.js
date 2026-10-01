import { uid } from './util.js';
import { SEED_DECKS, SEED_VERSION } from './seeds.js';

const DECKS_KEY = 'czolko.decks';
const SETTINGS_KEY = 'czolko.settings';
const SEEDED_KEY = 'czolko.seeded';
const SEED_VERSION_KEY = 'czolko.seedVersion';
const USED_KEY = 'czolko.used';

const LEGACY_SEED_NAMES = ['Zwierzęta', 'Filmy i seriale', 'Zawody', 'Jedzenie', 'Pokaż to!', 'Sławne osoby'];

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
  used: {},

  load() {
    this.decks = read(DECKS_KEY, []);
    this.settings = { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) };
    this.used = read(USED_KEY, {});
    const version = read(SEED_VERSION_KEY, read(SEEDED_KEY, false) ? 1 : 0);
    if (version < SEED_VERSION) {
      if (version === 1) this.decks = this.decks.filter((d) => !LEGACY_SEED_NAMES.includes(d.name));
      this.restoreSeeds();
      write(SEED_VERSION_KEY, SEED_VERSION);
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
    delete this.used[id];
    write(USED_KEY, this.used);
    this.saveDecks();
  },

  updateSettings(patch) {
    Object.assign(this.settings, patch);
    this.saveSettings();
  },

  restoreSeeds() {
    const names = SEED_DECKS.map((d) => d.name);
    this.decks = this.decks.filter((d) => !names.includes(d.name));
    SEED_DECKS.forEach((seed) => this.addDeck(seed));
  },

  usedPhrases(deck) {
    const valid = new Set(playable(deck));
    return (this.used[deck.id] || []).filter((p) => valid.has(p));
  },

  markUsed(deck, phrases) {
    if (!phrases.length) return;
    const recent = new Set(phrases);
    this.used[deck.id] = [...this.usedPhrases(deck).filter((p) => !recent.has(p)), ...phrases];
    write(USED_KEY, this.used);
  },
};
