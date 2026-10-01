# Czółko

Gra "telefon na czole": jedna osoba trzyma telefon na czole, reszta opisuje hasło, przechylenie w dół = trafione, w górę = pas.

Dwie wersje w repo:

- **`docs/`** – PWA (HTML/JS, bez builda, bez backendu). To jest wersja używana. Działa offline po dodaniu do ekranu początkowego, dane trzymane tylko w telefonie (localStorage).
- **`ios/`** – natywna wersja SwiftUI, odłożona na przyszłość (wymaga Xcode i Apple ID na Macu). Nigdy nie skompilowana, patrz `ios/README.md`.

## PWA: jak wrzucić na telefon

1. Wypchnij repo na GitHub (publiczne).
2. W repo: Settings → Pages → Source: *Deploy from a branch*, Branch: `main`, Folder: `/docs`, Save.
3. Po minucie apka jest pod `https://<user>.github.io/czolko/`.
4. Na iPhonie otwórz ten adres w Safari → Udostępnij → **Dodaj do ekranu początkowego**.
5. Przy pierwszym Starcie gry Safari zapyta o dostęp do ruchu i orientacji, zezwól.

Aktualizacja = push na `main`. Przy zmianach plików podbij `CACHE` w `docs/sw.js`, inaczej zainstalowana apka może trzymać starą wersję.

Dowolny inny hosting statyczny z HTTPS też działa (Netlify, Cloudflare Pages): publikujesz katalog `docs/`.

## Lokalnie

```
cd docs && python3 -m http.server 8765
```

`http://127.0.0.1:8765` – na localhost service worker jest wyłączony, żeby nie cache'ować w trakcie zmian. Bez żyroskopu: strzałki ↓/↑ na klawiaturze albo tap w prawą/lewą połowę ekranu.

## Struktura `docs/`

```
index.html            szkielet, meta PWA
manifest.webmanifest  nazwa, ikony, standalone
sw.js                 cache app shell (offline)
css/app.css           style, dark mode, ekran gry + tryb obrócony
js/app.js             router (#/, #/deck/:id, #/play/:id, #/settings) i widoki
js/store.js           localStorage: talie, ustawienia, seed przy pierwszym uruchomieniu
js/seeds.js           talie startowe
js/game.js            maszyna stanów rundy
js/motion.js          deviceorientation → trafione/pas
js/audio.js           dźwięki z Web Audio (bez plików)
js/util.js            helpery
```

Eksport/import talii: JSON `{"name","emoji","phrases":[...]}`.
