# Runbook: Windows 11 + WSL + VS Code

## Start
- VS Code: Ordner `Music-Feelings-Annotation` in WSL öffnen (Remote WSL).
- Node/NPM prüfen: `node -v && npm -v` (Node 18+/20+ empfohlen)
- Pakete installieren: `npm install`
- Dev-Server starten (für Windows-Browser erreichbar):
  - `npm run dev -- --host 0.0.0.0`
  - Im Terminal die „Network“-URL (http://<ip>:5173) in Windows öffnen

## Environment
- `.env` anlegen:
  - `VITE_GOOGLE_API_KEY=DEIN_KEY`
- Nach Änderungen an `.env` Dev-Server neu starten.

## Genius
- In der App oben rechts Zahnrad → Genius Access Token eintragen.

## Troubleshooting
- Seite lädt nicht: Network-URL statt `localhost` nutzen; Firewall prüfen.
- Module not found: `npm install` und Dev-Server neu starten.
- „Cannot find module '@tailwindcss/typography'“: `npm i -D @tailwindcss/typography` und neu starten.
- Offene Eingabe (`>` in Bash): `Ctrl+C`, dann Kommando erneut eintippen.

