# Development Guide

## Prerequisites
- Node.js 18+ (empfohlen 20+), npm 9+
- Vite-Dev-Server: `npm run dev` (WSL: `npm run dev -- --host 0.0.0.0` und Network-URL nutzen)

## Environment
- `.env` im Projektroot:
  - `VITE_GOOGLE_API_KEY=...` (Dev: optional; ohne Key ist der Analyze-Button deaktiviert)
- Nach Änderungen an `.env` den Dev-Server neu starten.

## Styling & UI
- Tailwind via Vite (kein CDN). Plugins: `@tailwindcss/typography`, `tailwindcss-animate`.
- Utilities: `src/index.css` (`@tailwind base; @tailwind components; @tailwind utilities;`).
- Komponenten: `shadcn/ui`-CLI kopiert Dateien nach `src/components/ui/*`.
- Icons: `lucide-react` (Wrapper in `src/components/icons.tsx`).

## shadcn/ui Workflow
- Init ist vorbereitet (siehe `components.json`). Komponenten hinzufügen:
  ```bash
  npx shadcn@latest add dialog
  npx shadcn@latest add button
  npx shadcn@latest add input
  npx shadcn@latest add slider
  npx shadcn@latest add tooltip
  ```
- Neue Komponenten importieren: `import { Button } from '@/components/ui/button'`.
- Klassen kombinieren: `cn()` aus `src/lib/utils.ts`.

## Codeorganisation
- App-Logik in Hooks (`src/hooks/*`), Rendering in Components (`src/components/*`).
- Services: `src/services/*` (Gemini/Genius/CSV/ML/Training), lesen Konfiguration aus `import.meta.env` bzw. App-State.
- Types/Constants unter `src/types.ts`, `src/constants.ts`.

## HMR & Restarts
- Live-Reload: Dateien speichern → Browser aktualisiert automatisch.
- Dev-Server neu starten bei: `.env`, Tailwind-/Vite-Config-Änderungen, `npm install`.

## Troubleshooting
- Module not found → `npm install`, dann Dev-Server neu starten.
- WSL: `--host 0.0.0.0` nutzen, Network-URL öffnen; Firewall prüfen.
- Gemini-Fehler → `.env` prüfen; Key ggf. rotieren; Netzwerk.

