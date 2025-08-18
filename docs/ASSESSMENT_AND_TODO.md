# Projektanalyse, Lokales Setup, To-Dos und Risiko-/Aufwand-Review

Dieses Dokument fasst den aktuellen Stand der Anwendung zusammen, bewertet die lokale Nutzbarkeit, prüft den Integrationsstatus von Tailwind/shadcn, gleicht die Phasen aus `FUTURE_IMPROVEMENTS.md` mit dem Ist-Zustand ab, und listet konkrete To-Dos sowie ein Risiko-/Aufwand-Review auf. Ziel ist, Entwicklungskontext zu sichern und die nächsten Schritte klar zu priorisieren.

## Kurzüberblick: Funktionsweise der App
- Architektur: React + TypeScript, Vite, TailwindCSS, Web Audio API; zentrale Logik in Custom Hooks.
- Audio & Visualisierung: Laden und Dekodieren lokaler Audiodateien, Ermittlung von Amplitude/Spectral Centroid/Spectral Flux (Canvas-Timeline).
- KI (zweistufig):
  - Basisanalyse via Google Gemini: Wellenformzusammenfassung + optional reichhaltiger Songkontext → Vorschlagsliste (Zeitstempel, Valenz, Arousal, Intensität, GEMS, Trigger, Begründung, Sync-Notes, Imagery).
  - Personalisierung via TensorFlow.js: Pro-Profil kleines Modell, das Gemini-Vorschläge anpasst (Valenz/Arousal).
- Genius-Integration: Suche, Songdetails, Lyrics-Scraping, Referents (line-by-line Annotationen) über `corsproxy.io`. Zugangstoken wird in der App hinterlegt und im Browser gespeichert.
- Persistenz: `localStorage` für AppState, Profile, Trainingsdaten und TFJS-Modelle.

## Lokales Setup: Bewertung und Befunde
- Entwicklungsserver: `npm install` + `npm run dev` (Vite) vorhanden. App ist grundsätzlich startbar.
- Gemini-API-Key: In `src/services/geminiService.ts` wird `process.env.API_KEY` erwartet, was im Browser/Vite nicht direkt verfügbar ist. Blocker für funktionierende Gemini-Analysen (lokal).
- Genius-API-Key: Wird in der UI hinterlegt (ok). Netzwerkzugriff über öffentlichen CORS-Proxy erforderlich.
- Tailwind-Integration: Hybrid-Zustand.
  - CDN in `index.html` aktiv; gleichzeitig existieren `tailwind.config.js`, `postcss.config.js` und `src/index.css` (mit `@tailwind`-Direktiven), aber die CSS-Datei wird nicht in `src/index.tsx` importiert.
  - Import-Map in `index.html` referenziert ESM-CDNs (inkl. Tailwind 4.x), während `package.json` Tailwind 3.x nutzt → Versionen sind inkonsistent.
- Import-Maps/ESM-CDN: In `index.html` konfiguriert (historisch für Google AI Studio); redundant und inkonsistent im Vite-Kontext.
- Doppelte Dateien: Neben `src/*` existieren ähnliche Dateien in der Wurzel (z. B. `App.tsx`, `types.ts`, `hooks/*`, `services/*`). `src/*` scheint maßgeblich, die Duplikate erhöhen Verwechslungsrisiko.
- Netzabhängigkeiten: Genius und Gemini sind netzwerkabhängig; CORS-Proxy ist externer SPOF.

## Tailwind/shadcn: Integrationsstatus
- Tailwind:
  - Konfig (3.x) und PostCSS vorhanden; CDN aktiv; `src/index.css` nicht importiert; keine globale Typografie/Fonts konfiguriert.
  - Eigene Farbpalette in `tailwind.config.js` angelegt.
- shadcn/ui:
  - Nicht initialisiert (kein `components.json`, keine `components/ui/*`, kein `lib/utils.ts`, keine CLI-Artefakte).
  - Icons: Eigene `components/icons.tsx` vorhanden; keine `lucide-react`-Integration.

## Abgleich mit FUTURE_IMPROVEMENTS.md (Phasen)
- Phase 0 (als abgeschlossen markiert): Teilweise erfüllt.
  - Vite/TS/React eingerichtet: Ja.
  - Tailwind eingerichtet: Pakete/Config vorhanden, aber CDN/Import-Maps in `index.html` nicht entfernt; `src/index.css` nicht eingebunden → keine saubere Vite-only-Integration.
  - Projektstruktur: `src/` vorhanden; Root-Duplikate nicht bereinigt.
- Phase 1 (Globale Stile & Kernkomponenten): Nicht begonnen.
  - Keine shadcn-Initialisierung, keine Kernkomponenten hinzugefügt; keine globale Typografie/Fonts in `index.css`.
- Phase 2 (Layout & Komponentenaustausch): Nicht begonnen.
  - Buttons/Slider/Dialog/Tooltip nicht gegen shadcn/ui getauscht; eigenes `Modal.tsx` noch aktiv.
- Phase 3 (Refactoring komplexer Komponenten): Nicht begonnen.
  - Timeline-Umfeld/MarkerList/LabelPanel unverändert.
- Phase 4 (Feinschliff & Bereinigung): Nicht begonnen.
  - `icons.tsx` weiterhin vorhanden; CDN/Import-Maps nicht entfernt.

## Empfohlene Vorgehenslinie (High-Level)
- Lokale Nutzbarkeit herstellen: Saubere Tailwind-Integration (Vite-only), Gemini-API-Key handhabbar machen (Vite Env oder Proxy), AI-Studio-Altlasten entfernen, Duplikate bereinigen.
- UI-Migration schrittweise: shadcn initialisieren, Kernkomponenten einführen, Dialog/Buttons/Slider ersetzen, dann Formular-/Listen-Refactoring.
- Stabilität verbessern: CORS-Proxy-Strategie evaluieren (eigener Lightweight-Proxy), optional Backend-Proxy für Gemini.

## To-Do Liste (Agent)
- Lokale Laufbarkeit (Minimal):
  - Gemini-Key-Strategie entscheiden (Vite Env vs. Backend-Proxy). [Entscheidung]
  - Tailwind-Integration vereinheitlichen: `src/index.css` importieren, CDN/Import-Maps aus `index.html` entfernen, ggf. Typography-Plugin in `tailwind.config.js` aktivieren. [Implementierung]
  - Import-Map/ESM-CDN-Verweise (React, Vite, Tailwind) aus `index.html` entfernen. [Implementierung]
  - Root-Duplikate identifizieren und ausmisten bzw. auf `src/` konsolidieren. [Bereinigung]
- shadcn/ui-Migration (Phase 1–2):
  - shadcn CLI initialisieren (`components.json`, `lib/utils.ts`, `components/ui`). [Implementierung]
  - Kernkomponenten hinzufügen (Button, Input, Select, Slider, Dialog, Tooltip). [Implementierung]
  - `Modal.tsx` durch `<Dialog>` ersetzen; Form Controls sukzessive tauschen. [Refactoring]
  - Icons auf `lucide-react` umstellen; `components/icons.tsx` entfernen. [Refactoring]
- Komplexe Komponenten (Phase 3):
  - Timeline-Container/Overlays mit Tailwind-Utilities harmonisieren. [Refactoring]
  - MarkerList: States (hover/selected) konsistent mit Tailwind-Varianten. [Refactoring]
  - LabelPanel: UI auf shadcn/Forms (Input/Select/Slider) konsolidieren. [Refactoring]
- Stabilität/Netzwerk:
  - CORS-Proxy-Optionen evaluieren (eigener Proxy vs. `corsproxy.io`). [Evaluierung]
  - Gemini-Proxy (falls gewählt) entwerfen (Rate-Limiting, Key-Schutz). [Design]
- Qualität & DX:
  - Kleine QA-Checkliste: visuelle Konsistenz, Responsiveness, A11y-Checks. [QA]
  - Readme-Update nach Migration (Setup-Anleitung, Keys, Known Issues). [Doku]

## Detaillierter Umsetzungsplan (Stand jetzt)

1) Grundlegende Konsolidierung (erledigt/teilweise)
- Tailwind via Vite + Entfernen CDN/Import-Maps (erledigt)
- Typography/Animate-Plugins aktiv (erledigt)
- `.env`-basierter Gemini-Key (erledigt), UI-Fallback ohne Key (erledigt)
- Deduplizierung Root vs. `src/` (erledigt)

2) shadcn/ui Einführung (laufend)
- `components.json`, Aliases, `cn`-Helper (erledigt)
- CLI-Komponenten: Dialog, Button, Slider (erledigt); Input/Select/Tooltip (bereit); Checkbox/Select (ausstehend)
- Modal → Dialog (erledigt)
- Buttons (Header/Footer/MarkerList) (erledigt)
- Slider (Header/LabelPanel) (erledigt)
- Icons → lucide-react (erledigt)
- Nächste: Select/Checkbox (LabelPanel), Button-Variants/Theme

3) Responsive Design-Überarbeitung (laufend - mitten drin)
- Responsive Layout-Verbesserungen begonnen, aber noch nicht abgeschlossen
- Besonders auf kleineren Geräten funktioniert das responsive Design noch nicht optimal
- Weitere Anpassungen für mobile und Tablet-Ansichten erforderlich

3) Stabilität/Netzwerk (geplant)
- CORS-Proxy-Strategie (Genius) evaluieren; evtl. Mini-Proxy
- Gemini-Proxy evaluieren (Key-Schutz, Quotas)

4) Doku & DX (laufend)
- README erweitert (WSL, HMR, Env, shadcn)
- SPEC aktualisiert (Styling-System, Migrationsstatus)
- FUTURE: Fortschritts-Tracker ergänzt

## WSL-Runbook (Kurz)
- Start: `npm install` → `npm run dev -- --host 0.0.0.0` → Network-URL im Windows-Browser öffnen
- Env: `.env` mit `VITE_GOOGLE_API_KEY=...`; nach Änderung Dev-Server neu starten
- Genius-Token: in der App (Zahnrad) setzen
- Neustarts nötig bei: `.env`/Tailwind-/Vite-Config-Änderungen oder nach `npm install`

## Risiko-/Aufwand-Review
- Gemini-Key Handhabung:
  - Clientseitig via Vite Env:
    - Aufwand: Niedrig (Umstellung auf `import.meta.env.VITE_*`, Settings-UI optional).
    - Risiko: Mittel-Hoch (Key liegt im Client; Leakage möglich; Rate-Limits clientseitig nicht kontrollierbar).
  - Serverseitiger Proxy:
    - Aufwand: Mittel (kleiner Node/Edge-Endpunkt; Auth/Rate-Limit; Deployment nötig).
    - Risiko: Niedrig-Mittel (Key geschützt; Betriebsaufwand; zusätzliche Latenz).
  - Empfehlung: Für ernsthafte Nutzung Proxy; für schnelle lokale Evaluierung kurzzeitig Vite Env.
- Tailwind-Integration bereinigen (CDN → Vite-only):
  - Aufwand: Niedrig (CSS import + HTML-Bereinigung + ggf. Plugin-Konfig).
  - Risiko: Niedrig (überschaubare Änderungen; besserer Build-Pfad).
- Import-Maps/ESM-CDN entfernen:
  - Aufwand: Niedrig (HTML-Aufräumen).
  - Risiko: Niedrig (Vite übernimmt Bundling).
- shadcn/ui Einführung:
  - Aufwand: Mittel (CLI-Setup, Kernkomponenten, sukzessiver Austausch, Styles anpassen).
  - Risiko: Niedrig-Mittel (UI-Regressionen, A11y/Focus-States beachten; aber Komponenten sind robust).
- Icons auf `lucide-react`:
  - Aufwand: Niedrig (Austausch import + Props anpassen).
  - Risiko: Niedrig (visuelle Änderungen überschaubar).
- CORS-Proxy für Genius:
  - Aufwand: Mittel (eigener Proxy aufsetzen) oder Null (weiter `corsproxy.io`).
  - Risiko: Mittel (öffentlicher Proxy: Verfügbarkeit/Rate-Limits); Niedrig-Mittel (eigener Proxy: Betrieb).
- Duplikate außerhalb `src/` aufräumen:
  - Aufwand: Niedrig-Mittel (Vergleich/Entfernung, ggf. Git-Historie prüfen).
  - Risiko: Niedrig (keine Laufzeitabhängigkeit, aber Klarheit im Repo steigt).

## Priorisierte nächste Schritte (Vorschlag)
1. **Responsive Design vervollständigen** (hohe Priorität - bereits begonnen)
   - Mobile und Tablet-Layouts optimieren
   - Touch-Interaktionen für kleinere Geräte verbessern
   - Breakpoint-spezifische Anpassungen finalisieren
2. Select/Checkbox-Komponenten hinzufügen und LabelPanel vollständig migrieren
3. Button-Variants und Theme vereinheitlichen
4. A11y-Review nach Abschluss des responsiven Designs
5. CORS-Proxy-Strategie für Genius evaluieren (Stabilität/Rate-Limits)

## Offene Entscheidungen
- Gemini-Anbindung: Sofort clientseitig (schnell) vs. Proxy (sicher/skalierbar)?
- Eigener CORS-Proxy für Genius ja/nein? (Abhängig von Nutzungshäufigkeit/Stabilität)
- Fonts/Typografie: Systemfont vs. Inter o. ä.; Tailwind Typography-Plugin nutzen?

---
Stand: automatisch erzeugt auf Basis des aktuellen Repos (Dateien: README.md, SPECIFICATION.md, FUTURE_IMPROVEMENTS.md, `src/*`, `index.html`, `package.json`).
