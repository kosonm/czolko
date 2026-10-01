import { store, playable } from './store.js';
import { Game } from './game.js';
import { TiltDetector } from './motion.js';
import { Beeper } from './audio.js';
import { h, phraseCount, lastGrapheme, isStandalone, isIOS, shuffle } from './util.js';

const app = document.getElementById('app');
const audio = new Beeper(() => store.settings.sounds);
const ROUND_OPTIONS = [30, 60, 90, 120];

const icons = {
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.5"/><circle cx="10" cy="17" r="2.5"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 3v13M7 8l5-5 5 5M5 13v7h14v-7"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24"><path d="M4 6h3l10 12h3M4 18h3l3-3.6M14 6h6M17 3l3 3-3 3M17 15l3 3-3 3"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 4v16M5 13l7 7 7-7"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 20V4M5 11l7-7 7 7"/></svg>',
  file: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6zM14 3v4h4"/></svg>',
};

let current = null;

function navigate(hash) { location.hash = hash; }

function route() {
  current?.destroy?.();
  current = null;
  const parts = location.hash.replace(/^#\/?/, '').split('?')[0].split('/');
  app.className = '';
  if (parts[0] === 'deck' && store.getDeck(parts[1])) return renderDeck(store.getDeck(parts[1]));
  if (parts[0] === 'play' && store.getDeck(parts[1])) return renderGame(store.getDeck(parts[1]));
  if (parts[0] === 'settings') return renderSettings();
  if (parts[0]) { history.replaceState(null, '', '#/'); }
  renderList();
}

/* ---------- deck list ---------- */

function renderList() {
  const decks = [...store.decks].sort((a, b) => a.createdAt - b.createdAt);
  const installHint = isIOS() && !isStandalone();
  app.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-nav="#/settings" aria-label="Ustawienia">${icons.settings}</button>
      <h1>Czółko</h1>
      <button class="icon-btn" id="add-deck" aria-label="Nowa talia">${icons.plus}</button>
    </header>
    <main class="page">
      ${decks.length ? `<ul class="deck-list">${decks.map(deckRow).join('')}</ul>`
        : '<div class="empty"><div class="empty-emoji">🃏</div><p>Brak talii.<br>Dodaj pierwszą przyciskiem +</p></div>'}
      <button class="text-btn" id="import-btn">${icons.file}<span>Importuj talię z pliku</span></button>
      <input type="file" id="import-input" accept=".json,application/json" hidden>
      ${installHint ? `<div class="hint">Żeby mieć Czółko jako apkę: w Safari <b>Udostępnij</b> → <b>Dodaj do ekranu początkowego</b>.</div>` : ''}
    </main>`;

  app.querySelector('#add-deck').onclick = () => {
    const deck = store.addDeck();
    navigate(`#/deck/${deck.id}?new`);
  };
  app.querySelector('#import-btn').onclick = () => app.querySelector('#import-input').click();
  app.querySelector('#import-input').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.phrases)) throw new Error('brak listy haseł');
      const deck = store.addDeck({ name: String(data.name || file.name.replace(/\.json$/i, '')), emoji: String(data.emoji || '🎲'), phrases: data.phrases.map(String) });
      navigate(`#/deck/${deck.id}`);
    } catch (err) {
      toast(`Nie udało się zaimportować: ${err.message}`);
    }
  };
  app.querySelectorAll('[data-play]').forEach((btn) => {
    btn.onclick = (e) => { e.stopPropagation(); navigate(`#/play/${btn.dataset.play}`); };
  });
  app.querySelectorAll('[data-deck]').forEach((row) => {
    row.onclick = () => navigate(`#/deck/${row.dataset.deck}`);
  });
  bindNav();
}

function deckRow(deck) {
  const n = playable(deck).length;
  return `
    <li class="deck-row" data-deck="${deck.id}">
      <div class="tile">${h(deck.emoji)}</div>
      <div class="meta">
        <div class="name">${h(deck.name) || '<span class="muted">Bez nazwy</span>'}</div>
        <div class="sub">${phraseCount(n)}</div>
      </div>
      <button class="play-btn" data-play="${deck.id}" ${n < 3 ? 'disabled' : ''} aria-label="Graj">${icons.play}</button>
    </li>`;
}

/* ---------- deck editor ---------- */

function renderDeck(deck) {
  const isNew = location.hash.endsWith('?new');
  app.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-nav="#/" aria-label="Wróć">${icons.back}</button>
      <h1 id="title">${h(deck.name) || 'Nowa talia'}</h1>
      <span class="icon-btn placeholder"></span>
    </header>
    <main class="page">
      <section class="card head">
        <input class="emoji-input" id="emoji" value="${h(deck.emoji)}" aria-label="Emoji" inputmode="text">
        <input class="name-input" id="name" value="${h(deck.name)}" placeholder="Nazwa talii" autocomplete="off" enterkeyhint="done">
      </section>
      <button class="primary" id="play">${icons.play}<span>Graj</span></button>
      <p class="hint-line" id="play-hint"></p>
      <section class="card">
        <div class="section-title"><span id="count"></span><button class="link-btn" id="bulk">Dodaj wiele</button></div>
        <ul class="phrase-list" id="phrases"></ul>
      </section>
      <section class="card actions">
        <button class="row-btn" id="export">${icons.share}<span>Eksportuj (JSON)</span></button>
        <button class="row-btn" id="shuffle">${icons.shuffle}<span>Przemieszaj</span></button>
        <button class="row-btn danger" id="delete">${icons.trash}<span>Usuń talię</span></button>
      </section>
    </main>
    <div class="modal" id="bulk-modal" hidden>
      <div class="sheet">
        <div class="sheet-bar"><button class="link-btn" id="bulk-cancel">Anuluj</button><b>Dodaj wiele</b><button class="link-btn" id="bulk-add" disabled>Dodaj</button></div>
        <p class="muted small">Każde hasło w osobnej linii.</p>
        <textarea id="bulk-text" rows="8" placeholder="Pierogi&#10;Pizza&#10;Sushi"></textarea>
      </div>
    </div>`;

  const $ = (sel) => app.querySelector(sel);
  const save = (patch) => store.updateDeck(deck.id, patch);

  function refreshMeta() {
    const n = playable(deck).length;
    $('#count').textContent = phraseCount(n);
    $('#play').disabled = n < 3;
    $('#play-hint').textContent = n < 3 ? 'Dodaj co najmniej 3 hasła, żeby zagrać.' : '';
    $('#title').textContent = deck.name.trim() || 'Nowa talia';
  }

  function renderPhrases(focusIndex) {
    $('#phrases').innerHTML = deck.phrases.map((p, i) => `
      <li>
        <input data-idx="${i}" value="${h(p)}" placeholder="Hasło" autocomplete="off" enterkeyhint="next">
        <button class="icon-btn small" data-del="${i}" aria-label="Usuń">${icons.close}</button>
      </li>`).join('') + `
      <li class="add-row">
        <span class="plus">${icons.plus}</span>
        <input id="new-phrase" placeholder="Nowe hasło" autocomplete="off" enterkeyhint="next">
      </li>`;

    $('#phrases').querySelectorAll('input[data-idx]').forEach((input) => {
      input.oninput = () => { deck.phrases[+input.dataset.idx] = input.value; save(); refreshMeta(); };
      input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#new-phrase').focus(); } };
    });
    $('#phrases').querySelectorAll('[data-del]').forEach((btn) => {
      btn.onclick = () => { deck.phrases.splice(+btn.dataset.del, 1); save(); refreshMeta(); renderPhrases(); };
    });
    const newInput = $('#new-phrase');
    newInput.onkeydown = (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const value = newInput.value.trim();
      if (!value) return;
      newInput.value = '';
      deck.phrases.push(value);
      save(); refreshMeta(); renderPhrases(true);
    };
    newInput.onblur = () => {
      const value = newInput.value.trim();
      if (!value) return;
      deck.phrases.push(value);
      newInput.value = '';
      save(); refreshMeta(); renderPhrases();
    };
    if (focusIndex) newInput.focus();
  }

  $('#emoji').oninput = (e) => {
    const g = lastGrapheme(e.target.value);
    if (g) { e.target.value = g; save({ emoji: g }); }
  };
  $('#emoji').onblur = (e) => { if (!e.target.value.trim()) { e.target.value = '🎲'; save({ emoji: '🎲' }); } };
  $('#name').oninput = (e) => { save({ name: e.target.value }); refreshMeta(); };
  $('#name').onkeydown = (e) => { if (e.key === 'Enter') e.target.blur(); };
  $('#play').onclick = () => navigate(`#/play/${deck.id}`);
  $('#shuffle').onclick = () => { deck.phrases.sort(() => Math.random() - 0.5); save(); renderPhrases(); };
  $('#export').onclick = () => exportDeck(deck);

  let armedDelete = false;
  $('#delete').onclick = () => {
    if (!armedDelete) {
      armedDelete = true;
      $('#delete span').textContent = 'Na pewno? Dotknij jeszcze raz';
      setTimeout(() => { armedDelete = false; const s = $('#delete span'); if (s) s.textContent = 'Usuń talię'; }, 3000);
      return;
    }
    store.deleteDeck(deck.id);
    navigate('#/');
  };

  const modal = $('#bulk-modal');
  const bulkText = $('#bulk-text');
  const bulkLines = () => {
    const seen = new Set(deck.phrases.map((p) => p.trim().toLowerCase()));
    return bulkText.value.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !seen.has(l.toLowerCase()) && seen.add(l.toLowerCase()));
  };
  $('#bulk').onclick = () => { modal.hidden = false; bulkText.value = ''; $('#bulk-add').disabled = true; bulkText.focus(); };
  $('#bulk-cancel').onclick = () => { modal.hidden = true; };
  bulkText.oninput = () => {
    const n = bulkLines().length;
    $('#bulk-add').disabled = n === 0;
    $('#bulk-add').textContent = n ? `Dodaj (${n})` : 'Dodaj';
  };
  $('#bulk-add').onclick = () => {
    deck.phrases.push(...bulkLines());
    save(); refreshMeta(); renderPhrases();
    modal.hidden = true;
  };

  refreshMeta();
  renderPhrases();
  if (isNew) { history.replaceState(null, '', `#/deck/${deck.id}`); $('#name').focus(); }
  bindNav();

  current = {
    destroy() {
      const cleaned = playable(deck);
      const name = deck.name.trim();
      if (!name && cleaned.length === 0) store.deleteDeck(deck.id);
      else store.updateDeck(deck.id, { name, phrases: cleaned });
    },
  };
}

async function exportDeck(deck) {
  const data = JSON.stringify({ name: deck.name, emoji: deck.emoji, phrases: playable(deck) }, null, 2);
  const fileName = `${deck.name.trim() || 'talia'}.json`;
  const file = new File([data], fileName, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: deck.name }); return; } catch (err) { if (err.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- game ---------- */

function renderGame(deck) {
  let phrases = playable(deck);
  if (phrases.length < 3) return navigate(`#/deck/${deck.id}`);
  app.className = 'in-game';

  app.innerHTML = `
    <div class="stage" id="stage" data-phase="ready">
      <div class="hud">
        <button class="hud-btn" id="exit" aria-label="Zakończ">${icons.close}</button>
        <div class="timer" id="timer"></div>
      </div>
      <div class="center" id="center"></div>
    </div>`;

  const stage = app.querySelector('#stage');
  const center = app.querySelector('#center');
  const timer = app.querySelector('#timer');
  const exitTo = `#/deck/${deck.id}`;

  const buildQueue = () => {
    const used = store.usedPhrases(deck);
    const usedSet = new Set(used);
    const fresh = phrases.filter((p) => !usedSet.has(p));
    return [...used.reverse(), ...shuffle(fresh)];
  };
  const commitShown = () => {
    store.markUsed(deck, game.shown);
    game.shown = [];
  };
  const game = new Game({ phrases, roundSeconds: store.settings.roundSeconds, audio, buildQueue, onChange: paint });
  const tilt = new TiltDetector((correct) => game.register(correct));
  let tiltActive = false;
  let wakeLock = null;

  function applyOrientation() {
    stage.classList.toggle('rotated', window.innerHeight > window.innerWidth);
    if (game.phase === 'playing') fitPhrase();
  }
  applyOrientation();
  window.addEventListener('resize', applyOrientation);

  function paint() {
    if (game.phase === 'finished') commitShown();
    stage.dataset.phase = game.phase;
    stage.dataset.result = game.phase === 'feedback' ? (game.lastCorrect ? 'ok' : 'pass') : '';
    timer.textContent = game.phase === 'ready' || game.phase === 'countdown' || game.phase === 'finished' ? '' : game.timeLeft;
    switch (game.phase) {
      case 'ready':
        center.innerHTML = `
          <div class="ready">
            <div class="ready-emoji">${h(deck.emoji)}</div>
            <h2>${h(deck.name) || 'Talia'}</h2>
            <p class="muted-light">${phraseCount(phrases.length)} · ${store.settings.roundSeconds} s</p>
            <button class="start-btn" id="start">Start</button>
            <div class="legend">
              <span>${icons.down} w dół = trafione</span>
              <span>${icons.up} w górę = pas</span>
            </div>
            <p class="tiny" id="tilt-note">Po starcie przyłóż telefon do czoła ekranem do drużyny.</p>
          </div>`;
        center.querySelector('#start').onclick = startRound;
        break;
      case 'countdown':
        center.innerHTML = `<div class="countdown"><p>Przyłóż telefon do czoła</p><div class="big-number" id="num">${game.count}</div>${tiltActive ? '' : '<p class="tiny">Dotknij prawą stronę = trafione, lewą = pas</p>'}</div>`;
        break;
      case 'playing':
        center.innerHTML = `
          <div class="play-area">
            <div class="tap-zone" data-tap="0"></div>
            <div class="tap-zone" data-tap="1"></div>
            <div class="phrase" id="phrase">${h(game.current)}</div>
          </div>`;
        center.querySelectorAll('[data-tap]').forEach((z) => { z.onclick = () => game.register(z.dataset.tap === '1'); });
        fitPhrase();
        break;
      case 'feedback':
        center.innerHTML = `<div class="feedback">${game.lastCorrect ? icons.check : icons.up}<div>${game.lastCorrect ? 'Trafione!' : 'Pas'}</div></div>`;
        break;
      case 'finished':
        center.innerHTML = summary();
        center.querySelector('#again').onclick = startRound;
        center.querySelector('#finish').onclick = () => navigate(exitTo);
        center.querySelectorAll('[data-remove]').forEach((btn) => {
          btn.onclick = () => toggleRemoved(btn.closest('li'), game.results[+btn.dataset.remove].phrase);
        });
        break;
    }
  }

  function summary() {
    const score = game.score;
    return `
      <div class="summary">
        <div class="score-col">
          <div class="ready-emoji">${h(deck.emoji)}</div>
          <div class="score">${score}</div>
          <div class="muted-light">${score === 1 ? 'trafione hasło' : 'trafionych haseł'}</div>
          <div class="summary-actions">
            <button class="start-btn" id="again">Jeszcze raz</button>
            <button class="ghost-btn" id="finish">Zakończ</button>
          </div>
        </div>
        <div class="results-col">
          <p class="tiny results-hint">Słabe hasło? Kosz usuwa je z talii.</p>
          <ul class="results">
            ${game.results.map((r, i) => `
              <li class="${r.correct ? 'ok' : 'pass'}">
                ${r.correct ? icons.check : icons.close}
                <span>${h(r.phrase)}</span>
                <button class="remove-btn" data-remove="${i}" aria-label="Usuń z talii">${icons.trash}</button>
                <button class="undo-btn" data-remove="${i}">Cofnij</button>
              </li>`).join('')}
          </ul>
        </div>
      </div>`;
  }

  function toggleRemoved(li, phrase) {
    const removed = li.classList.toggle('removed');
    const key = phrase.trim().toLowerCase();
    const rest = deck.phrases.filter((p) => p.trim().toLowerCase() !== key);
    store.updateDeck(deck.id, { phrases: removed ? rest : [...rest, phrase] });
    phrases = playable(deck);
    game.all = phrases;
    center.querySelector('#again').disabled = phrases.length < 3;
  }

  function fitPhrase() {
    const el = center.querySelector('#phrase');
    if (!el) return;
    const box = center.getBoundingClientRect();
    const w = stage.classList.contains('rotated') ? box.height : box.width;
    const hgt = stage.classList.contains('rotated') ? box.width : box.height;
    let size = Math.min(w * 0.16, hgt * 0.4);
    el.style.fontSize = `${size}px`;
    for (let i = 0; i < 12 && (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight); i++) {
      size *= 0.85;
      el.style.fontSize = `${size}px`;
    }
  }

  async function startRound() {
    audio.unlock();
    if (!tiltActive) tiltActive = await tilt.start();
    try { wakeLock = wakeLock || await navigator.wakeLock?.request('screen'); } catch { /* not available */ }
    game.start();
  }

  const onKey = (e) => {
    if (e.key === 'ArrowDown') game.register(true);
    if (e.key === 'ArrowUp') game.register(false);
    if (e.key === 'Escape') navigate(exitTo);
  };
  window.addEventListener('keydown', onKey);
  app.querySelector('#exit').onclick = () => navigate(exitTo);

  paint();

  current = {
    destroy() {
      commitShown();
      game.destroy();
      tilt.stop();
      wakeLock?.release?.();
      window.removeEventListener('resize', applyOrientation);
      window.removeEventListener('keydown', onKey);
    },
  };
}

/* ---------- settings ---------- */

function renderSettings() {
  const s = store.settings;
  app.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-nav="#/" aria-label="Wróć">${icons.back}</button>
      <h1>Ustawienia</h1>
      <span class="icon-btn placeholder"></span>
    </header>
    <main class="page">
      <section class="card">
        <div class="section-title"><span>Czas rundy</span></div>
        <div class="segmented" id="round">
          ${ROUND_OPTIONS.map((v) => `<button data-v="${v}" class="${v === s.roundSeconds ? 'on' : ''}">${v} s</button>`).join('')}
        </div>
      </section>
      <section class="card">
        <label class="toggle-row"><span>Dźwięki</span><input type="checkbox" id="sounds" ${s.sounds ? 'checked' : ''}><span class="switch"></span></label>
      </section>
      <section class="card actions">
        <button class="row-btn" id="restore">${icons.plus}<span>Przywróć wbudowane talie</span></button>
      </section>
      <p class="muted small center-text">Dane są tylko na tym telefonie. Wersja 1.0</p>
    </main>`;
  app.querySelectorAll('#round button').forEach((b) => {
    b.onclick = () => {
      store.updateSettings({ roundSeconds: +b.dataset.v });
      app.querySelectorAll('#round button').forEach((x) => x.classList.toggle('on', x === b));
    };
  });
  app.querySelector('#sounds').onchange = (e) => store.updateSettings({ sounds: e.target.checked });
  app.querySelector('#restore').onclick = (e) => {
    store.restoreSeeds();
    e.currentTarget.querySelector('span').textContent = 'Przywrócono';
    e.currentTarget.disabled = true;
  };
  bindNav();
}

/* ---------- misc ---------- */

function bindNav() {
  app.querySelectorAll('[data-nav]').forEach((el) => { el.onclick = () => navigate(el.dataset.nav); });
}

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

store.load();
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
