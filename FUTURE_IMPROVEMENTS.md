# Zukünftige Verbesserungen & Technischer Fahrplan

Dieses Dokument skizziert potenzielle Bereiche für die zukünftige Entwicklung, um die Skalierbarkeit, Robustheit und Wartbarkeit der Anwendung zu verbessern. Obwohl die aktuelle Architektur für ihren Umfang gut geeignet ist, bieten diese Vorschläge einen Weg nach vorn, wenn die Komplexität des Projekts wächst.

---

## Plan: UI/UX-Überarbeitung mit Vite, Tailwind CSS und shadcn/ui

Dieser Abschnitt beschreibt den detaillierten, schrittweisen Plan zur Migration der Benutzeroberfläche der Anwendung auf einen modernen, professionellen und hochgradig wartbaren Stack. Dies ist die wirkungsvollste architektonische Verbesserung, die wir vornehmen können.

### 1. Strategische Begründung

-   **Professionelle Ästhetik**: Übergang von einer funktionalen Benutzeroberfläche zu einem ausgefeilten, erstklassigen Designsystem, das von `shadcn/ui` bereitgestellt wird.
-   **Entwicklererfahrung (DX)**: Einführung von `Vite` für einen blitzschnellen Entwicklungsserver mit sofortigen Updates (HMR).
-   **Wartbarkeit & Skalierbarkeit**: `Tailwind CSS` Utility-Klassen und komponentenbasiertes Styling machen die Benutzeroberfläche konsistent und leicht zu ändern.
-   **Leistung**: `Vite` erzeugt hochoptimierte Builds, und `Tailwind CSS` entfernt ungenutzte Stile, was zu minimalen CSS-Payloads führt.
-   **Barrierefreiheit**: `shadcn/ui`-Komponenten werden mit Barrierefreiheit (WAI-ARIA) als erstklassigem Bürger entwickelt.

### 2. Der neue Stack

-   **`Vite`**: Das Build-Tool. Es wird unseren TypeScript/React-Code kompilieren, unser CSS verarbeiten und eine schnelle Entwicklungsumgebung bereitstellen.
-   **`Tailwind CSS`**: Die Styling-Engine. Ein Utility-First-CSS-Framework, das es uns ermöglicht, jedes Design direkt in unserem Markup zu erstellen.
-   **`shadcn/ui`**: Die Komponentenbibliothek. Es ist keine typische Bibliothek; wir verwenden ihre CLI, um gut architektonisch gestaltete, vollständig gestylte React-Komponenten (erstellt mit Tailwind) direkt in unser Projekt zu kopieren, was uns die volle Kontrolle über ihren Code gibt.

### 3. Gestufter Migrationsplan

Dieser Prozess ist so konzipiert, dass er in bewussten Phasen durchgeführt wird, um Unterbrechungen zu minimieren und Qualität zu gewährleisten.

#### Phase 0: Einrichtung der Projektgrundlage (✅ Abgeschlossen)

Dies war eine einmalige Einrichtung, die die neue Entwicklungsumgebung etabliert hat. Die Anwendung sieht nach dieser Phase nicht anders aus, aber der zugrunde liegende Build-Prozess ist völlig neu.

1.  **Vite eingeführt**:
    -   Eine `package.json` zur Verwaltung der Abhängigkeiten wurde erstellt.
    -   `vite`, `react`, `react-dom`, `typescript` und ihre entsprechenden Typen wurden als Abhängigkeiten hinzugefügt.
    -   `vite.config.ts` wurde erstellt, um das React-Plugin zu konfigurieren.
2.  **Tailwind CSS integriert**:
    -   `tailwindcss`, `postcss` und `autoprefixer` wurden als Entwicklungsabhängigkeiten hinzugefügt.
    -   `tailwind.config.js` und `postcss.config.js` wurden erstellt.
    -   Eine globale `index.css`-Datei wurde erstellt und die Tailwind `@tailwind`-Direktiven wurden eingefügt.
3.  **Projektdateien restrukturiert**:
    -   Alle vorhandenen `.tsx`-, `.ts`- und `.html`-Dateien wurden in ein `src/`-Verzeichnis verschoben.
    -   `index.html` wurde zu einem Standard-Vite-Einstiegspunkt aktualisiert, der über ein `<script type="module">`-Tag auf `src/index.tsx` verweist.
    -   Das Tailwind CDN-Skript und die `importmap` wurden aus `index.html` entfernt. Alle Abhängigkeiten werden jetzt von Vite über `package.json` verwaltet.

#### Phase 1: Globale Stile & Implementierung von Kernkomponenten

Mit der geschaffenen Grundlage werden wir nun die visuelle Identität der Anwendung definieren.

1.  **Konfigurieren von `tailwind.config.js`**:
    -   Definieren einer neuen, modernen Farbpalette (z. B. unter Verwendung der "slate"- oder "zinc"-Farben von Tailwind für Hintergründe und Text und einer lebendigen Farbe wie "blue" oder "violet" für Akzente).
    -   Konfigurieren der Schriftfamilie zur Verwendung einer modernen serifenlosen Schrift wie "Inter".
2.  **Anwenden globaler Stile**:
    -   Festlegen der Basishintergrundfarbe, Textfarbe und Schriftart auf dem `<body>`-Tag in `index.css`.
3.  **Initialisieren von `shadcn/ui`**:
    -   Ausführen des `shadcn/ui` init-Befehls, um `components.json` einzurichten und das `lib/utils.ts`- und `components/ui`-Verzeichnis zu erstellen.
4.  **Hinzufügen von Kernkomponenten**:
    -   Verwenden der `shadcn/ui` CLI, um den ersten Satz wesentlicher, ungestylter UI-Komponenten hinzuzufügen.
    -   `npx shadcn-ui@latest add button`
    -   `npx shadcn-ui@latest add input`
    -   `npx shadcn-ui@latest add select`
    -   `npx shadcn-ui@latest add slider`
    -   `npx shadcn-ui@latest add dialog` (für unsere Modals)
    -   `npx shadcn-ui@latest add tooltip`

#### Phase 2: Layout & Komponentenaustausch

In dieser Phase werden wir das alte Styling entfernen und es Komponente für Komponente durch das neue System ersetzen.

1.  **Hauptlayout neu aufbauen**:
    -   Refactoring von `App.tsx` und seinen Hauptkindern (`Header.tsx`, `Workspace.tsx`, `Footer.tsx`, `LabelPanel.tsx`), um Tailwinds Flexbox- und Grid-Utilities für das Layout anstelle von benutzerdefiniertem CSS zu verwenden.
2.  **Komponententausch**:
    -   Systematisches Durchgehen jeder Komponente.
    -   Ersetzen jedes `<button>`-Elements durch die neue `<Button>`-Komponente aus `components/ui/button`.
    -   Ersetzen von `<input type="range">` durch die neue `<Slider>`-Komponente.
    -   Ersetzen der benutzerdefinierten `Modal.tsx` durch `<Dialog>` von `shadcn/ui`.
    -   Aktualisieren aller anderen Formularelemente (`select`, `textarea`, `checkbox`), um ihre `shadcn/ui`-Äquivalente zu verwenden oder sie mit Tailwind-Klassen für Konsistenz zu stylen.
3.  **Icon-Standardisierung**:
    -   Ersetzen der benutzerdefinierten SVG-Icons durch eine standardmäßige, hochwertige Icon-Bibliothek wie `lucide-react`. Dies gewährleistet visuelle Konsistenz.

#### Phase 3: Refactoring komplexer & benutzerdefinierter Komponenten

Diese Phase befasst sich mit den einzigartigsten und anspruchsvollsten Teilen der Benutzeroberfläche.

1.  **Timeline**: Die Kern-Canvas-Rendering-Logik in `Timeline.tsx` bleibt unverändert. Die umgebenden `div`-Container und alle Overlay-Elemente (wie die Tooltips) werden jedoch neu erstellt und mit Tailwind-Utilities gestylt, um sich nahtlos in das neue Design zu integrieren.
2.  **MarkerList**: Refactoring von `MarkerList.tsx`. Die Listenelemente werden mit Flexbox neu aufgebaut, und ihre Zustände (ausgewählt, darüber geschwebt) werden mit den Zustandsvarianten von Tailwind (`hover:bg-slate-800`, `data-[state=selected]:bg-blue-900`) verwaltet.
3.  **LabelPanel**: Überarbeitung von `LabelPanel.tsx` zu einem sauberen Formular, das vollständig aus den neuen `shadcn/ui`-Komponenten (`Input`, `Slider`, `Select` usw.) besteht, um ein professionelles und konsistentes Erscheinungsbild zu gewährleisten.

#### Phase 4: Feinschliff & Bereinigung

Der letzte Schritt besteht darin, alle Überreste des alten Systems zu entfernen und sicherzustellen, dass das neue perfekt ist.

1.  **Code-Bereinigung**:
    -   Löschen der alten `components/icons.tsx`-Datei zugunsten von `lucide-react`.
    -   Durchsuchen des gesamten Projekts nach verbleibenden inline-`style`-Attributen oder alten Klassennamen und deren Entfernung.
2.  **Überprüfung und Verfeinerung**:
    -   Durchführung einer vollständigen visuellen Überprüfung der Anwendung, um Inkonsistenzen zu erkennen.
    -   Testen der Reaktionsfähigkeit auf verschiedenen Bildschirmgrößen.
    -   Durchführung einer Barrierefreiheitsprüfung mit Browser-Tools, um sicherzustellen, dass alle `shadcn/ui`-Komponenten korrekt implementiert sind.

---

## Fortschritts-Tracker (aktueller Stand)

- Erledigt/Teilweise erledigt:
  - Tailwind über Vite gebundled; CDN/Import-Maps entfernt; Typography/Animate-Plugins aktiv.
  - `shadcn/ui` Basis konfiguriert (`components.json`, Aliases, `src/lib/utils.ts`).
  - Dialog (Modal) auf `shadcn` umgestellt.
  - Buttons in Header/Footer/MarkerList auf `shadcn` umgestellt (inkl. Icon-Buttons).
  - Slider (Header-Volume; LabelPanel: Valence, Arousal, Intensity, Confidence) auf `shadcn`.
  - Icons vollständig auf `lucide-react` konsolidiert.

- Ausstehend/Nächste Schritte:
  - `select` und `checkbox` via `shadcn` ergänzen und im LabelPanel umstellen (GEMS/Trigger).
  - Button-Variants/Theme verfeinern (Prominenz der Primäraktionen erhöhen).
  - Responsiveness/A11y-Review und visuelle Feinarbeit.
  - Optional: Eigener CORS-Proxy und Gemini-Backend-Proxy evaluieren.
