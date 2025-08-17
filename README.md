# Musik-Emotions-Annotationswerkzeug

Dies ist eine leistungsstarke, KI-gestützte Webanwendung zur Annotation emotionaler Reaktionen auf Musik. Es geht über einen einfachen manuellen Editor hinaus und wird zu einem intelligenten Partner, der Ihnen hilft, den emotionalen Bogen eines Audiotracks zu identifizieren, zu kennzeichnen und zu verstehen.

## Hauptmerkmale

- **Erweiterte Audiovisualisierung**: Zeigt eine spektrale Farbwellenform an, bei der die Farbe die Helligkeit des Klangs (Timbre) und die Höhe seine Amplitude darstellt, was das Erkennen von Klangveränderungen erleichtert.
- **Manuelle & KI-gestützte Annotation**: Erstellen Sie Zeitbereichsmarker manuell mit der 'M'-Taste oder erhalten Sie einen Vorsprung durch KI-generierte Vorschläge.
- **KI-Emotionsanalyse (unterstützt durch Google Gemini)**: Mit einem Klick sendet das Tool eine Zusammenfassung der Audioeigenschaften des Tracks (und optionalen Songkontexts) an das Gemini-KI-Modell, um intelligente Vorschläge für emotional bedeutsame Momente zu erhalten.
- **Reichhaltiger Songkontext (unterstützt durch Genius)**: Ein leistungsstarker, zweistufiger Prozess ermöglicht es Ihnen, nach einem Song auf Genius zu suchen, seine Metadaten, Texte und Community-Anmerkungen zu überprüfen. Das Tool ruft sogar detaillierte, **zeilenweise Benutzeranmerkungen** ab und integriert sie, um der KI den tiefstmöglichen Kontext zu bieten.
- **Personalisiertes KI-Modell (unterstützt durch TensorFlow.js)**: Das Tool lernt aus Ihren Annotationen! Es verwendet Ihre Bearbeitungen, um ein kleines, persönliches Machine-Learning-Modell zu trainieren, das die Vorschläge der Basis-KI verfeinert, um besser Ihrer einzigartigen emotionalen Wahrnehmung zu entsprechen.
- **Multi-Profil-System**: Erstellen Sie verschiedene Benutzerprofile, jedes mit seinem eigenen persönlichen KI-Modell. Die Vorschläge der KI passen sich dem aktiven Profil an.
- **Umfassendes Annotationsformular**: Kennzeichnen Sie Marker mit einer Vielzahl von Attributen, einschließlich Valenz, Arousal, Intensität, GEMS-Kategorien und musikalischen Auslösern. Informative Tooltips erklären jedes Feld.
- **Datenportabilität**: Exportieren Sie Ihre Annotationen in eine CSV-Datei zur externen Analyse oder importieren Sie bestehende Annotationen, um Ihre Arbeit fortzusetzen.
- **Sitzungspersistenz**: Ihre gesamte Sitzung, einschließlich Marker, Profile und Trainingsdaten, wird automatisch im lokalen Speicher Ihres Browsers gespeichert.

## Erste Schritte: Ein typischer Arbeitsablauf

### Entwicklungsumgebung einrichten
Dieses Projekt verwendet Vite für eine schnelle Entwicklungsumgebung.
1.  **Abhängigkeiten installieren**: Öffnen Sie ein Terminal im Projektverzeichnis und führen Sie aus:
    ```bash
    npm install
    ```
2.  **Entwicklungsserver starten**: Führen Sie den folgenden Befehl aus, um den Vite-Entwicklungsserver zu starten:
    ```bash
    npm run dev
    ```
3.  Öffnen Sie die in Ihrem Terminal angezeigte lokale URL (normalerweise `http://localhost:5173`) in Ihrem Browser.

Hinweise für Windows 11 + WSL
- Starten mit offenem Host (falls `localhost` im Windows-Browser nicht erreichbar ist):
  ```bash
  npm run dev -- --host 0.0.0.0
  ```
  Nutzen Sie dann die „Network“-URL aus der Vite-Ausgabe.
- HMR lädt Änderungen automatisch. Dev-Server neu starten bei Änderungen an `.env`, `tailwind.config.js`, `postcss.config.js`, `vite.config.ts` oder nach `npm install`.

### Einmalige Einrichtung: Genius API-Schlüssel
Um die automatische Suche nach Songinformationen zu aktivieren, benötigen Sie einen kostenlosen API-Schlüssel von Genius.
1.  Gehen Sie zu [genius.com/api-clients](https://genius.com/api-clients) und melden Sie sich an.
2.  Erstellen Sie einen "New API Client". Sie können `Music Emotion Tool` als Namen und `http://localhost` für die URLs verwenden.
3.  Klicken Sie für Ihren neuen Client auf "Generate Access Token". Kopieren Sie dieses Token.
4.  Klicken Sie in dieser Anwendung auf das **Einstellungen-Zahnradsymbol** in der oberen rechten Ecke.
5.  Fügen Sie Ihr kopiertes Token in das Feld "Genius API Key" ein und klicken Sie auf "Save Keys". Der Schlüssel wird im Speicher Ihres Browsers für die zukünftige Verwendung gespeichert.

### Annotations-Workflow
1.  **Audio laden**: Klicken Sie auf die Schaltfläche "Load Audio", um eine `.mp3`-, `.wav`- oder `.flac`-Datei auszuwählen. Die App versucht automatisch, Künstler und Titel aus dem Dateinamen zu parsen.
2.  **Songkontext finden**: Klicken Sie auf das Liedtext-Symbol neben dem Songtitel. Ein Suchfenster erscheint.
    -   Wählen Sie den richtigen Song aus den Suchergebnissen aus.
    -   Eine neue **Detailansicht** erscheint mit Albumcover, Veröffentlichungsinformationen, allgemeinen Community-Notizen und Texten, die mit zeilenweisen Anmerkungen angereichert sind.
    -   Überprüfen Sie die Informationen und klicken Sie auf **"Use This Data for AI Analysis"**. Dieser Schritt ist entscheidend, um die besten KI-Ergebnisse zu erzielen.
3.  **Emotionen analysieren**: Klicken Sie auf die Schaltfläche **"Analyze Emotions"**. Die App sendet die Audiodaten und den reichhaltigen Songkontext an die KI. Nach einigen Augenblicken erscheinen gelbe Rauten auf der Zeitleiste, die vorgeschlagene emotionale Hotspots darstellen.
4.  **Überprüfen & Annotieren**:
    -   Fahren Sie mit der Maus über die gelben Rauten, um die Begründung der KI in einem Tooltip zu sehen.
    -   Klicken Sie auf eine Raute, um einen neuen Marker zu erstellen, der mit den detaillierten Vorschlägen der KI vorausgefüllt ist.
    -   Passen Sie die Werte im Formular auf der rechten Seite an Ihre Wahrnehmung an.
    -   Erstellen Sie Ihre eigenen Marker manuell, indem Sie 'M' einmal drücken, um einen Startpunkt festzulegen, und erneut, um den Endpunkt festzulegen.
5.  **Profil verfeinern**: Während Sie Marker erstellen und bearbeiten, sammeln Sie "Trainingspunkte". Sobald Sie genug haben, klicken Sie auf die Schaltfläche **"Refine Profile"**, um Ihr persönliches KI-Modell zu trainieren. Zukünftige Analysen unter diesem Profil werden nun besser auf Ihre Eingaben abgestimmt sein.
6.  **Daten exportieren**: Wenn Sie fertig sind, klicken Sie auf die Schaltfläche "Export CSV", um Ihre Arbeit zu speichern.

### Einmalige Einrichtung: Google Gemini API-Schlüssel
Für die KI-Emotionsanalyse wird ein Google API Key benötigt.
1. Erstellen Sie einen API Key in der Google AI Studio/Console.
2. Legen Sie im Projektverzeichnis eine Datei `.env` an und setzen Sie:
   
   VITE_GOOGLE_API_KEY=dein_api_key

3. Starten Sie den Dev-Server neu (`npm run dev`). Ohne Schlüssel ist die Schaltfläche „Analyze Emotions“ deaktiviert.

Sicherheits-Hinweis
- Verteilen Sie den API-Key nicht öffentlich. Für produktive Nutzung empfiehlt sich ein Backend-Proxy, damit der Key nicht im Client liegt.

### Styling & UI-Komponenten
- Tailwind wird über Vite gebundled (kein CDN). Plugins: `@tailwindcss/typography`, `tailwindcss-animate`.
- UI-Basis migriert auf `shadcn/ui` (Button, Dialog, Slider). Icons: `lucide-react`.
- shadcn-CLI nutzen, um Komponenten hinzuzufügen:
  ```bash
  npx shadcn@latest add dialog
  npx shadcn@latest add button
  npx shadcn@latest add input
  npx shadcn@latest add slider
  npx shadcn@latest add tooltip
  ```
  Die Dateien werden nach `src/components/ui/` geschrieben; Hilfsfunktion `cn` liegt unter `src/lib/utils.ts`.

### Fehlerbehebung (Troubleshooting)
- „Cannot find module …“: Nach Paketänderungen `npm install` ausführen und Dev-Server neu starten.
- `.env` greift nicht: Dev-Server neu starten; `cat .env` prüfen (eine Zeile ohne Extrazeichen).
- WSL: Falls `localhost` nicht erreichbar, „Network“-URL verwenden oder Firewall prüfen.
