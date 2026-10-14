# Projekt: 3D-Raumplaner (Fork von ch-bas/threejs-sims-house-builder)

Basis ist ein bestehender Haus-Builder (Next.js 15, React 18, Three.js, Tailwind, TypeScript). Ziel: Moodboard- und Tageslicht-Funktionen ergänzen. Anforderungen in SPEC.md.

## Erste Aufgabe

Bestehende Struktur erkunden (README, package.json, Szene, Licht, Materialien, UI-Panels) und den Abschnitt "Struktur" hier mit den wichtigsten Pfaden füllen. Knapp halten.

## Struktur

Vollständiger Dateibaum mit Beschreibungen: README.md, Abschnitt Architektur.
Alles liegt unter `components/room-organizer/` (im Folgenden `ro/`).

- `app/page.tsx`: Einstieg, rendert `ro/room-organizer.tsx` (Root-Komponente, hält `ViewSettings`-State, `INITIAL_VIEW_SETTINGS`)
- `ro/lib/types.ts`: Kerntypen (`RoomLayout`, `FloorLayout` mit `floorPattern`/`wallPattern`/Farben, `FurnitureItem.color`, `ViewSettings.timeOfDay`, `Weather`, `ThemeKey`)
- `ro/hooks/`: State und Szene. `layout-reducer.ts` + `use-layout-store.ts` (Zustand), `use-three-scene.ts` (Renderer/RAF), `use-scene-effects.ts` (Szene neu aufbauen bei Änderungen)
- `ro/contexts/room-editor-context.tsx`: `useRoomEditor()` → `view`, `setView`, `autoCycleLighting`
- `ro/three/`: reines Three.js, ohne React
  - `lighting.ts`: Sonnenbogen nach Uhrzeit, `TIME_PRESETS`, `applyTimeOfDay`, Himmel, Lampen-Pool
  - `floor-patterns.ts`, `wall-patterns.ts`: prozedurale Boden-/Wandmaterialien (`buildFloorMaterial`, `buildWallMaterial`)
  - `room-builder.ts`: Boden und Wände; `builders/`: Möbel je Kategorie (Polster in `builders-seating.ts`)
  - `drag-handlers.ts`: Klicken, Hover, Wand-Auswahl im Canvas
- `ro/lib/`: reine Logik. `night-lights.ts` (welche Items nachts leuchten), `sun-shadow.ts`, `themes.ts` (`THEMES`, `applyTheme`, bereits Material-Presets), `persistence.ts` + `safe-storage.ts` (localStorage), `library.ts` (benannte Layouts)
- `ro/panels/`: UI.
  - Glass-Panels nutzen die CSS-Klasse `pc-glass` (`app/globals.css`, Tokens in `ro/plotcraft/tokens.css`), z. B. `build-tools-panel.tsx`
  - Sidebar: `sidebar-drawer.tsx` (bindet `ThemesPanel` und `TimeOfDayPanel` ein)
  - Schon vorhanden: `time-of-day-panel.tsx` (Slider 0–24, Presets, Wetter) und `wall-paint-panel.tsx` (in `bottom-hud.tsx`)
- `components/ui/`: shadcn-Bausteine (Button, Card, Input, Label, Select)

Hinweis: Tageszeit, nächtliche Lampen und Themes gibt es schon. Etappe 1 und 3 bauen darauf auf und fangen nicht neu an.

## Befehle

- `npm run dev`: Dev-Server (http://localhost:3000)
- `npm run build`: Produktions-Build
- `npm run lint`: ESLint (app, components, lib)
- `npm run typecheck`: `tsc --noEmit`
- `npm run test`: Vitest

## Regeln

- Bestehende Architektur und Patterns übernehmen, nicht umbauen.
- Neue Funktionen als eigene Module/Komponenten, bestehenden Code nur minimal ändern.
- SPEC.md Etappe für Etappe abarbeiten, danach Checkbox abhaken.
- Vor dem Abschluss: Build und Typecheck müssen fehlerfrei laufen.
- Keine neuen Abhängigkeiten ohne Rückfrage.
- Kurz antworten, keine langen Zusammenfassungen.
