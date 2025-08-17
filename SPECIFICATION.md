# Projektspezifikation: KI-gestütztes Musik-Emotions-Annotationswerkzeug

Dieses Dokument dient als vollständige technische und konzeptionelle Blaupause für das Musik-Emotions-Annotationswerkzeug. Es erfasst die Vision, Architektur und Entwicklungshistorie des Projekts, um sicherzustellen, dass der Kontext für zukünftige Entwicklungsinstanzen erhalten bleibt.

## 1. Projektvision

Die Kernvision besteht darin, ein manuelles Audio-Annotationswerkzeug zu einem intelligenten, personalisierten Assistenten für die Musik-Emotionserkennung (MER) zu entwickeln. Das System ist als dynamischer Dialog zwischen dem Benutzer und der KI konzipiert. Eine KI liefert eine robuste Basisanalyse, die der Benutzer dann verfeinert. Das System lernt wiederum aus diesen Verfeinerungen, um zukünftige Analysen auf die einzigartige emotionale Wahrnehmung des Benutzers zuzuschneiden. Das ultimative Ziel ist ein Werkzeug, das den Annotations-Workflow beschleunigt und durch die Kombination von objektiver KI-Analyse mit subjektiver menschlicher Erfahrung tiefere Einblicke bietet.

## 2. Softwarearchitektur

### 2.1. Frontend-Stack
-   **Framework**: React (mit TypeScript)
-   **Build-Tool**: Vite
-   **Abhängigkeitsmanagement**: npm / `package.json`
-   **Styling**: TailwindCSS
-   **Kernbibliotheken**:
    -   `@google/genai`: Für die Interaktion mit dem Google Gemini KI-Modell.
    -   `@tensorflow/tfjs`: Für das Training und die Ausführung des personalisierten Machine-Learning-Modells im Browser.
    -   **Web Audio API**: Für die gesamte Audio-Dekodierung, -Wiedergabe und -Analyse.

### 2.2. Komponentenstruktur
Die Benutzeroberfläche ist in logische, wiederverwendbare Komponenten unterteilt, um die Trennung der Belange zu wahren und die Entwicklung zu vereinfachen. Der gesamte Quellcode befindet sich im `src/`-Verzeichnis.
-   **`App.tsx`**: Die Hauptanwendungskomponente, die als **Orchestrator** fungiert. Sie enthält selbst keine UI-Logik, sondern initialisiert die Kernlogik-Hooks und gibt den Zustand und die Handler an die untergeordneten UI-Komponenten weiter. Sie definiert und rendert auch komplexe modale Inhalte.
-   **`components/Header.tsx`**: Rendert die gesamte obere Leiste, einschließlich Audio-Laden, Profilverwaltung, Wiedergabesteuerungen und KI-Aktionsschaltflächen.
-   **`components/Workspace.tsx`**: Rendert den Hauptmittelteil, der das Visualisierungseinstellungsfenster, die `Timeline` und die `MarkerList` enthält.
-   **`components/Footer.tsx`**: Rendert die untere Leiste mit dem Speicherindikator und den Import/Export-Schaltflächen.
-   **`components/Timeline.tsx`**: Die zentrale interaktive Komponente. Eine auf Canvas basierende Ansicht, die für das Zeichnen der Wellenform, der Marker, des Wiedergabekopfes und der KI-Vorschläge sowie für die Handhabung aller Mausinteraktionen (Scrubbing, Ziehen, Größenänderung) verantwortlich ist.
-   **`components/LabelPanel.tsx`**: Das Formular auf der rechten Seite zur Bearbeitung der Details eines ausgewählten Markers.
-   **`components/MarkerList.tsx`**: Die Liste der erstellten Marker unterhalb der Zeitleiste.
-   **`components/Modal.tsx`**: Wiederverwendbarer modaler Dialog, implementiert via `shadcn/ui` (`Dialog`, `DialogContent`) für konsistente Barrierefreiheit und Verhalten.

### 2.3. Logikabstraktion (Custom Hooks)
Um `App.tsx` schlank zu halten und die Trennung der Belange zu wahren, ist die gesamte Geschäftslogik in benutzerdefinierten React Hooks gekapselt.
-   **`hooks/useAudioEngine.ts`**: Verwaltet alle Aspekte der Web Audio API.
    -   **Verantwortlichkeiten**: Erstellen des `AudioContext`, Dekodieren von Audiodateien, Verwalten des Wiedergabezustands (`isPlaying`, `currentTime`), Steuern der Lautstärke und Generieren der spektralen Wellenformdaten aus dem `AudioBuffer`.
-   **`hooks/useAnnotationSystem.ts`**: Das "Gehirn" der Anwendung.
    -   **Verantwortlichkeiten**: Verwalten des zentralen Anwendungszustands in Bezug auf Annotationen: `markers`, `profiles`, `songContext` und `selectedMarkerId`. Es verwaltet auch alle Interaktionen mit KI und Drittanbieterdiensten, einschließlich des Auslösens der Gemini-Analyse, der Verwaltung des Genius-Suchflusses, der Handhabung des API-Schlüsselzustands, des Sammelns von Trainingsdaten und des Initiierens des Trainings des persönlichen TensorFlow.js-Modells.

### 2.4. Datenpersistenz
-   **`localStorage`** wird für alle Sitzungsdaten verwendet, um sicherzustellen, dass die Arbeit bei einem Neuladen nicht verloren geht.
    -   **`AUTOSAVE_KEY`**: Speichert den Haupt-`AppState` (aktueller Track, Marker, Profile, API-Schlüssel und Songkontextdaten).
    -   **`TRAINING_DATA_PREFIX`**: Speichert `TrainingSample[]`-Arrays, eines für jedes Benutzerprofil.
    -   **`MODEL_STORAGE_KEY_PREFIX`**: Speichert das trainierte TensorFlow.js-Modell, eines für jedes Benutzerprofil.

### 2.5. Styling- und Komponenten-System
-   TailwindCSS als Styling-Basis, gebundled über Vite (kein CDN). Plugins: `@tailwindcss/typography` (für `prose`-Stile), `tailwindcss-animate` (Transitions).
-   `shadcn/ui` als Komponenten-Quelle (per CLI in `src/components/ui/*`). Hilfsfunktion `cn()` in `src/lib/utils.ts` (clsx + tailwind-merge).
-   `lucide-react` als einheitliche Icon-Bibliothek.

## 3. Feature-Aufschlüsselung

### 3.1. Integration von Drittanbieterdiensten
#### Genius API für reichhaltigen Songkontext
-   **Implementierung**: `services/geniusService.ts`
-   **API-Schlüsselverwaltung**: Der Benutzer gibt seinen eigenen "Client Access Token" von Genius über ein Einstellungsmodal an. Der Schlüssel wird im `localStorage` gespeichert.
-   **Zweistufiger UI-Workflow**: Um die Benutzerfreundlichkeit und Datenqualität zu maximieren, verwendet die Integration ein zweistufiges Modal.
    1.  **Suchen & Auswählen**: Der Benutzer sucht nach einem Song. Die App fragt den Genius `/search`-Endpunkt ab und zeigt eine Ergebnisliste an.
    2.  **Überprüfen & Bestätigen**: Bei Auswahl eines Ergebnisses führt die App mehrere parallele Anfragen aus: Sie ruft den `/songs/:id`-Endpunkt für Metadaten auf, scrapt die Webseite des Songs für die reinen Texte und, ganz entscheidend, ruft den `/referents`-Endpunkt auf, um alle zeilenspezifischen Community-Anmerkungen abzurufen. Anschließend wird eine reichhaltige Detailansicht mit all diesen Informationen angezeigt.
-   **Datenkompilierung**: Der Dienst fügt die gescrapten Texte programmgesteuert mit den Community-Anmerkungen zusammen und fügt jede Anmerkung direkt nach ihrer entsprechenden Zeile ein. Erst nach Benutzerbestätigung werden alle gesammelten und zusammengeführten Details zu einem einzigen, formatierten `songContext`-String kompiliert, der dann gespeichert und mit dem aktuellen Audiotrack verknüpft wird.
-   **Technischer Hinweis zu CORS**: Aufgrund von Browser-Sicherheitsrichtlinien werden alle Anfragen über einen öffentlichen CORS-Proxy (`corsproxy.io`) geleitet. Dies gilt sowohl für API-Aufrufe als auch für das Scrapen von HTML-Seiten.

### 3.2. KI-Vorschlags-Engine (Zwei-Ebenen-Modell)
Dies ist die Kerninnovation der Anwendung. Sie kombiniert eine leistungsstarke allgemeine KI mit einer kleinen, anpassungsfähigen persönlichen KI.

#### Ebene 1: Basis-MER-Modell (Gemini)
-   **Implementierung**: `services/geminiService.ts` (liest `VITE_GOOGLE_API_KEY` aus `import.meta.env`).
-   **Prozess**:
    1.  Die Audio-Wellenform wird in ein kompaktes Textformat zusammengefasst.
    2.  Diese Zusammenfassung wird zusammen mit dem reichhaltigen `songContext`-String, der von Genius abgerufen wurde (und nun zeilenweise Anmerkungen enthält), an das `gemini-2.5-flash`-Modell gesendet.
    3.  Ein detaillierter System-Prompt weist die KI an, als Experte für MIR/MER zu agieren und alle Teile des bereitgestellten Kontexts (Metadaten, allgemeine Anmerkungen, Texte und zeilenspezifische Interpretationen) für eine tiefere Analyse zu nutzen.
    4.  Ein striktes `responseSchema` wird verwendet, um sicherzustellen, dass die Ausgabe ein gültiges JSON ist, das eine Liste von `MerSuggestion`-Objekten enthält.
-   **Ausgabe**: Ein reichhaltiger Satz von Vorschlägen, einschließlich `time`, `valence`, `arousal`, `intensity`, `confidence`, eine `reason` für den Vorschlag und Vorhersagen für `gems`, `trigger` und `sync_notes`.

#### Ebene 2: Personalisierte Schicht (TensorFlow.js)
-   **Implementierung**: `services/mlService.ts` und `services/trainingService.ts`.
-   **Prozess**:
    1.  **Datensammlung**: Immer wenn ein Benutzer einen Marker erstellt oder bearbeitet, wird ein `TrainingSample` erstellt. Es paart die Vorhersage des Basismodells (Eingabe) mit der endgültigen Annotation des Benutzers (Ausgabe). Diese Daten werden pro Profil gespeichert.
    2.  **Training**: Wenn der Benutzer auf "Refine Profile" klickt (und genügend Samples hat), erstellt `mlService.ts` ein kleines sequentielles neuronales Netzwerk mit TensorFlow.js. Dieses Modell wird *nur* mit den gesammelten Daten des Benutzers trainiert.
    3.  **Inferenz**: Sobald ein persönliches Modell für ein Profil trainiert und geladen ist, ändert sich der Analyse-Workflow. Die Vorschläge des Basismodells (Ebene 1) werden durch das persönliche Modell (Ebene 2) geleitet, das die `valence`- und `arousal`-Werte korrigiert, bevor sie dem Benutzer angezeigt werden.

## 4. Entwicklungshistorie

Die Anwendung wurde iterativ entwickelt, wobei die Funktionen in logischen Phasen aufgebaut wurden:
1.  **Phase 1: Grundlage**: Die grundlegende Benutzeroberfläche für Profile wurde erstellt, und die KI wurde zunächst durch ein *simuliertes* Modell dargestellt.
2.  **Phase 2: Datensammlung**: Logik zur Erfassung und Speicherung von Benutzerannotationen als Trainingsdaten wurde implementiert.
3.  **Phase 3: Personalisierung**: TensorFlow.js wurde integriert, um das persönliche Modell zu trainieren und anzuwenden, wodurch die Zwei-Ebenen-KI-Architektur vervollständigt wurde.
4.  **Phase 4: Echte KI-Integration**: Die simulierte KI wurde durch einen Echtzeitaufruf an die Google Gemini API ersetzt.
5.  **Phase 5: Automatisierung von Texten & Metadaten**: Die Genius API wurde integriert, damit Benutzer Texte und Song-Metadaten suchen und automatisch importieren können.
6.  **Phase 6: Erweiterte Genius-Integration & UX-Überarbeitung**: Das Genius-Feature wurde in einen robusten, zweistufigen (Suchen -> Überprüfen/Bestätigen) Workflow refaktoriert. Dies umfasste neue API-Aufrufe (`/songs/:id`) und ein großes UI-Update zur Anzeige von reichhaltigen Metadaten und Community-Anmerkungen, was den Kontext für das Gemini-Modell erheblich verbesserte.
7.  **Phase 7: Abruf von zeilenweisen Anmerkungen**: Der Genius-Dienst wurde erweitert, um den `/referents`-API-Endpunkt abzufragen, sodass das Tool detaillierte Community-Anmerkungen abrufen und direkt in die Songtexte einfügen kann, um ein Höchstmaß an KI-Kontext zu schaffen.
8.  **Nachfolgende Verbesserungen**:
    -   Ersetzen von blockierenden `prompt()`-Dialogen durch eine nicht blockierende `Modal`-Komponente.
    -   Behebung zahlreicher UI/UX-Fehler in der `Timeline`-Komponente.
    -   Durchführung eines großen Refactorings von einer monolithischen `App.tsx` zu einer sauberen, auf Komponenten und Hooks basierenden Architektur.
    -   **Migration zu Vite**: Umstellung des gesamten Projekts von einem CDN-basierten Setup auf eine professionelle Vite-Build-Umgebung für verbesserte Entwicklererfahrung und Leistung.

## 5. Zukünftiger Fahrplan
-   **Erweiterte Visualisierungen**: Einführung alternativer Visualisierungsmodi wie ein Mehrband-Spektrogramm, um tiefere analytische Einblicke zu ermöglichen.
-   **Strukturanalyse**: Untersuchung der Verwendung eines KI-Modells zur automatischen Segmentierung des Songs in strukturelle Teile (Intro, Strophe, Refrain) und Anzeige dieser auf einer separaten Zeitleistenspur.
-   **Batch-Verarbeitung**: Ermöglichen, dass Benutzer mehrere Audiodateien hochladen und die Basis-Gemini-Analyse für alle im Hintergrund ausführen können.
