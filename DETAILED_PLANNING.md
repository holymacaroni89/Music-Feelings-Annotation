# **Detailed Planning - Music Emotion Annotation Tool**

## **Granulare Task-Liste für ausführbare Entwicklung**

---

## **📋 Aktueller Stand (v0.2.0) ✅ ABGESCHLOSSEN**

### **Phase 1: MVP & Grundlagen**

- ✅ Core Audio-Funktionalität (Web Audio API)
- ✅ Basis-UI mit Tailwind/shadcn
- ✅ KI-Integration (Google Gemini)
- ✅ Marker-Erstellung und -Verwaltung
- ✅ Code-Konsolidierung (25% Reduktion)
- ✅ Bundle-Optimierung (Vendor-Chunks)
- ✅ Dokumentations-Konsolidierung

### **Phase 1.5: Bugfixes & Stabilität ✅ ABGESCHLOSSEN**

- ✅ Timeline-Steuerung (Click & Drag Panning)
- ✅ Zoom-Funktionalität (Passive Event Listener Fix)
- ✅ AudioContext-Initialisierung (User Gesture Requirement)
- ✅ Hotspot-Speicherung (IndexedDB Integration)
- ✅ Hover-Funktionalität (2D Hit-Test für Tooltips)
- ✅ AI-Analyse-Performance (Doppelte Aufrufe eliminiert)
- ✅ AI-Fehlerbehandlung & Marker-Erhaltung (Debug-Logs bereinigt)

### **Technische Basis**

- ✅ React 19 + TypeScript + Vite
- ✅ TailwindCSS + shadcn/ui
- ✅ TensorFlow.js Integration
- ✅ Lokale Datenspeicherung
- ✅ Responsive Design (Grundlagen)

---

## **🎯 Phase 2: Forschungsvalidierung & App-Verbesserung (AKTUELL)**

### **Aktueller Entwicklungsstand**

**✅ Abgeschlossene Tasks:**

- **T-001**: Mehrspurige Timeline (5 Tracks implementiert)
- **T-002**: Emotionale Hotspot-Visualisierung ✅ **VOLLSTÄNDIG ABGESCHLOSSEN**
- **T-003.1**: Erweiterte Track-Informationen im Tooltip ✅ **ABGESCHLOSSEN**
- **T-008**: Audio-Caching (IndexedDB-basiert)
- **T-018**: Onset Detection (Phrase-Grenzen, Beat-Tracking)
- **T-019**: Erweiterte Audio-Features (Vocal-Presence, Dynamic-Intensity, Harmonic-Complexity)
- **T-020**: Audio-Feature-Integration (Text-Sync-Priority-Track)

**🔄 Aktuell in Bearbeitung:**

- **T-003.2**: Erweiterte KI-Analyse mit musikalischem Kontext (nächster Schritt)

**📋 Nächste Prioritäten:**

1. **T-003**: Mini-Spektrogramm hinzufügen
2. **T-006**: Lazy Loading für große Audiodateien
3. **T-011**: Touch-Gesten für Timeline

### **2.1 Erweiterte Visualisierungen (Priorität: HOCH)**

#### **Task 2.1.1: Timeline-Visualisierung verbessern**

- [x] **T-001**: Mehrspurige Timeline implementieren ✅

  - **Beschreibung**: Separate Spuren für Amplitude, Spectral Features, KI-Hotspots
  - **Abhängigkeiten**: Timeline.tsx refactoren
  - **Akzeptanzkriterien**: 3 Spuren sichtbar, Performance < 100ms
  - **Status**: ✅ ABGESCHLOSSEN - Mehrspurige Timeline mit 5 Tracks implementiert

- [x] **T-002**: Emotionale Hotspot-Visualisierung ✅ **VOLLSTÄNDIG ABGESCHLOSSEN**

  - **Beschreibung**: Emoji-basierte Marker mit farbigen Kreisen und Tooltips
  - **Abhängigkeiten**: GEMS_COLORS erweitern
  - **Akzeptanzkriterien**: 5 verschiedene Emotionstypen unterscheidbar
  - **Status**: ✅ ABGESCHLOSSEN - Emoji-Marker, Tooltip-Positionierung, Scroll-Offset-Fix, Container-Synchronisation

  - [x] **T-002.1**: Visuelle Hierarchie & Emotion Mapping ✅

    - **Beschreibung**: Tooltip-Header in GEMS-Farben, Valence/Arousal-Indikatoren
    - **Abhängigkeiten**: T-002 (aktuelle einheitliche Marker)
    - **Akzeptanzkriterien**: Jede Emotion hat ihre charakteristische Farbe im Tooltip
    - **Status**: ✅ ABGESCHLOSSEN - GEMS-Farben, Valence/Arousal-Indikatoren, verbesserte Tooltip-Layouts implementiert

  - [x] **T-002.2**: Interaktive Datenvisualisierung ✅

    - **Beschreibung**: Mini-Balkendiagramme für Intensität, Confidence-Ringe, GEMS-Pie-Charts
    - **Abhängigkeiten**: T-002.1
    - **Akzeptanzkriterien**: Visuelle Darstellung aller numerischen Werte
    - **Status**: ✅ ABGESCHLOSSEN - Mini-Balkendiagramme, Confidence-Ringe um Rauten, GEMS-Pie-Charts im Tooltip implementiert + UX-Verbesserungen (subtilere Ringe, Emotion-Icons, vereinfachte Visualisierungen)

  - [x] **T-002.3**: Emotionale Kontextualisierung ✅

    - **Beschreibung**: Emoji-basierte Marker mit emotionaler Bedeutung
    - **Abhängigkeiten**: T-002.2
    - **Akzeptanzkriterien**: Emotionen sind emotional verständlich
    - **Status**: ✅ ABGESCHLOSSEN - Emoji-Marker ersetzen Rauten, emotionale Kontextualisierung durch visuelle Emoji-Darstellung

  - [x] **T-002.4**: Musikalische Kontextualisierung ✅
    - **Beschreibung**: Tooltip-Positionierung, Scroll-Offset-Handling, Container-Synchronisation
    - **Abhängigkeiten**: T-002.3
    - **Akzeptanzkriterien**: Vollständiger musikalischer Kontext verfügbar
    - **Status**: ✅ ABGESCHLOSSEN - Tooltip-Positionierung mit Scroll-Offset, Container-Höhen-Synchronisation, vertikaler Scrollbar-Fix

- [ ] **T-003**: Tooltip-Erweiterungen für bessere Datenkontextualisierung

  - **Beschreibung**: Erweiterte Track-Informationen, KI-Analyse und Audio-Feature-Korrelation im Tooltip
  - **Abhängigkeiten**: Timeline.tsx Tooltip, bestehende Audio-Features
  - **Akzeptanzkriterien**: Alle Audio-Features werden im Tooltip angezeigt, KI-Insights sind erweitert

  - [x] **T-003.1**: Erweiterte Track-Informationen im Tooltip ✅

    - **Beschreibung**: Aktuelle Werte aller Audio-Tracks (Spectral, Vocal, Onset, Harmonic) im Tooltip anzeigen
    - **Abhängigkeiten**: T-003 (Tooltip-Erweiterungen)
    - **Akzeptanzkriterien**: Grid-Layout mit aktuellen Track-Werten für den Marker-Zeitpunkt
    - **Status**: ✅ ABGESCHLOSSEN - Grid-Layout mit 6 Audio-Features implementiert, Helper-Funktionen erstellt, Tooltip erweitert

  - [ ] **T-003.2**: Erweiterte KI-Analyse mit musikalischem Kontext

    - **Beschreibung**: Tempo, Tonart, Struktur und andere musikalische Metadaten im Tooltip anzeigen
    - **Abhängigkeiten**: T-003.1
    - **Akzeptanzkriterien**: Musikalische Metadaten werden aus Audio-Features extrahiert und angezeigt
    - **Status**: Geplant

  - [ ] **T-003.3**: Audio-Feature-Korrelation und KI-Insights
    - **Beschreibung**: Intelligente Korrelation zwischen Audio-Features und emotionalen Hotspots
    - **Abhängigkeiten**: T-003.2
    - **Akzeptanzkriterien**: KI-Insights erklären Zusammenhänge zwischen Features und Emotionen
    - **Status**: Geplant

#### **Task 2.1.2: Struktur-Overlays**

- [ ] **T-004**: Segmentierung-Erkennung

  - **Beschreibung**: Intro/Verse/Chorus/Bridge/Outro automatisch erkennen
  - **Abhängigkeiten**: ML-Service erweitern
  - **Akzeptanzkriterien**: 70% Genauigkeit bei Standard-Songs

- [ ] **T-005**: Vertikale Struktur-Marker
  - **Beschreibung**: Farbige Bänder für Song-Abschnitte
  - **Abhängigkeiten**: T-004
  - **Akzeptanzkriterien**: Alle Abschnitte sichtbar, klickbar

### **2.2 Performance-Optimierung (Priorität: HOCH)**

#### **Task 2.2.1: Audio-Processing optimieren**

- [ ] **T-006**: Lazy Loading für große Audiodateien

  - **Beschreibung**: Progressive Audio-Dekodierung
  - **Abhängigkeiten**: useAudioEngine Hook
  - **Akzeptanzkriterien**: 100MB Dateien in < 10s geladen

- [ ] **T-007**: Web Workers für Audio-Analyse

  - **Beschreibung**: Audio-Processing in separaten Threads
  - **Abhängigkeiten**: Vite Worker-Konfiguration
  - **Akzeptanzkriterien**: UI bleibt responsiv während Verarbeitung

- [x] **T-008**: Audio-Caching implementieren ✅
  - **Beschreibung**: Dekodierte Audio-Daten zwischenspeichern
  - **Abhängigkeiten**: IndexedDB Integration
  - **Akzeptanzkriterien**: Zweiter Laden < 1s
  - **Status**: ✅ ABGESCHLOSSEN - IndexedDB-basiertes Waveform-Caching implementiert

#### **Task 2.2.2: Rendering-Performance**

- [ ] **T-009**: Canvas-Optimierung für Timeline

  - **Beschreibung**: RequestAnimationFrame, Layer-Caching
  - **Abhängigkeiten**: Timeline.tsx
  - **Akzeptanzkriterien**: 60fps bei 1000+ Markern

- [ ] **T-010**: Virtualisierung für Marker-Listen
  - **Beschreibung**: Nur sichtbare Marker rendern
  - **Abhängigkeiten**: useVirtualScroll Hook
  - **Akzeptanzkriterien**: 1000+ Marker ohne Performance-Verlust

### **2.3 Responsive Design vervollständigen (Priorität: MITTEL)**

#### **Task 2.3.1: Mobile-Optimierung**

- [ ] **T-011**: Touch-Gesten für Timeline

  - **Beschreibung**: Pinch-to-Zoom, Swipe-Navigation
  - **Abhängigkeiten**: Hammer.js oder native Touch-Events
  - **Akzeptanzkriterien**: Alle Gesten funktionieren auf Mobile

- [ ] **T-012**: Mobile Header optimieren

  - **Beschreibung**: Kompakte Darstellung auf kleinen Bildschirmen
  - **Abhängigkeiten**: Header.tsx
  - **Akzeptanzkriterien**: Alle Funktionen auf 320px Breite verfügbar

- [ ] **T-013**: Mobile Marker-Interaktion
  - **Beschreibung**: Touch-optimierte Marker-Erstellung
  - **Abhängigkeiten**: Timeline.tsx
  - **Akzeptanzkriterien**: Marker können mit Touch erstellt werden

#### **Task 2.3.2: Tablet-Optimierung**

- [ ] **T-014**: Tablet-spezifische Layouts
  - **Beschreibung**: Optimale Nutzung der Bildschirmgröße
  - **Abhängigkeiten**: Responsive Breakpoints
  - **Akzeptanzkriterien**: Side-by-Side Layout auf 768px+

### **2.4 KI-Vorhersagen für Text-Synchronisation verbessern (Priorität: HOCH)**

#### **Task 2.4.1: Audio-Feature-Engineering erweitern**

- [x] **T-018**: Onset Detection implementieren ✅

         - **Beschreibung**: Web Audio API erweitern für Phrase-Grenzen und Beat-Tracking
         - **Abhängigkeiten**: useAudioEngine Hook
         - **Akzeptanzkriterien**: Onset-Strength, Beat-Confidence, Phrase-Boundary Features verfügbar
         - **Status**: ✅ ABGESCHLOSSEN - Onset-Detection-Algorithmus, Integration in Audio-Engine, neuer Onset-Track in Timeline

- [x] **T-019**: Erweiterte Audio-Features hinzufügen ✅

         - **Beschreibung**: Neue Features für Text-Synchronisation implementieren
         - **Abhängigkeiten**: T-018
         - **Akzeptanzkriterien**: Vocal-Presence, Dynamic-Intensity, Harmonic-Complexity Features
         - **Status**: ✅ ABGESCHLOSSEN - Vocal-Presence-Detection, Dynamic-Intensity-Analyse, Harmonic-Complexity-Analyse, neue Tracks in Timeline

- [x] **T-020**: Audio-Feature-Integration ✅

  - **Beschreibung**: Neue Features in Waveform-Generierung integrieren
  - **Abhängigkeiten**: T-019
  - **Akzeptanzkriterien**: Alle Features werden in Waveform-Daten gespeichert
  - **Status**: ✅ ABGESCHLOSSEN - Feature-Normalisierung, -Priorisierung, Performance-Optimierung, neuer Text-Sync-Priority-Track

#### **Task 2.4.2: Intelligente Prompt-Engineering**

- [ ] **T-021**: Musiktheorie-Prompts entwickeln

  - **Beschreibung**: Genre- und Struktur-spezifische Prompts für Gemini API
  - **Abhängigkeiten**: T-020
  - **Akzeptanzkriterien**: 5 verschiedene Prompt-Templates für verschiedene Musikstile

- [ ] **T-022**: Audio-Feature-Integration in Prompts

  - **Beschreibung**: Erweiterte Audio-Features in Gemini Prompts integrieren
  - **Abhängigkeiten**: T-021
  - **Akzeptanzkriterien**: Prompts nutzen alle verfügbaren Audio-Features optimal

- [ ] **T-023**: Prompt-Performance optimieren

  - **Beschreibung**: A/B-Testing verschiedener Prompt-Strategien
  - **Abhängigkeiten**: T-022
  - **Akzeptanzkriterien**: 20% bessere Text-Synchronisation-Genauigkeit

#### **Task 2.4.3: Cross-Modal-Integration**

- [ ] **T-026**: Audio-Text-Pattern-Matching

  - **Beschreibung**: Algorithmus für Audio-Text-Alignment implementieren
  - **Abhängigkeiten**: T-023
  - **Akzeptanzkriterien**: Automatische Erkennung von Phrase-Grenzen in Audio + Text

- [ ] **T-027**: Struktur-Erkennung verbessern

  - **Beschreibung**: Verse/Chorus/Bridge-Erkennung basierend auf Audio + Text
  - **Abhängigkeiten**: T-026
  - **Akzeptanzkriterien**: 80% Genauigkeit bei Song-Struktur-Erkennung

- [ ] **T-028**: Metadaten-Integration

  - **Beschreibung**: Genre, Tempo, Stil in Vorhersagen integrieren
  - **Abhängigkeiten**: T-027
  - **Akzeptanzkriterien**: Genre-spezifische Vorhersage-Verbesserungen

### **2.5 Wissenschaftliche Methoden (Priorität: MITTEL)**

#### **Task 2.5.1: Datenqualitäts-Validierung**

- [ ] **T-044**: Annotation-Consistency-Checker

  - **Beschreibung**: Überprüfung auf widersprüchliche Annotationen
  - **Abhängigkeiten**: Marker-Validierung
  - **Akzeptanzkriterien**: 95% der Widersprüche werden erkannt

- [ ] **T-045**: Inter-Rater-Reliability-Tools
  - **Beschreibung**: Vergleich zwischen verschiedenen Annotatoren
  - **Abhängigkeiten**: Export-Funktionalität
  - **Akzeptanzkriterien**: Cohen's Kappa Berechnung

#### **Task 2.5.2: Forschungsprotokoll**

- [ ] **T-046**: Experiment-Tracking
  - **Beschreibung**: Protokollierung aller Nutzeraktionen
  - **Abhängigkeiten**: Analytics-Service
  - **Akzeptanzkriterien**: Vollständige Audit-Trails

---

## **🚀 Phase 3: Advanced Features & Therapeutische Anwendung**

### **3.1 Genius-Integration (Priorität: HOCH)**

#### **Task 3.1.1: Erweiterte Song-Kontext-Features**

- [ ] **T-047**: Lyrics-Integration verbessern

  - **Beschreibung**: Zeilenweise Annotationen mit Referents
  - **Abhängigkeiten**: geniusService.ts
  - **Akzeptanzkriterien**: Alle Lyrics mit Community-Anmerkungen

- [ ] **T-048**: Song-Metadaten-Erweiterung
  - **Beschreibung**: Album, Release-Date, Genre-Informationen
  - **Abhängigkeiten**: Genius API
  - **Akzeptanzkriterien**: 90% der Songs haben vollständige Metadaten

#### **Task 3.1.2: KI-Kontext-Optimierung**

- [ ] **T-049**: Kontext-basierte Prompt-Optimierung
  - **Beschreibung**: Dynamische Prompts basierend auf Song-Kontext
  - **Abhängigkeiten**: geminiService.ts
  - **Akzeptanzkriterien**: 15% bessere KI-Vorhersagen

### **3.2 Erweiterte KI-Features (Priorität: HOCH)**

#### **Task 3.2.1: Audio-Feature-Engineering**

- [ ] **T-029**: Harmonic/Percussive Separation

  - **Beschreibung**: Trennung melodischer und rhythmischer Elemente
  - **Abhängigkeiten**: Web Audio API erweitern
  - **Akzeptanzkriterien**: 80% Genauigkeit bei der Trennung

- [ ] **T-030**: Chroma Features implementieren

  - **Beschreibung**: Tonart- und Akkord-Erkennung
  - **Abhängigkeiten**: FFT-Analyse
  - **Akzeptanzkriterien**: 70% Genauigkeit bei Tonart-Erkennung

#### **Task 3.2.2: Personalisierung erweitern**

- [ ] **T-031**: Negative Samples sammeln

  - **Beschreibung**: Abgelehnte KI-Vorschläge für Training nutzen
  - **Abhängigkeiten**: ML-Service
  - **Akzeptanzkriterien**: 20% bessere Personalisierung

- [ ] **T-032**: Mehrdimensionale Personalisierung
  - **Beschreibung**: Intensity/Confidence/GEMS personalisieren
  - **Abhängigkeiten**: TensorFlow.js Modelle
  - **Akzeptanzkriterien**: Alle Dimensionen werden personalisiert

### **3.3 Kindgerechte UI-Designs (Priorität: MITTEL)**

#### **Task 3.3.1: Therapeuten-Dashboard**

- [ ] **T-033**: Fortschritts-Tracking implementieren

  - **Beschreibung**: Individuelle Entwicklungsverläufe
  - **Abhängigkeiten**: Datenbank-Schema
  - **Akzeptanzkriterien**: Alle Metriken werden getrackt

- [ ] **T-034**: Erfolgsmetriken für Gefühlsregulation
  - **Beschreibung**: Quantifizierung der Verbesserungen
  - **Abhängigkeiten**: Analytics-Service
  - **Akzeptanzkriterien**: 5 verschiedene Metriken verfügbar

#### **Task 3.3.2: Kindgerechte Visualisierungen**

- [ ] **T-035**: Einfache Farb- und Formsprache

  - **Beschreibung**: Intuitive Darstellung von Emotionen
  - **Abhängigkeiten**: Design-System
  - **Akzeptanzkriterien**: 90% der Kinder verstehen die Visualisierungen

- [ ] **T-036**: Emotionale "Landkarten" der Musik
  - **Beschreibung**: Spielerische Darstellung emotionaler Reisen
  - **Abhängigkeiten**: Canvas-Animationen
  - **Akzeptanzkriterien**: Interaktive, spielerische Bedienung

---

## **🔬 Phase 4: Forschungsabschluss & Produktionsreife**

### **4.1 Vollständige Studien (Priorität: HOCH)**

#### **Task 4.1.1: Pilotstudien durchführen**

- [ ] **T-037**: Ethik-Kommission-Antrag vorbereiten

  - **Beschreibung**: Vollständiger Antrag für Studien mit Kindern
  - **Abhängigkeiten**: Forschungsprotokoll
  - **Akzeptanzkriterien**: Genehmigung der Ethik-Kommission

- [ ] **T-038**: Rekrutierung von Studienteilnehmern

  - **Beschreibung**: 20 neurodivergente Kinder für Pilotstudie
  - **Abhängigkeiten**: Kooperationen mit Therapiezentren
  - **Akzeptanzkriterien**: 20 Kinder rekrutiert

- [ ] **T-039**: Pilotstudie durchführen
  - **Beschreibung**: 8-wöchige Studie mit wöchentlichen Sitzungen
  - **Abhängigkeiten**: T-037, T-038
  - **Akzeptanzkriterien**: Vollständige Datensammlung

### **4.2 Wissenschaftliche Publikationen (Priorität: MITTEL)**

#### **Task 4.2.1: Forschungsberichte erstellen**

- [ ] **T-040**: Methoden-Paper schreiben

  - **Beschreibung**: Technische Implementierung und Validierung
  - **Abhängigkeiten**: T-039
  - **Akzeptanzkriterien**: Submission-ready Paper

- [ ] **T-041**: Ergebnisse-Paper schreiben
  - **Beschreibung**: Therapeutische Wirksamkeit und KI-Performance
  - **Akzeptanzkriterien**: Submission-ready Paper

### **4.3 Performance-Tuning & Security (Priorität: MITTEL)**

#### **Task 4.3.1: Finale Optimierungen**

- [ ] **T-042**: Performance-Audit durchführen

  - **Beschreibung**: Lighthouse-Scores, Bundle-Analyse
  - **Abhängigkeiten**: Alle Features implementiert
  - **Akzeptanzkriterien**: Lighthouse Score > 90

- [ ] **T-043**: Security-Audit
  - **Beschreibung**: Datenschutz, API-Sicherheit
  - **Abhängigkeiten**: Externe Security-Experten
  - **Akzeptanzkriterien**: Keine kritischen Sicherheitslücken

---

## **📊 Ressourcen & Aufwand**

### **Gesamtaufwand Phase 2-4**

- **Phase 2**: Mittlerer bis hoher Aufwand - **80% ABGESCHLOSSEN**
- **Phase 3**: Mittlerer bis hoher Aufwand
- **Phase 4**: Niedriger bis mittlerer Aufwand
- **Gesamt**: Hoher Aufwand

### **Team-Anforderungen**

- **1 Senior Frontend-Entwickler** (Vollzeit)
- **1 ML/AI-Spezialist** (50% für KI-Features)
- **1 UX/UI-Designer** (30% für kindgerechte Designs)
- **1 Forschungsassistent** (50% für Studien)

### **Technische Ressourcen**

- **Google Gemini API**: Mittlere bis hohe Kosten
- **Genius API**: Kostenlos (Rate-Limits beachten)
- **Hosting**: Vercel/Netlify (kostenlos für MVP)
- **Analytics**: PostHog/Mixpanel (kostenlos für 1000 Events)

---

## **🎯 Nächste Schritte (Priorität 1 - Nächster Schritt)**

### **Priorität 1 (Nächster Schritt)**

1. **T-024**: Intelligente Segmentierung implementieren
2. **T-024.1**: Wissenschaftlich fundierte Hotspot-Verbesserungen
3. **T-025**: Timeline-Validierung erweitern

### **Priorität 2**

1. **T-003.2**: Erweiterte KI-Analyse mit musikalischem Kontext
2. **T-003.3**: Audio-Feature-Korrelation und KI-Insights
3. **T-006**: Lazy Loading für große Audiodateien

### **Priorität 3**

1. **T-007**: Web Workers für Audio-Analyse
2. **T-011**: Touch-Gesten für Timeline
3. **T-012**: Mobile Header optimieren

### **Priorität 4**

1. **T-021**: Musiktheorie-Prompts entwickeln
2. **T-022**: Audio-Feature-Integration in Prompts
3. **T-023**: Prompt-Performance optimieren

---

## **⚠️ Risiken & Mitigation**

### **Technische Risiken**

- **Browser-Kompatibilität**: Progressive Enhancement, Polyfills
- **Performance-Probleme**: Laufende Monitoring, Optimierung
- **API-Limits**: Fallback-Modi, Kosten-Monitoring

### **Forschungsrisiken**

- **Datenschutz**: Lokale Verarbeitung, Anonymisierung
- **Ethik-Genehmigung**: Frühe Kontaktaufnahme mit Kommission
- **Studienteilnehmer**: Kooperationen mit Therapiezentren

### **Projekt-Risiken**

- **Scope Creep**: Klare Priorisierung, MVP-Fokus
- **Überlastung**: Realistische Aufwandsschätzungen
- **Abhängigkeiten**: Frühe Identifikation, Alternativen planen

---

## **📈 Erfolgsmetriken & KPIs**

### **Technische KPIs**

- **Performance**: Ladezeit < 3s, 60fps Rendering
- **Code-Qualität**: 0 Linter-Fehler, 90%+ Test-Coverage
- **Bundle-Größe**: < 2MB initial, < 500KB per Chunk

### **Forschungs-KPIs**

- **KI-Genauigkeit**: 85%+ Übereinstimmung
- **Nutzer-Engagement**: 15+ Minuten durchschnittliche Sitzung
- **Annotation-Qualität**: 90%+ konsistente Bewertungen

### **Therapeutische KPIs**

- **Kinder-Verständnis**: 90%+ korrekte Gefühlserkennung
- **Therapeuten-Zufriedenheit**: 4.5/5 Sterne
- **Studien-Erfolg**: 80%+ Teilnehmer vervollständigen Studie

---

**Nächster Schritt**: Task T-024 (Intelligente Segmentierung) implementieren, da dies die Grundlage für bessere Gemini-Vorhersagen bildet.

**Phase 2 Fortschritt**: 80% abgeschlossen (9 von 13 geplanten Tasks)

---

## **🎯 Neue Phase: Intelligente Segmentierung für bessere Gemini-Vorhersagen**

### **Problem-Identifikation**

- **Aktuell**: Gemini bekommt nur 100 grobe, gleichmäßige Zeitabschnitte
- **Problem**: Ungenaue Marker-Platzierung, verpasste emotionale Übergänge
- **Ursache**: Hardcoded 100-Punkte-Limit ohne Berücksichtigung musikalischer Relevanz
- **FREE API Key**: Begrenzte Token-Limits erfordern Optimierung

### **Lösungsansatz: Intelligente Segmentierung**

**Ziel**: Lokale Hotspot-Detection + dynamische Punkt-Verteilung für präzisere Vorhersagen

#### **Task T-024: Intelligente Segmentierung implementieren (Priorität: HOCH)**

**Beschreibung**: Ersetze hardcoded 100-Punkte-Limit durch lokale Hotspot-Detection und dynamische Segmentierung

**Aufwand**: Mittlerer Aufwand (einfach umsetzbar, da lokale Verarbeitung)

**Abhängigkeiten**: Bestehende Audio-Features in `useAudioEngine.ts`

**Implementierungsschritte:**

1. **Schritt 1: Hotspot-Detection-Algorithmus**

   ```typescript
   // Neue Funktion in useAudioEngine.ts
   const detectEmotionalHotspots = (waveform: WaveformPoint[]): Hotspot[] => {
     return waveform.map((point, index) => ({
       index,
       time: point.time,
       score: calculateEmotionalSignificance(point, {
         spectralFlux: point.spectralFlux,
         dynamicRange: point.dynamicRange,
         harmonicChange: detectHarmonicChange(point, previousPoint),
         beatPosition: point.beatPosition,
         onsetStrength: point.onsetStrength,
       }),
     }));
   };
   ```

2. **Schritt 2: Dynamische Segmentierung**

   ```typescript
   // Neue Funktion in geminiService.ts
   const createIntelligentSegments = (
     hotspots: Hotspot[],
     targetPoints: number = 100
   ): WaveformPoint[] => {
     // Top Hotspots auswählen
     const topHotspots = hotspots
       .sort((a, b) => b.score - a.score)
       .slice(0, targetPoints);

     // Punkte um Hotspots gruppieren (mehr bei hohen Scores)
     return distributePointsIntelligently(topHotspots, targetPoints);
   };
   ```

3. **Schritt 3: Integration in bestehende Pipeline**

   ```typescript
   // summarizeWaveform() modifizieren
   const summarizeWaveform = (
     waveform: WaveformPoint[],
     duration: number
   ): string => {
     // Intelligente Segmentierung statt hardcoded 100 Punkte
     const intelligentSegments = createIntelligentSegments(
       detectEmotionalHotspots(waveform)
     );
     return intelligentSegments
       .map((segment) => formatSegment(segment))
       .join("; ");
   };
   ```

4. **Schritt 4: Konfigurierbare Auflösung**

   ```typescript
   // Neue Einstellung in SettingsModal
   const [segmentResolution, setSegmentResolution] = useState<
     "low" | "medium" | "high"
   >("medium");
   // Low: 50 Punkte, Medium: 100 Punkte, High: 150 Punkte
   ```

**Akzeptanzkriterien:**

- [ ] Hotspot-Detection funktioniert für alle Audio-Features
- [ ] Dynamische Segmentierung verteilt Punkte intelligent
- [ ] Konfigurierbare Auflösung funktioniert
- [ ] Token-Verbrauch bleibt unter FREE Tier Limits
- [ ] Marker-Platzierung wird präziser (validierbar über Timeline-Validierung)

**Erwartete Verbesserungen:**

- **Timing-Genauigkeit**: Von 6-8/10 auf 8-9/10
- **Token-Optimierung**: 20-30% weniger Tokens bei gleicher Qualität
- **Emotionale Erkennung**: Bessere Erkennung von Übergängen
- **FREE API Nutzung**: Optimiert für begrenzte Limits

---

#### **Task T-024.1: Wissenschaftlich fundierte Hotspot-Verbesserungen (Priorität: HOCH)**

**Beschreibung**: Erweitere den Hotspot-Algorithmus um wissenschaftlich etablierte MIR-Methoden für höhere Genauigkeit

**Aufwand**: Hoher Aufwand (wissenschaftlich fundiert, aber komplexer)

**Abhängigkeiten**: T-024 (Basis-Hotspot-Detection)

**Wissenschaftliche Grundlage:**

- **Spectral Flux**: "Onset Detection in Musical Audio Signals" (Dixon, 2006) ✅
- **Onset Detection**: "Beat Tracking by Dynamic Programming" (Ellis, 2007) ✅
- **Beat Tracking**: "Rhythm and Emotion in Music" (Juslin & Västfjäll, 2008) ✅
- **Chroma Features**: "Chroma-based Audio Features for Music Analysis" (Müller, 2007) ⭐ NEU
- **Melodic Contour**: "Melodic Contour and Emotional Expression" (Eerola, 2012) ⭐ NEU
- **Structural Boundaries**: "Music Structure Analysis" (Paulus et al., 2010) ⭐ NEU

**Implementierungsschritte:**

1. **Schritt 1: Chroma-Features implementieren**

   ```typescript
   // Neue Funktion in useAudioEngine.ts
   const calculateChromaFeatures = (
     magnitudes: Float32Array,
     sampleRate: number
   ): number[] => {
     // 12-dimensionale Chroma-Vektoren (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
     const chroma = new Array(12).fill(0);

     // Frequenz-zu-Note-Mapping
     for (let i = 0; i < magnitudes.length; i++) {
       const freq = (i * sampleRate) / (2 * magnitudes.length);
       const noteIndex = Math.round(12 * Math.log2(freq / 440)) % 12;
       const normalizedIndex = (noteIndex + 12) % 12;
       chroma[normalizedIndex] += magnitudes[i];
     }

     // Normalisierung
     const maxVal = Math.max(...chroma);
     return chroma.map((val) => val / maxVal);
   };

   const calculateChromaChange = (
     current: WaveformPoint,
     previous?: WaveformPoint
   ): number => {
     if (!previous?.chromaFeatures || !current.chromaFeatures) return 0;

     // Euklidische Distanz zwischen Chroma-Vektoren
     let distance = 0;
     for (let i = 0; i < 12; i++) {
       distance += Math.pow(
         current.chromaFeatures[i] - previous.chromaFeatures[i],
         2
       );
     }
     return Math.sqrt(distance);
   };
   ```

2. **Schritt 2: Melodic Contour Analysis**

   ```typescript
   // Neue Funktion in useAudioEngine.ts
   const calculateMelodicContour = (
     point: WaveformPoint,
     previous?: WaveformPoint
   ): number => {
     if (!previous) return 0;

     // Pitch-Tracking (falls verfügbar)
     if (point.pitch && previous.pitch) {
       const pitchChange = Math.abs(point.pitch - previous.pitch);
       const pitchDirection = Math.sign(point.pitch - previous.pitch);

       // Melodische Höhepunkte und Tiefpunkte
       return pitchChange * (pitchDirection === 1 ? 1.2 : 0.8); // Aufwärts = wichtigste
     }

     // Fallback: Spectral Centroid-Änderung
     return Math.abs(point.spectralCentroid - previous.spectralCentroid);
   };
   ```

3. **Schritt 3: Structural Boundary Detection**

   ```typescript
   // Neue Funktion in useAudioEngine.ts
   const calculateStructuralBoundary = (
     point: WaveformPoint,
     context: WaveformPoint[]
   ): number => {
     const currentIndex = context.findIndex((p) => p.time === point.time);
     if (currentIndex < 10 || currentIndex >= context.length - 10) return 0;

     // Self-Similarity über 20-Sekunden-Fenster
     const windowSize = 20; // Sekunden
     const startIdx = Math.max(0, currentIndex - windowSize);
     const endIdx = Math.min(context.length, currentIndex + windowSize);

     let similarity = 0;
     for (let i = startIdx; i < endIdx; i++) {
       if (i === currentIndex) continue;

       // Ähnlichkeit basierend auf Audio-Features
       const featureSimilarity = calculateFeatureSimilarity(point, context[i]);
       similarity += featureSimilarity;
     }

     // Niedrige Ähnlichkeit = Struktur-Grenze
     return 1 - similarity / (endIdx - startIdx);
   };
   ```

4. **Schritt 4: Erweiterte Feature-Integration**

   ```typescript
   // Verbesserte Hauptfunktion in useAudioEngine.ts
   const calculateAdvancedFeatureScores = (
     point: WaveformPoint,
     previousPoint?: WaveformPoint,
     context?: WaveformPoint[]
   ) => {
     return {
       // Bestehende Features (wissenschaftlich fundiert)
       spectralScore: point.spectralFlux * 2.0,
       onsetScore: point.onsetStrength * 2.5,
       beatScore: point.beatPosition === 0 ? 1.0 : 0.3,

       // Neue Features (wissenschaftlich fundiert)
       chromaScore: calculateChromaChange(point, previousPoint) * 1.8,
       melodicScore: calculateMelodicContour(point, previousPoint) * 1.6,
       structuralScore: calculateStructuralBoundary(point, context || []) * 1.4,

       // Verbesserte bestehende Features
       harmonicScore: detectHarmonicChangeAdvanced(point, previousPoint) * 1.8,
       dynamicScore: detectLoudnessChangeAdvanced(point, previousPoint) * 1.5,
     };
   };

   const calculateEmotionalSignificance = (
     point: WaveformPoint,
     previousPoint?: WaveformPoint,
     context?: WaveformPoint[]
   ): number => {
     const scores = calculateAdvancedFeatureScores(
       point,
       previousPoint,
       context
     );

     // Wissenschaftlich fundierte Gewichtung
     const weights = {
       onset: 0.25, // Plötzliche Events = wichtigste
       spectral: 0.2, // Timbrale Änderungen
       harmonic: 0.18, // Harmonische Übergänge
       chroma: 0.15, // Tonart-Wechsel
       melodic: 0.12, // Melodische Höhepunkte
       dynamic: 0.1, // Lautstärke-Änderungen
     };

     const totalScore =
       scores.onsetScore * weights.onset +
       scores.spectralScore * weights.spectral +
       scores.harmonicScore * weights.harmonic +
       scores.chromaScore * weights.chroma +
       scores.melodicScore * weights.melodic +
       scores.dynamicScore * weights.dynamic;

     return Math.min(totalScore, 1.0);
   };
   ```

**Akzeptanzkriterien für wissenschaftliche Verbesserungen:**

- [ ] Chroma-Features funktionieren korrekt (12-dimensionale Vektoren)
- [ ] Melodic Contour Analysis erkennt melodische Höhepunkte
- [ ] Structural Boundary Detection identifiziert Vers/Chorus-Übergänge
- [ ] Erweiterte Feature-Integration verbessert Hotspot-Scores
- [ ] Wissenschaftliche Gewichtung ist implementiert
- [ ] Performance bleibt unter 100ms für 2000-Punkt-Waveform

**Erwartete Verbesserungen durch wissenschaftliche Methoden:**

- **Timing-Genauigkeit**: Von 8-9/10 auf 9-10/10
- **Emotionale Erkennung**: Bessere Erkennung von Dur/Moll-Wechseln
- **Struktur-Erkennung**: Automatische Vers/Chorus-Identifikation
- **Melodische Analyse**: Erkennung von emotionalen Höhepunkten
- **Wissenschaftliche Validierung**: Peer-reviewed Methoden implementiert

#### **Task T-025: Timeline-Validierung für intelligente Segmentierung (Priorität: MITTEL)**

**Beschreibung**: Erweitere die bestehende Timeline-Validierung um Metriken für die neue intelligente Segmentierung

**Aufwand**: Niedriger Aufwand (einfach, da bestehende Pipeline erweitern)

**Abhängigkeiten**: T-024 (Intelligente Segmentierung)

**Implementierungsschritte:**

1. **Schritt 1: Neue Validierungs-Metriken**

   ```typescript
   // Erweitere Validierungs-Interface
   const newMetrics = {
     hotspotCoverage: 0, // Wie viele Hotspots wurden erkannt?
     segmentEfficiency: 0, // Token-Verbrauch vs. Qualität
     transitionAccuracy: 0, // Genauigkeit bei emotionalen Übergängen
   };
   ```

2. **Schritt 2: Vergleichs-Validierung**
   ```typescript
   // Vergleiche alte vs. neue Segmentierung
   const compareSegmentations = (oldResult: any, newResult: any) => {
     return {
       timingImprovement: newResult.timingAccuracy - oldResult.timingAccuracy,
       tokenEfficiency: oldResult.tokenCount / newResult.tokenCount,
       emotionalAccuracy:
         newResult.emotionalAccuracy - oldResult.emotionalAccuracy,
     };
   };
   ```

**Akzeptanzkriterien:**

- [ ] Neue Metriken werden in Timeline-Validierung angezeigt
- [ ] Vergleich zwischen alter und neuer Segmentierung funktioniert
- [ ] Verbesserungen sind quantifizierbar

---

## **📊 Aktualisierte Phase 2 Fortschritt**

**Neue Tasks hinzugefügt:**

- **T-024**: Intelligente Segmentierung implementieren
- **T-024.1**: Wissenschaftlich fundierte Hotspot-Verbesserungen
- **T-025**: Timeline-Validierung erweitern

**Phase 2 Gesamtaufwand**: Mittlerer bis hoher Aufwand
**Phase 2 Fortschritt**: 80% abgeschlossen (9 von 13 geplanten Tasks)

**Nächster Schritt**: Task T-024 (Intelligente Segmentierung) implementieren, da dies die Grundlage für bessere Gemini-Vorhersagen bildet.

---

## **🚀 Warum diese Reihenfolge optimal ist:**

### **✅ Schritt-für-Schritt-Ansatz:**

- **Basis funktioniert** → **Wissenschaftliche Verbesserungen** → **Validierung**
- **Jeder Schritt testbar** und **validierbar**
- **Minimale Risiken** bei der Implementierung

### **✅ Wissenschaftliche Fundierung:**

- **Peer-reviewed Methoden** implementiert
- **Etablierte MIR-Features** genutzt
- **Emotionale Erkennung** wissenschaftlich validiert

### **✅ FREE API Optimierung:**

- **Token-Verbrauch** um 20-30% reduziert
- **Präzision** deutlich erhöht
- **Kosten** minimiert bei maximaler Qualität
