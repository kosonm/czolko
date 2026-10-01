# Czółko

Gra "telefon na czole" na iPhone'a. SwiftUI + SwiftData, iOS 17+, wszystko lokalnie, bez backendu.

## Jak uruchomić na telefonie

1. Zainstaluj Xcode (App Store, ok. 15 GB) i otwórz go raz, żeby doinstalował komponenty iOS.
2. Wygeneruj projekt i otwórz:
   ```
   brew install xcodegen   # jeśli brak
   xcodegen generate
   open Czolko.xcodeproj
   ```
3. W Xcode: target `Czolko` -> Signing & Capabilities -> Team: wybierz swoje Apple ID (Personal Team).
   Jeśli bundle id `pl.mkos.czolko` jest zajęty, zmień go w `project.yml` i wygeneruj ponownie.
4. Na iPhonie: Ustawienia -> Prywatność i ochrona -> Tryb programisty -> włącz (restart telefonu).
5. Podłącz telefon kablem, wybierz go jako destination, Cmd+R.
6. Pierwsze uruchomienie: iPhone -> Ustawienia -> Ogólne -> VPN i zarządzanie urządzeniami -> zaufaj swojemu Apple ID.

Darmowe konto: podpis apki wygasa po 7 dniach, wtedy podłącz telefon i Cmd+R ponownie.
Płatny Developer Program (99 USD/rok): ważność rok, bez tej zabawy.

## Sterowanie w grze

Telefon poziomo na czole, ekranem do drużyny.

- przechyl w dół (ekran do podłogi) = trafione
- przechyl w górę (ekran do sufitu) = pas
- bez żyroskopu (symulator): dotknij prawą połowę = trafione, lewą = pas

## Struktura

```
Czolko/
  CzolkoApp.swift        entry, blokada orientacji
  Models/                Deck (SwiftData), eksport JSON, ustawienia, talie startowe
  Game/                  TiltDetector (CoreMotion), FeedbackPlayer (dźwięk + haptyka), GameViewModel
  Views/                 lista talii, edycja talii, gra, podsumowanie, ustawienia
```

Talie można eksportować/importować jako JSON (`{"name","emoji","phrases":[...]}`).
