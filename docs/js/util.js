export const h = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function phraseCount(n) {
  const r10 = n % 10, r100 = n % 100;
  if (n === 1) return '1 hasło';
  if (r10 >= 2 && r10 <= 4 && !(r100 >= 12 && r100 <= 14)) return `${n} hasła`;
  return `${n} haseł`;
}

export function lastGrapheme(text) {
  const t = text.trim();
  if (!t) return '';
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const parts = Array.from(new Intl.Segmenter('pl', { granularity: 'grapheme' }).segment(t), (s) => s.segment);
    return parts[parts.length - 1];
  }
  return Array.from(t).pop();
}

export const isStandalone = () =>
  window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
