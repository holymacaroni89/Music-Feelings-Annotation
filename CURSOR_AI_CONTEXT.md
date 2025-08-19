# 🎵 CURSOR AI CONTEXT: Musik-Emotions-Annotationswerkzeug

## 📋 PROJEKTÜBERSICHT

**Name**: Musik-Emotions-Annotationswerkzeug (Music Emotion Annotation Tool)  
**Zweck**: KI-gestützte Webanwendung zur Annotation emotionaler Reaktionen auf Musik mit personalisiertem Machine Learning  
**Status**: Produktionsreif, laufende UI-Migration zu shadcn/ui  
**Architektur**: React 19 + TypeScript + Vite + TailwindCSS + Web Audio API + TensorFlow.js + Google Gemini

---

## 🏗️ KERNARCHITEKTUR

### Frontend-Stack

- **Framework**: React 19 mit TypeScript
- **Build-Tool**: Vite (schnelle Entwicklung, HMR)
- **Styling**: TailwindCSS + shadcn/ui Komponenten
- **Icons**: lucide-react (vollständig migriert)

### Audio-Engine

- **Web Audio API**: Echtzeit-Audio-Dekodierung, -Wiedergabe und -Analyse
- **Erweiterte Features**: Amplitude, Spectral Centroid, Spectral Flux, Tempo, Harmonic Ratio, Dynamic Range, Rhythmic Complexity, Loudness, Sharpness, Roughness
- **Wellenform-Generierung**: Canvas-basierte spektrale Visualisierung mit Farbkodierung

### KI-Architektur (Zweistufig)

1. **Basis-MER-Modell (Google Gemini)**: Analysiert Audio + Songkontext → emotionale Hotspots
2. **Personalisierte Schicht (TensorFlow.js)**: Lernt aus Benutzer-Annotationen → passt Vorschläge individuell an

### Externe APIs

- **Genius API**: Song-Metadaten, Lyrics, Community-Anmerkungen (zeilenweise)
- **Google Gemini**: KI-Emotionsanalyse mit strukturierten Prompts
- **CORS-Proxy**: corsproxy.io für externe API-Aufrufe

---

## 🔧 KOMPONENTENSTRUKTUR

### Hauptkomponenten

- **App.tsx**: Orchestrator ohne UI-Logik, verwaltet Modals und Zustand
- **Header.tsx**: Audio-Steuerung, Profilverwaltung, KI-Aktionen
- **Workspace.tsx**: Hauptcontainer für Timeline und Marker-Panel
- **Timeline.tsx**: Canvas-basierte Wellenform mit interaktiven Markern
- **LabelPanel.tsx**: Detailliertes Annotationsformular (GEMS, Trigger, Valence/Arousal)
- **MarkerList.tsx**: Übersicht aller erstellten Marker
- **Footer.tsx**: Speicherindikator, Import/Export

### Custom Hooks

- **useAudioEngine**: Web Audio API, Wellenform-Generierung
- **useAnnotationSystem**: Marker, Profile, KI-Integration, Genius-Suche
- **useVirtualScroll**: Optimierte Marker-Listen-Darstellung

### Services

- **geminiService.ts**: KI-Emotionsanalyse mit erweiterten Audio-Features
- **geniusService.ts**: Song-Metadaten und Community-Anmerkungen
- **mlService.ts**: TensorFlow.js-Modell-Training und -Inferenz
- **csvService.ts**: Import/Export von Annotationsdaten

---

## 🎯 ANNOTATIONS-SYSTEM

### Marker-Attribute

- **Emotionale Dimensionen**: Valenz (-1 bis +1), Arousal (0 bis 1), Intensität (0-100), Confidence (0-1)
- **GEMS-Kategorien**: Wonder, Transcendence, Tenderness, Nostalgia, Peacefulness, Power, JoyfulActivation, Tension, Sadness
- **Musikalische Auslöser**: Harmony, Melody, Rhythm, Timbre, Lyrics
- **Freitext**: Imagery, Sync-Notes

### Workflow

1. Audio laden → automatische Künstler/Titel-Erkennung
2. Songkontext finden → Genius-Integration
3. KI-Analyse → Gemini generiert emotionale Hotspots
4. Manuelle Verfeinerung → Benutzer passt Vorschläge an
5. Profil-Training → TensorFlow.js lernt aus Benutzer-Eingaben
6. Datenexport → CSV-Format

---

## 🔄 AKTUELLER ENTWICKLUNGSSTAND

### Abgeschlossene Migrationen ✅

- Vite + TypeScript + React 19 Setup
- TailwindCSS über Vite (kein CDN)
- shadcn/ui Basis-Konfiguration
- Dialog/Modal → shadcn Dialog
- Buttons → shadcn Button (Header/Footer/MarkerList)
- Slider → shadcn Slider (Volume, Valence/Arousal/Intensity/Confidence)
- Icons → lucide-react (vollständig)

### Laufende Arbeiten 🔄

- **Responsive Design vervollständigen** (hohe Priorität)
  - Mobile/Tablet-Layouts optimieren
  - Touch-Interaktionen verbessern
  - Breakpoint-spezifische Anpassungen

### Ausstehende Migrationen ⏳

- Select (GEMS) → shadcn Select
- Checkbox-Gruppe (Trigger) → shadcn Checkbox
- Button-Variants vereinheitlichen
- A11y-Review nach responsive Design

---

## 🚀 ZUKÜNFTIGE ENTWICKLUNGEN

### KI-Verbesserungen

- **Segmentiertes Processing**: Track in 30-60s Fenster teilen für bessere Token-Effizienz
- **Retrieval-Augmented Context**: Nur relevante Lyrics/Referents um Marker-Zeiten
- **Erweiterte Audio-Features**: Harmonic/Percussive Separation, Chroma Features, Onset Detection

### Visualisierung

- **Mehrspurige Timeline**: Separate Spuren für verschiedene Audio-Features
- **Mini-Spektrogramm**: 2D-Heatmap für Struktur-Erkennung
- **Struktur-Overlays**: Intro/Verse/Chorus/Bridge/Outro Erkennung

### Performance & Stabilität

- **CORS-Proxy-Strategie**: Eigener Lightweight-Proxy evaluieren
- **Gemini-Backend-Proxy**: API-Key-Schutz, Rate-Limiting
- **Caching**: Analyse-Ergebnisse für Wiederverwendung

---

## 💾 DATENPERSISTENZ

### localStorage-Struktur

- **AUTOSAVE_KEY**: Haupt-AppState (Track, Marker, Profile, API-Schlüssel, Songkontext)
- **TRAINING_DATA_PREFIX**: TrainingSample[] Arrays pro Profil
- **MODEL_STORAGE_KEY_PREFIX**: Trainierte TensorFlow.js-Modelle pro Profil

### Datenstrukturen

- **AppState**: Zentrale Anwendungsdaten
- **Marker**: Vollständige Annotations-Informationen
- **Profile**: Benutzerprofile mit separaten KI-Modellen
- **TrainingSample**: Eingabe/Ausgabe-Paare für ML-Training

---

## 🔐 KONFIGURATION & SETUP

### API-Schlüssel

- **Genius**: Benutzer stellt eigenen Client Access Token bereit (UI-Einstellungen)
- **Google Gemini**: VITE_GOOGLE_API_KEY in .env-Datei

### Entwicklungsumgebung

- **Start**: `npm install` → `npm run dev`
- **WSL**: `npm run dev -- --host 0.0.0.0` für Network-URL
- **HMR**: Automatisch aktiv, Neustart bei Config-Änderungen

---

## 📈 QUALITÄTSMETRIKEN & MESSUNGEN

### KI-Performance

- **Aktueller Stand**: ~3/10 Gemini-Vorschläge brauchbar
- **Ziel**: +20-25% initial prediction accuracy
- **Erwartete Verbesserungen**: +30% user satisfaction, -40% manual corrections

### Technische Metriken

- **Analyse-Latenz**: <5s Ziel
- **Memory Usage**: <100MB zusätzlicher Overhead
- **Token-Verbrauch**: 4-10k Tokens pro Analyse (abhängig von Kontext)

---

## ⚠️ BEKANNTE PROBLEME & RISIKEN

### Aktuelle Herausforderungen

- **KI-Qualität**: Gemini-Vorschläge oft ungenau oder falsch positioniert
- **Responsive Design**: Mobile/Tablet-Layouts noch nicht optimal
- **CORS-Proxy**: Abhängigkeit von externem corsproxy.io

### Risiko-Mitigation

- **Gemini-Key**: Für Produktion Backend-Proxy empfohlen
- **CORS**: Eigener Lightweight-Proxy evaluieren
- **Token-Limits**: Segmentierung und RAC implementieren

---

## 🎯 AKTUELLER ENTWICKLUNGSSTAND & TODOS

### ✅ ABGESCHLOSSENE PHASEN

#### **Phase 1: Responsive Design vervollständigen** ✅

- [x] Mobile/Tablet UX finalisieren
- [x] Timeline: Tooltip-Clamping für XS/SM implementieren
- [x] Header XS/SM: Kompaktierung
- [x] Timeline: Höhen/Hitboxen feinjustieren
- [x] Workspace/MarkerList: XS-Abstände prüfen
- [x] Touch-Gesten testen und optimieren

#### **Phase 7: Mobile UX Modernisierung** ✅

- [x] Header-Layout kompakter machen
- [x] Profile-Dropdown modernisieren
- [x] Button-Hierarchie verbessern
- [x] Bottom Navigation hinzufügen
- [x] Gesture-Support implementieren

#### **MarkerList-Verbesserungen** ✅

- [x] Scrolling Issue beheben
- [x] List Management Features hinzufügen
- [x] Visual Design & UX verbessern
- [x] Performance Optimierungen implementieren
- [x] Accessibility & Keyboard Navigation

#### **AI Data Enhancement** ✅

- [x] Phase 1: Quick Wins implementieren
- [x] Phase 1: Gemini Prediction Enhancement

### 🔄 LAUFENDE ARBEITEN

#### **Responsive Design** ✅ ABGESCHLOSSEN

- Mobile und Tablet-Layouts optimiert
- Touch-Interaktionen für kleinere Geräte verbessert
- Breakpoint-spezifische Anpassungen finalisiert

### ⏳ AUSSTEHENDE PHASEN (Priorisiert)

#### **Phase 2: LabelPanel – UI-Konsistenz** ✅ ABGESCHLOSSEN

- [x] **Slider auf shadcn/ui umstellen**: Valence/Arousal/Intensity/Confidence bereits auf shadcn Slider migriert
- [x] **Numerische Readouts/Feineingabe**: Konsistente Anzeige der Werte bereits implementiert
- [x] **Mobile Modal optimieren**: Scroll & Touch-Ziele bereits optimiert
- [x] **GEMS Select / Trigger Checkbox**: Alle Formularelemente bereits auf shadcn/ui migriert

#### **Phase 3: Button-Variants & Theme** ✅ ABGESCHLOSSEN

- [x] **Button-Variants definieren**: cva-Variants in ui/button.tsx bereits definiert (primary/secondary/ghost/destructive/outline)
- [x] **Buttons app-weit vereinheitlichen**: Alle Buttons in App.tsx, Workspace.tsx, Header, Footer, MarkerList etc. auf Variants umgestellt
- [x] **Prominente Actions hervorheben**: Visuelle Hierarchie durch Größe und Prominenz implementiert
- [x] **Theme-Tokens dokumentieren**: Button-Variants bereits in ui/button.tsx definiert

#### **Phase 4: Accessibility-Review**

- [ ] **ARIA/Labels ergänzen**: Fehlende aria-label/title/role prüfen und ergänzen
- [ ] **Modal Fokus-Management**: Focus-Trap, initial focus, Escape/Overlay-Click Verhalten
- [ ] **Tastatur-Navigation**: Timeline Wrapper fokusierbar, Pfeil-/Tab-Interaktion
- [ ] **Kontraste prüfen**: Mit Tools Kontrast prüfen und nötige Anpassungen

#### **Phase 5: Netzwerkstabilität/Proxy-Strategie**

- [ ] **Genius CORS-Proxy konfigurierbar**: Env/Settings für Proxy-URL, URL austauschbar machen
- [ ] **Vite Dev-Proxy evaluieren**: Proxy für Genius im Dev-Server evaluieren
- [ ] **Gemini-Proxy Design-Dokument**: Flow, Endpunkte, Rate-Limits, Key-Schutz
- [ ] **Entscheidungsnotiz Proxy-Strategie**: Kurz- vs. langfristige Strategie festhalten

#### **Phase 6: QA & Dokumentation**

- [ ] **QA-Checkliste erstellen**: Manuelle Testliste (Responsive, Touch, A11y, Import/Export, KI-Buttons)
- [ ] **README aktualisieren**: Mobile/Tablet-Nutzung, bekannte Stolpersteine, Tipps
- [ ] **Test-Setup Plan**: Kurzer Plan für späteres Test-Setup (Vitest/RTL)

### 🚀 ZUKÜNFTIGE ENTWICKLUNGEN (Nach UI-Migration)

#### **KI-Qualität Verbesserungen**

- [ ] **Audio-Features erweitern**: Harmonic/Percussive Separation, Chroma Features (Tonart-Erkennung)
- [ ] **Prompt-Engineering optimieren**: Few-Shot-Beispiele, strukturierte Prompts, Kontext-Selektion
- [ ] **Genius-Kontext optimieren**: Evaluieren ob Referents helfen oder Kontext aufblähen
- [ ] **Segmentierung evaluieren**: Track-Segmentierung (30-60s) vs. Volltrack-Analyse testen

#### **Personalisierung erweitern**

- [ ] **Negative Samples sammeln**: Abgelehnte/gelöschte KI-Vorschläge als negative Trainingsdaten
- [ ] **Mehr Dimensionen trainieren**: TF.js-Modell um Intensity/Confidence/GEMS erweitern
- [ ] **Training-Strategien verbessern**: Minimum Samples evaluieren, Datenaugmentation, Normalisierung

#### **Erweiterte MarkerList Features**

- [ ] **Advanced Features**: Keyboard shortcuts (Ctrl+F, Escape), extended search, bulk actions
- [ ] **Mobile Optimierungen**: Touch-friendly interactions, swipe gestures, mobile-specific UI
- [ ] **Performance**: Virtualized list, lazy loading, optimized search algorithms
- [ ] **Intelligence**: Auto-complete, filter suggestions, statistics dashboard

#### **AI & Performance**

- [ ] **Performance Optimization**: Chunked analysis, parallel processing, streaming results, caching
- [ ] **Enhanced Context**: MusicBrainz API, Spotify Audio Features, user listening history
- [ ] **Real-time Feedback**: Continuous analysis, live confidence scoring, adaptive refinement
- [ ] **Advanced Visualization**: Emotion heatmaps, confidence intervals, emotional trajectory

#### **Externe APIs & Audio-Analyse**

- [ ] **Phase 2: External APIs**: Spotify Audio Features, Last.fm tags, user preference learning
- [ ] **Phase 3: Advanced Audio**: Pitch & harmony detection, audio segmentation, biometric data
- [ ] **MusicBrainz Integration**: Genre, mood, style, instrumentation detection
- [ ] **Playback Behavior Tracking**: Seek patterns, pause points, volume changes, repeat sections

#### **TensorFlow & Machine Learning**

- [ ] **Model Architecture**: Mehr Features (GEMS, Trigger, Intensity, audio features), dropout, regularization
- [ ] **Continuous Learning**: Incremental learning, early stopping, performance metrics
- [ ] **Advanced Training**: Data augmentation, ensemble methods, adaptive learning rates

### 📊 FORTSCHRITTS-TRACKER

**Aktueller Stand**:

- ✅ **Responsive Design**: 100% abgeschlossen
- ✅ **Mobile UX**: 100% abgeschlossen
- ✅ **MarkerList**: 100% abgeschlossen
- 🔄 **UI-Migration**: 95% abgeschlossen (Buttons, Slider, Icons, LabelPanel, Button-Variants → shadcn/ui)
- ✅ **LabelPanel**: 100% abgeschlossen
- ✅ **Button-Variants**: 100% abgeschlossen
- ⏳ **Accessibility**: 0% (nächste Priorität)

**Nächste Meilensteine**:

1. **Accessibility-Review** (Phase 4) - 1-2 Wochen - **NÄCHSTE PRIORITÄT**
2. **KI-Qualität** - Nach UI-Migration (2-3 Wochen)

---

## 📚 WICHTIGE DATEIEN & STRUKTUR

### Kern-Dateien

- `src/App.tsx` - Hauptanwendungskomponente
- `src/types.ts` - TypeScript-Definitionen
- `src/hooks/useAnnotationSystem.ts` - Kernlogik
- `src/hooks/useAudioEngine.ts` - Audio-Verarbeitung
- `src/services/geminiService.ts` - KI-Integration
- `src/services/geniusService.ts` - Song-Kontext
- `src/services/mlService.ts` - Machine Learning

### Konfiguration

- `package.json` - Abhängigkeiten
- `tailwind.config.js` - Tailwind-Konfiguration
- `vite.config.ts` - Build-Konfiguration
- `.env` - Umgebungsvariablen (VITE_GOOGLE_API_KEY)

### Dokumentation

- `README.md` - Benutzeranleitung
- `SPECIFICATION.md` - Technische Spezifikation
- `docs/ROADMAP.md` - Entwicklungsplan
- `docs/ASSESSMENT_AND_TODO.md` - Aktueller Stand

---

## 🔍 FÜR CURSOR AI SESSIONS

Diese Datei dient als **vollständiger Kontext** für neue Cursor AI Sessions. Die App ist ein **produktionsreifes KI-gestütztes Musik-Emotions-Annotationswerkzeug** mit:

- **Zweistufiger KI-Architektur** (Gemini + TensorFlow.js)
- **Erweiterten Audio-Features** für präzise Emotionserkennung
- **Genius-Integration** für reichhaltigen Songkontext
- **Laufender UI-Migration** zu shadcn/ui
- **Responsive Design-Überarbeitung** als aktuelle Priorität

**Wichtig**: Bei Code-Änderungen den aktuellen Migrationsstand beachten und die laufenden Arbeiten am responsiven Design nicht unterbrechen.

**Letzte Aktualisierung**: Automatisch generiert basierend auf dem aktuellen Repository-Stand
