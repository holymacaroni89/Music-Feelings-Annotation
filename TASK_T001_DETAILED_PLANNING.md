# **Task T-001: Mehrspurige Timeline - Detaillierte Planung**

## **Granulare Sub-Task-Aufteilung für ausführbare Entwicklung**

---

## **🎯 Übersicht Task T-001**

**Beschreibung**: Separate Spuren für Amplitude, Spectral Features, KI-Hotspots implementieren  
**Aufwand**: 3-4 Tage  
**Priorität**: HOCH  
**Abhängigkeiten**: Timeline.tsx refactoren

---

## **🔍 Aktuelle Codebase-Analyse**

### **Bestehende Struktur**

- **Timeline.tsx**: 875 Zeilen, komplexe Interaktionslogik
- **useAudioEngine.ts**: Bereits erweiterte Audio-Features (Spectral, Harmonic, Onset)
- **Canvas-Rendering**: Aktuell nur eine Spur (Marker + Suggestions)
- **Audio-Features**: Bereits berechnet in `generateAdvancedWaveformData()`

### **Verfügbare Audio-Features (bereits implementiert)**

- ✅ Spectral Centroid (Frequenz-Schwerpunkt)
- ✅ Spectral Flux (Spektrale Änderungen)
- ✅ Harmonic Ratio (Harmonische Verhältnisse)
- ✅ Loudness (Lautstärke)
- ✅ Sharpness (Schärfe)
- ✅ Roughness (Rauheit)
- ✅ Onset Detection (Strukturelle Momente)

---

## **📋 Granulare Sub-Task-Aufteilung**

### **Phase 1: Architektur & Datenstrukturen (Tag 1)**

#### **T-001.1: Multi-Track Data Model definieren**

- **Aufwand**: 0.5 Tage
- **Beschreibung**: Neue Typen für Multi-Track-Daten definieren
- **Code-Location**: `src/types/index.ts`
- **Details**:

  ```typescript
  interface TrackData {
    id: string;
    type: "amplitude" | "spectral" | "ki-hotspots";
    data: Float32Array | number[];
    color: string;
    height: number;
    visible: boolean;
  }

  interface MultiTrackTimeline {
    tracks: TrackData[];
    trackHeight: number;
    trackSpacing: number;
  }
  ```

#### **T-001.2: Timeline-Props erweitern**

- **Aufwand**: 0.5 Tage
- **Beschreibung**: Timeline-Komponente für Multi-Track vorbereiten
- **Code-Location**: `src/components/Timeline.tsx`
- **Details**:
  - Neue Props: `tracks: TrackData[]`, `trackHeight: number`
  - Canvas-Höhe anpassen: `height = tracks.length * trackHeight`
  - Zoom-Logik für Y-Achse erweitern

#### **T-001.3: Audio-Feature-Integration vorbereiten**

- **Aufwand**: 0.5 Tage
- **Beschreibung**: Bestehende Audio-Features für Timeline-Format konvertieren
- **Code-Location**: `src/hooks/useAudioEngine.ts`
- **Details**:
  - `generateAdvancedWaveformData()` erweitern für Multi-Track-Output
  - Feature-Normalisierung für Visualisierung
  - Performance-Optimierung für große Datensätze

### **Phase 2: Canvas-Rendering-Engine (Tag 2)**

#### **T-001.4: Multi-Track Canvas-Rendering implementieren**

- **Aufwand**: 1 Tag
- **Beschreibung**: Canvas-Rendering für mehrere Spuren implementieren
- **Code-Location**: `src/components/Timeline.tsx`
- **Details**:
  ```typescript
  const renderMultiTrackCanvas = useCallback(() => {
    if (!canvasRef.current || !tracks) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Render each track
    tracks.forEach((track, trackIndex) => {
      const yOffset = trackIndex * trackHeight;
      renderTrack(ctx, track, yOffset, zoom);
    });
  }, [tracks, trackHeight, zoom]);
  ```

#### **T-001.5: Track-spezifische Renderer implementieren**

- **Aufwand**: 0.5 Tage
- **Beschreibung**: Verschiedene Renderer für verschiedene Track-Typen
- **Code-Location**: `src/components/Timeline.tsx`
- **Details**:
  - **Amplitude-Track**: Waveform-Linie mit Füllung
  - **Spectral-Track**: Heatmap/Color-Mapping
  - **KI-Hotspots-Track**: Intensitäts-basierte Visualisierung

#### **T-001.6: Performance-Optimierung implementieren**

- **Aufwand**: 0.5 Tage
- **Beschreibung**: RequestAnimationFrame und Layer-Caching
- **Code-Location**: `src/components/Timeline.tsx`
- **Details**:
  - `useCallback` für Render-Funktionen
  - `useMemo` für berechnete Werte
  - Canvas-Layer für statische Inhalte

### **Phase 3: Interaktive Features (Tag 3)**

#### **T-001.7: Multi-Track Interaktion implementieren**

- **Aufwand**: 0.5 Tage
- **Beschreibung**: Hover, Click und Drag für alle Spuren
- **Code-Location**: `src/components/Timeline.tsx`
- **Details**:
  ```typescript
  const handleMultiTrackMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { clientX, clientY } = e;
      const time = getTimeFromX(clientX);
      const trackIndex = Math.floor(clientY / trackHeight);

      // Track-spezifische Hover-Logik
      if (tracks[trackIndex]) {
        const track = tracks[trackIndex];
        handleTrackHover(track, time, trackIndex);
      }
    },
    [tracks, trackHeight, getTimeFromX]
  );
  ```

#### **T-001.8: Track-spezifische Tooltips implementieren**

- **Aufwand**: 0.5 Tage
- **Beschreibung**: Kontextuelle Tooltips für jede Spur
- **Code-Location**: `src/components/Timeline.tsx`
- **Details**:
  - **Amplitude**: dB-Werte, Peak-Informationen
  - **Spectral**: Frequenz-Bereiche, Dominante Features
  - **KI-Hotspots**: Emotion-Intensität, Confidence-Scores

#### **T-001.9: Zoom & Pan für Y-Achse implementieren**

- **Aufwand**: 0.5 Tage
- **Beschreibung**: Vertikaler Zoom und Pan für Track-Details
- **Code-Location**: `src/components/Timeline.tsx`
- **Details**:
  - Pinch-to-Zoom für Y-Achse
  - Track-spezifische Zoom-Faktoren
  - Smooth Zoom-Animationen

### **Phase 4: Integration & Testing (Tag 4)**

#### **T-001.10: App-Integration vervollständigen**

- **Aufwand**: 0.5 Tage
- **Beschreibung**: Timeline in Workspace und App integrieren
- **Code-Location**: `src/App.tsx`, `src/components/Workspace.tsx`
- **Details**:
  - Neue Props durchreichen
  - Track-Konfiguration in Settings
  - Default-Track-Layout definieren

#### **T-001.11: Performance-Tests durchführen**

- **Aufwand**: 0.5 Tage
- **Beschreibung**: Performance-Metriken validieren
- **Code-Location**: Browser DevTools, Performance-Profiling
- **Details**:
  - 60fps bei 1000+ Markern
  - Memory-Usage überwachen
  - CPU-Usage bei großen Audiodateien

#### **T-001.12: Bugfixes & Finalisierung**

- **Aufwand**: 0.5 Tage
- **Beschreibung**: Letzte Anpassungen und Cleanup
- **Code-Location**: Alle betroffenen Dateien
- **Details**:
  - Linter-Fehler beheben
  - TypeScript-Typen vervollständigen
  - Console-Logs entfernen

---

## **🛠️ Technische Implementierungsdetails**

### **Canvas-Optimierung**

```typescript
// Layer-basiertes Rendering
const renderLayer = useCallback(
  (layer: "background" | "tracks" | "markers" | "overlay") => {
    switch (layer) {
      case "background":
        renderBackgroundGrid();
        break;
      case "tracks":
        renderAllTracks();
        break;
      case "markers":
        renderMarkers();
        break;
      case "overlay":
        renderCurrentTimeIndicator();
        break;
    }
  },
  []
);
```

### **Audio-Feature-Mapping**

```typescript
// Feature zu Track-Mapping
const mapAudioFeaturesToTracks = (waveform: WaveformPoint[]): TrackData[] => {
  return [
    {
      id: "amplitude",
      type: "amplitude",
      data: waveform.map((p) => p.amplitude),
      color: "#3B82F6",
      height: 80,
      visible: true,
    },
    {
      id: "spectral",
      type: "spectral",
      data: waveform.map((p) => p.spectralCentroid),
      color: "#10B981",
      height: 80,
      visible: true,
    },
    {
      id: "ki-hotspots",
      type: "ki-hotspots",
      data: waveform.map((p) => p.emotionIntensity || 0),
      color: "#F59E0B",
      height: 80,
      visible: true,
    },
  ];
};
```

### **Performance-Monitoring**

```typescript
// Performance-Metriken
const usePerformanceMonitor = () => {
  const [fps, setFps] = useState(0);
  const [renderTime, setRenderTime] = useState(0);

  const measureRenderTime = useCallback((renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    setRenderTime(end - start);
  }, []);

  return { fps, renderTime, measureRenderTime };
};
```

---

## **📊 Akzeptanzkriterien & Validierung**

### **Funktionale Anforderungen**

- [ ] **3 Spuren sichtbar**: Amplitude, Spectral, KI-Hotspots
- [ ] **Track-Interaktion**: Hover, Click, Drag funktioniert
- [ ] **Performance**: < 100ms Rendering-Zeit
- [ ] **Responsive**: Funktioniert auf verschiedenen Bildschirmgrößen

### **Technische Anforderungen**

- [ ] **60fps Rendering**: Bei 1000+ Markern
- [ ] **Memory-Effizienz**: < 100MB für 10min Audio
- [ ] **TypeScript**: 0 Linter-Fehler
- [ ] **Accessibility**: Screen-Reader kompatibel

### **Qualitätsanforderungen**

- [ ] **Code-Coverage**: 90%+ für neue Funktionen
- [ ] **Performance**: Lighthouse Score > 90
- **Bundle-Größe**: < 50KB zusätzlich

---

## **⚠️ Risiken & Mitigation**

### **Technische Risiken**

- **Canvas-Performance**: Layer-Caching, RequestAnimationFrame
- **Memory-Leaks**: Proper Cleanup in useEffect
- **Browser-Kompatibilität**: Progressive Enhancement

### **Komplexitätsrisiken**

- **Code-Duplikation**: Gemeinsame Renderer-Funktionen
- **State-Management**: Lokaler State vs. Global State
- **Event-Handling**: Komplexe Interaktionslogik

### **Mitigation-Strategien**

- **Inkrementelle Entwicklung**: Eine Spur nach der anderen
- **Performance-Monitoring**: Kontinuierliche Metriken
- **Code-Reviews**: Regelmäßige Qualitätsprüfung

---

## **🎯 Nächste Schritte nach T-001**

### **Sofort nach Abschluss**

1. **T-002**: Emotionale Hotspot-Visualisierung (2-3 Tage)
2. **T-006**: Lazy Loading für große Audiodateien (3-4 Tage)
3. **T-011**: Touch-Gesten für Timeline (4-5 Tage)

### **Abhängigkeiten für andere Tasks**

- **T-002**: Nutzt neue Multi-Track-Architektur
- **T-003**: Mini-Spektrogramm kann als neue Spur integriert werden
- **T-009**: Canvas-Optimierung ist bereits in T-001 implementiert

---

## **📈 Erfolgsmetriken**

### **Quantitativ**

- **Rendering-Performance**: < 100ms für 3 Spuren
- **Memory-Usage**: < 100MB für 10min Audio
- **Bundle-Größe**: < 50KB zusätzlich
- **FPS**: Konsistent 60fps

### **Qualitativ**

- **Benutzerfreundlichkeit**: Intuitive Multi-Track-Navigation
- **Visuelle Qualität**: Klare Unterscheidung der Spuren
- **Interaktivität**: Responsive Hover und Click-Events
- **Performance**: Keine spürbaren Verzögerungen

---

**Nächster Schritt**: Mit T-001.1 (Multi-Track Data Model) beginnen und die neue Architektur schrittweise implementieren.
