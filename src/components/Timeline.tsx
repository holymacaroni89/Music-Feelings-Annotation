import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import {
  Marker,
  WaveformPoint,
  MerSuggestion,
  GEMS,
  ColorPalette,
  TrackData,
  TrackRenderConfig,
} from "../types";
import {
  useFloating,
  FloatingPortal,
  offset,
  shift,
  flip,
  autoUpdate,
} from "@floating-ui/react";
import {
  EMOTION_VISUAL_CONFIGS,
  getIntensityColor,
  getConfidenceAlpha,
} from "../constants";

interface TimelineProps {
  duration: number;
  currentTime: number;
  markers: Marker[];
  waveform: WaveformPoint[] | null;
  suggestions: MerSuggestion[];
  selectedMarkerId: string | null;
  zoom: number; // pixels per second
  pendingMarkerStart: number | null; // New prop for pending marker
  colorPalette: ColorPalette;
  // Neue Multi-Track Props
  tracks?: TrackData[];
  trackHeight?: number;
  trackSpacing?: number;
  trackRenderConfig?: TrackRenderConfig;
  // Lyrics-Zwischenspeicher Status
  hasLyricsContext?: boolean;
  lyricsContextLength?: number;
  onLyricsStatusClick?: () => void;
  onScrub: (time: number) => void;
  onMarkerSelect: (markerId: string | null) => void;
  onMarkerMove: (
    markerId: string,
    newStartTime: number,
    newEndTime: number
  ) => void;
  onSuggestionClick: (suggestion: MerSuggestion) => void;
  onZoom: (direction: "in" | "out") => void;
  // Neue Multi-Track Event Handler
  onTrackClick?: (trackId: string, time: number, trackIndex: number) => void;
  onTrackHover?: (trackId: string, time: number, trackIndex: number) => void;
  onTrackVisibilityChange?: (trackId: string, visible: boolean) => void;
}

// SuggestionTooltip Component with proper Floating UI implementation
const SuggestionTooltip: React.FC<{
  suggestion: MerSuggestion;
  x: number;
  y: number;
  onSuggestionClick: (suggestion: MerSuggestion) => void;
}> = ({ suggestion, x, y, onSuggestionClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    placement: "top",
    middleware: [offset(8), shift({ padding: 8 }), flip()],
    whileElementsMounted: autoUpdate,
  });

  // Vereinfachte Hover-Logik
  const handleMouseEnter = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Diamond Trigger */}
      <div
        ref={refs.setReference}
        className="absolute w-3 h-3 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
        onClick={() => onSuggestionClick(suggestion)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="w-3 h-3 bg-yellow-300 border border-yellow-900 transform rotate-45"
          style={{
            boxShadow: "0 0 4px rgba(210, 153, 34, 0.5)",
          }}
        />
      </div>

      {/* Floating Tooltip */}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-50 p-3 text-xs text-white bg-gray-800 border border-gray-600 rounded-lg shadow-xl pointer-events-none max-w-[280px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  suggestion.gems === GEMS.Wonder
                    ? "bg-purple-400"
                    : suggestion.gems === GEMS.Transcendence
                    ? "bg-blue-400"
                    : suggestion.gems === GEMS.Tenderness
                    ? "bg-pink-300"
                    : suggestion.gems === GEMS.Nostalgia
                    ? "bg-yellow-400"
                    : suggestion.gems === GEMS.Peacefulness
                    ? "bg-green-400"
                    : suggestion.gems === GEMS.Power
                    ? "bg-red-500"
                    : suggestion.gems === GEMS.JoyfulActivation
                    ? "bg-yellow-300"
                    : suggestion.gems === GEMS.Tension
                    ? "bg-orange-500"
                    : suggestion.gems === GEMS.Sadness
                    ? "bg-gray-500"
                    : "bg-gray-500"
                }`}
              />
              <span className="font-bold text-gray-100">
                {suggestion.gems || "Suggestion"}
              </span>
              <span className="text-gray-400 font-mono ml-auto">
                @{suggestion.time.toFixed(1)}s
              </span>
            </div>
            <div className="space-y-2 text-gray-300">
              {suggestion.sync_notes && (
                <div>
                  <span className="font-semibold text-gray-400 mr-1">
                    Sync:
                  </span>
                  <span className="text-sm">{suggestion.sync_notes}</span>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-400 mr-1">Audio:</span>
                <span className="text-sm">{suggestion.reason}</span>
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  markers,
  waveform,
  suggestions,
  selectedMarkerId,
  zoom,
  pendingMarkerStart,
  colorPalette,
  // Neue Multi-Track Props
  tracks = [],
  trackHeight = 80,
  trackSpacing = 4,
  trackRenderConfig,
  // Lyrics-Zwischenspeicher Status
  hasLyricsContext = false,
  lyricsContextLength = 0,
  onLyricsStatusClick,
  onScrub,
  onMarkerSelect,
  onMarkerMove,
  onSuggestionClick,
  onZoom,
  // Neue Multi-Track Event Handler
  onTrackClick,
  onTrackHover,
  onTrackVisibilityChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // This is the inner, full-width div
  const scrollerRef = useRef<HTMLDivElement>(null); // This is the outer, scrolling div
  const [mouseTime, setMouseTime] = useState<number | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  const [closestSuggestion, setClosestSuggestion] =
    useState<MerSuggestion | null>(null);

  // Ref für vorherigen closestSuggestion (Debug)
  const prevClosestSuggestion = useRef<MerSuggestion | null>(null);

  // Neue Multi-Track States
  const [trackZoomY, setTrackZoomY] = useState(1);
  const [trackPanY, setTrackPanY] = useState(0);

  // Multi-Track Konstanten
  const defaultTrackRenderConfig: TrackRenderConfig = {
    showGrid: true,
    showLabels: true,
    showValues: false,
    interpolation: "smooth",
    fillStyle: "gradient",
    ...trackRenderConfig,
  };

  // Berechne Gesamthöhe für Multi-Track
  const totalTrackHeight =
    tracks.length > 0
      ? tracks.length * trackHeight + (tracks.length - 1) * trackSpacing
      : 0;

  const canvasHeight = Math.max(200, totalTrackHeight); // Mindesthöhe 200px

  const interactionState = useRef<{
    isDragging: boolean;
    draggedMarkerId: string | null;
    draggedHandle: "start" | "end" | "body" | null;
    dragOffset: number;
    touchStartPos: { x: number; y: number; time: number } | null;
    hasMoved: boolean;
    isSwipeGesture: boolean;
    swipeStartX: number;
    longPressTimer: NodeJS.Timeout | null;
    dragStartX: number | null;
  }>({
    isDragging: false,
    draggedMarkerId: null,
    draggedHandle: null,
    dragOffset: 0,
    touchStartPos: null,
    hasMoved: false,
    isSwipeGesture: false,
    swipeStartX: 0,
    longPressTimer: null,
    dragStartX: null,
  });

  const getXFromTime = useCallback((time: number) => time * zoom, [zoom]);
  const getTimeFromX = useCallback((x: number) => x / zoom, [zoom]);

  // Neue Multi-Track Hilfsfunktionen
  const mapAudioFeaturesToTracks = useCallback(
    (waveform: WaveformPoint[]): TrackData[] => {
      if (!waveform || waveform.length === 0) return [];

      // Erstelle Standard-Tracks basierend auf verfügbaren Audio-Features
      const defaultTracks: TrackData[] = [
        {
          id: "amplitude",
          type: "amplitude",
          name: "Amplitude",
          data: waveform.map((p) => p.amplitude || p.amp || 0),
          color: "#3B82F6",
          height: trackHeight,
          visible: true,
          opacity: 0.8,
          order: 0,
          metadata: {
            unit: "dB",
            minValue: 0,
            maxValue: 1,
            description: "Audio amplitude over time",
          },
        },
        {
          id: "spectral",
          type: "spectral",
          name: "Spectral Features",
          data: waveform.map((p) => p.spectralCentroid || 0),
          color: "#10B981",
          height: trackHeight,
          visible: true,
          opacity: 0.8,
          order: 1,
          metadata: {
            unit: "Hz",
            minValue: 0,
            maxValue: 1,
            description: "Spectral centroid (brightness)",
          },
        },
      ];

      // Füge KI-Hotspots hinzu, falls verfügbar
      if (waveform.some((p) => p.emotionIntensity !== undefined)) {
        defaultTracks.push({
          id: "ki-hotspots",
          type: "ki-hotspots",
          name: "KI Emotions",
          data: waveform.map((p) => p.emotionIntensity || 0),
          color: "#F59E0B",
          height: trackHeight,
          visible: true,
          opacity: 0.9,
          order: 2,
          metadata: {
            unit: "intensity",
            minValue: 0,
            maxValue: 1,
            description: "AI emotion intensity predictions",
          },
        });
      }

      // Füge Struktur-Track hinzu, falls verfügbar
      if (waveform.some((p) => p.structuralSegment)) {
        defaultTracks.push({
          id: "structure",
          type: "structure",
          name: "Song Structure",
          data: waveform.map((p) => {
            const segment = p.structuralSegment;
            if (segment === "intro") return 0.1;
            if (segment === "verse") return 0.3;
            if (segment === "chorus") return 0.5;
            if (segment === "bridge") return 0.7;
            if (segment === "outro") return 0.9;
            return 0;
          }),
          color: "#8B5CF6",
          height: trackHeight,
          visible: true,
          opacity: 0.7,
          order: 3,
          metadata: {
            unit: "segment",
            minValue: 0,
            maxValue: 1,
            description: "Song structure segments",
          },
        });
      }

      // Füge Onset-Track hinzu für Text-Synchronisation
      if (waveform.some((p) => p.onsetStrength !== undefined)) {
        defaultTracks.push({
          id: "onsets",
          type: "onsets",
          name: "Musical Onsets",
          data: waveform.map((p) => p.onsetStrength || 0),
          color: "#EF4444",
          height: trackHeight,
          visible: true,
          opacity: 0.9,
          order: 4,
          metadata: {
            unit: "strength",
            minValue: 0,
            maxValue: 1,
            description: "Musical onset detection for text synchronization",
          },
        });
      }

      // Füge Vocal-Presence-Track hinzu
      if (waveform.some((p) => p.vocalProbability !== undefined)) {
        defaultTracks.push({
          id: "vocal-presence",
          type: "custom",
          name: "Vocal Presence",
          data: waveform.map((p) => p.vocalProbability || 0),
          color: "#EC4899",
          height: trackHeight,
          visible: true,
          opacity: 0.8,
          order: 5,
          metadata: {
            unit: "probability",
            minValue: 0,
            maxValue: 1,
            description: "Vocal presence detection for lyrics synchronization",
          },
        });
      }

      // Füge Dynamic-Intensity-Track hinzu
      if (waveform.some((p) => p.localDynamics !== undefined)) {
        defaultTracks.push({
          id: "dynamic-intensity",
          type: "custom",
          name: "Dynamic Intensity",
          data: waveform.map((p) => p.localDynamics || 0),
          color: "#8B5CF6",
          height: trackHeight,
          visible: true,
          opacity: 0.8,
          order: 6,
          metadata: {
            unit: "intensity",
            minValue: 0,
            maxValue: 1,
            description: "Dynamic intensity changes for emotional analysis",
          },
        });
      }

      // Füge Harmonic-Complexity-Track hinzu
      if (waveform.some((p) => p.harmonicRichness !== undefined)) {
        defaultTracks.push({
          id: "harmonic-complexity",
          type: "custom",
          name: "Harmonic Complexity",
          data: waveform.map((p) => p.harmonicRichness || 0),
          color: "#06B6D4",
          height: trackHeight,
          visible: true,
          opacity: 0.8,
          order: 7,
          metadata: {
            unit: "complexity",
            minValue: 0,
            maxValue: 1,
            description: "Harmonic complexity for musical structure analysis",
          },
        });
      }

      // Füge Feature-Priority-Track hinzu (Text-Sync-Priorität)
      if (
        waveform.some(
          (p) =>
            p.onsetStrength !== undefined && p.vocalProbability !== undefined
        )
      ) {
        defaultTracks.push({
          id: "feature-priority",
          type: "custom",
          name: "Text-Sync Priority",
          data: waveform.map((p) => {
            // Berechne Text-Sync-Priorität basierend auf Onset + Vocal
            const onsetPriority = (p.onsetStrength || 0) * 0.6;
            const vocalPriority = (p.vocalProbability || 0) * 0.4;
            return Math.min(1.0, onsetPriority + vocalPriority);
          }),
          color: "#F97316",
          height: trackHeight,
          visible: true,
          opacity: 0.9,
          order: 8,
          metadata: {
            unit: "priority",
            minValue: 0,
            maxValue: 1,
            description:
              "Text synchronization priority based on onset + vocal features",
          },
        });
      }

      return defaultTracks;
    },
    [trackHeight]
  );

  // Generiere Tracks aus Waveform, falls keine explizit übergeben wurden
  const effectiveTracks = useMemo(() => {
    if (tracks.length > 0) return tracks;
    if (waveform) return mapAudioFeaturesToTracks(waveform);
    return [];
  }, [tracks, waveform, mapAudioFeaturesToTracks]);

  // Aktualisiere Canvas-Höhe basierend auf effektiven Tracks
  useEffect(() => {
    const newTotalHeight =
      effectiveTracks.length > 0
        ? effectiveTracks.length * trackHeight +
          (effectiveTracks.length - 1) * trackSpacing
        : 200;

    if (canvasRef.current) {
      canvasRef.current.height = newTotalHeight;
    }
  }, [effectiveTracks, trackHeight, trackSpacing]);

  // Neue Hotspot-Rendering-Funktionen für T-002 (vor renderMultiTrackCanvas)
  // Hilfsfunktion für Hotspot-Größe
  const getHotspotSize = useCallback(
    (intensity: number, baseSize: number = 16): number => {
      const intensityMultiplier = 0.5 + intensity * 0.5;
      return baseSize * intensityMultiplier;
    },
    []
  );

  const renderEmotionalHotspot = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      emotion: GEMS,
      intensity: number,
      confidence: number,
      size: number
    ) => {
      const config = EMOTION_VISUAL_CONFIGS[emotion];
      if (!config) return;

      const alpha = getConfidenceAlpha(confidence);
      const color = getIntensityColor(config.intensityGradient, intensity);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;

      // Raute zeichnen (Diamond)
      const halfSize = size / 2;
      ctx.beginPath();
      ctx.moveTo(x, y - halfSize); // Oben
      ctx.lineTo(x + halfSize, y); // Rechts
      ctx.lineTo(x, y + halfSize); // Unten
      ctx.lineTo(x - halfSize, y); // Links
      ctx.closePath();
      ctx.fill();

      // Intensitäts-Ring für hohe Intensität
      if (intensity > 0.7) {
        ctx.strokeStyle = config.baseColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Confidence-Indikator (kleiner innerer Ring)
      if (confidence > 0.8) {
        ctx.strokeStyle = config.hoverColor;
        ctx.lineWidth = 1;
        const innerSize = size * 0.6;
        const innerHalfSize = innerSize / 2;
        ctx.beginPath();
        ctx.moveTo(x, y - innerHalfSize);
        ctx.lineTo(x + innerHalfSize, y);
        ctx.lineTo(x, y + innerHalfSize);
        ctx.lineTo(x - innerHalfSize, y);
        ctx.closePath();
        ctx.stroke();
      }

      ctx.restore();
    },
    []
  );

  const renderEmotionalHotspots = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      suggestions: MerSuggestion[],
      zoom: number,
      canvasHeight: number
    ) => {
      if (!suggestions || suggestions.length === 0) return;

      suggestions.forEach((suggestion) => {
        const x = getXFromTime(suggestion.time);
        const y = canvasHeight / 2; // Zentriert

        // Bestimme dominante Emotion aus GEMS
        const dominantEmotion = suggestion.gems || GEMS.JoyfulActivation;
        const intensity = suggestion.intensity / 100; // Konvertiere 0-100 zu 0-1
        const confidence = suggestion.confidence || 0.8;

        renderEmotionalHotspot(
          ctx,
          x,
          y,
          dominantEmotion,
          intensity,
          confidence,
          getHotspotSize(intensity, 16)
        );
      });
    },
    [renderEmotionalHotspot, getXFromTime, getHotspotSize]
  );

  // Neue Funktion für einheitliche emotionale Marker (Vorschlag 1)
  const renderUnifiedEmotionalMarker = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      emotion: GEMS,
      intensity: number,
      confidence: number,
      size: number
    ) => {
      const config = EMOTION_VISUAL_CONFIGS[emotion];
      if (!config) return;

      const alpha = getConfidenceAlpha(confidence);
      const color = getIntensityColor(config.intensityGradient, intensity);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;

      // Raute zeichnen (Diamond) - Größe basiert auf Intensität
      const halfSize = size / 2;
      ctx.beginPath();
      ctx.moveTo(x, y - halfSize); // Oben
      ctx.lineTo(x + halfSize, y); // Rechts
      ctx.lineTo(x, y + halfSize); // Unten
      ctx.lineTo(x - halfSize, y); // Links
      ctx.closePath();
      ctx.fill();

      // Intensitäts-Ring für hohe Intensität (dicker Ring)
      if (intensity > 0.7) {
        ctx.strokeStyle = config.baseColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Confidence-Indikator (kleiner innerer Ring)
      if (confidence > 0.8) {
        ctx.strokeStyle = config.hoverColor;
        ctx.lineWidth = 1;
        const innerSize = size * 0.6;
        const innerHalfSize = innerSize / 2;
        ctx.beginPath();
        ctx.moveTo(x, y - innerHalfSize);
        ctx.lineTo(x + innerHalfSize, y);
        ctx.lineTo(x, y + innerHalfSize);
        ctx.lineTo(x - innerHalfSize, y);
        ctx.closePath();
        ctx.stroke();
      }

      ctx.restore();
    },
    []
  );

  // Neue Funktion für einheitliche emotionale Marker (Vorschlag 1)
  const renderUnifiedEmotionalMarkers = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      suggestions: MerSuggestion[],
      zoom: number,
      canvasHeight: number
    ) => {
      if (!suggestions || suggestions.length === 0) return;

      suggestions.forEach((suggestion) => {
        const x = getXFromTime(suggestion.time);
        const y = canvasHeight / 2; // Zentriert

        // Bestimme dominante Emotion aus GEMS
        const dominantEmotion = suggestion.gems || GEMS.JoyfulActivation;
        const intensity = suggestion.intensity / 100; // Konvertiere 0-100 zu 0-1
        const confidence = suggestion.confidence || 0.8;

        // Verwende die neue einheitliche Marker-Funktion
        renderUnifiedEmotionalMarker(
          ctx,
          x,
          y,
          dominantEmotion,
          intensity,
          confidence,
          getHotspotSize(intensity, 16)
        );
      });
    },
    [renderUnifiedEmotionalMarker, getXFromTime, getHotspotSize]
  );

  // Neue Funktion für GEMS-Farben in Tooltips
  const getGemsTooltipColor = useCallback((emotion: GEMS) => {
    const config = EMOTION_VISUAL_CONFIGS[emotion];
    return config ? config.baseColor : "#fbbf24"; // Fallback: Gelb
  }, []);

  // Neue Funktion: Prüft, ob ein Klick auf einen emotionalen Marker erfolgt ist
  const getClickedSuggestion = useCallback(
    (mouseX: number, mouseY: number): MerSuggestion | null => {
      if (!suggestions || suggestions.length === 0) return null;

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return null;

      // Konvertiere Maus-Position zu Canvas-Koordinaten
      const canvasX = mouseX - canvasRect.left;
      const canvasY = mouseY - canvasRect.top;

      // Prüfe jeden Suggestion-Marker
      for (const suggestion of suggestions) {
        const markerX = getXFromTime(suggestion.time);
        const markerY = canvasHeight / 2; // Zentriert
        const markerSize = getHotspotSize(suggestion.intensity / 100, 16);

        // Prüfe, ob Klick innerhalb des Marker-Bereichs liegt
        const halfSize = markerSize / 2;
        if (
          canvasX >= markerX - halfSize &&
          canvasX <= markerX + halfSize &&
          canvasY >= markerY - halfSize &&
          canvasY <= markerY + halfSize
        ) {
          return suggestion;
        }
      }

      return null;
    },
    [suggestions, getXFromTime, canvasHeight, getHotspotSize]
  );

  // Multi-Track Canvas Rendering
  const renderMultiTrackCanvas = useCallback(() => {
    if (!canvasRef.current || effectiveTracks.length === 0) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Render background grid
    if (defaultTrackRenderConfig.showGrid) {
      renderBackgroundGrid(ctx);
    }

    // Render each track
    effectiveTracks.forEach((track, trackIndex) => {
      if (!track.visible) return;

      const yOffset = trackIndex * (trackHeight + trackSpacing);
      renderTrack(ctx, track, yOffset, canvasWidth, trackHeight, zoom);
    });

    // Render emotional hotspots (T-002) - Jetzt als einheitliche Marker
    if (suggestions && suggestions.length > 0) {
      renderUnifiedEmotionalMarkers(ctx, suggestions, zoom, canvasHeight);
    }

    // Render markers overlay
    renderMarkersOverlay(ctx);

    // Render current time indicator
    renderCurrentTimeIndicator(ctx);
  }, [
    effectiveTracks,
    trackHeight,
    trackSpacing,
    zoom,
    markers,
    currentTime,
    defaultTrackRenderConfig.showGrid,
    suggestions,
    renderUnifiedEmotionalMarkers,
  ]);

  // Background grid renderer
  const renderBackgroundGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const width = canvasRef.current?.width || 0;
      const height = canvasHeight;

      ctx.strokeStyle = "rgba(75, 85, 99, 0.3)";
      ctx.lineWidth = 0.5;

      // Vertical time grid (every 10 seconds)
      const timeStep = 10;
      const pixelStep = timeStep * zoom;

      for (let x = 0; x < width; x += pixelStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal track grid
      for (let y = 0; y < height; y += trackHeight + trackSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    },
    [zoom, trackHeight, trackSpacing, canvasHeight]
  );

  // Individual track renderer
  const renderTrack = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      track: TrackData,
      yOffset: number,
      width: number,
      height: number,
      zoom: number
    ) => {
      if (!track.data || track.data.length === 0) return;

      ctx.save();
      ctx.globalAlpha = track.opacity;

      // Track background
      ctx.fillStyle = `${track.color}10`;
      ctx.fillRect(0, yOffset, width, height);

      // Track border
      ctx.strokeStyle = `${track.color}30`;
      ctx.lineWidth = 1;
      ctx.strokeRect(0, yOffset, width, height);

      // Render track data based on type
      switch (track.type) {
        case "amplitude":
          renderAmplitudeTrack(ctx, track, yOffset, width, height, zoom);
          break;
        case "spectral":
          renderSpectralTrack(ctx, track, yOffset, width, height, zoom);
          break;
        case "ki-hotspots":
          renderEmotionTrack(ctx, track, yOffset, width, height, zoom);
          break;
        case "structure":
          renderStructureTrack(ctx, track, yOffset, width, height, zoom);
          break;
        case "onsets":
          renderOnsetTrack(ctx, track, yOffset, width, height, zoom);
          break;
        default:
          renderGenericTrack(ctx, track, yOffset, width, height, zoom);
      }

      // Track label
      if (defaultTrackRenderConfig.showLabels) {
        renderTrackLabel(ctx, track, yOffset, height);
      }

      ctx.restore();
    },
    [defaultTrackRenderConfig.showLabels]
  );

  // Track-specific renderers
  const renderAmplitudeTrack = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      track: TrackData,
      yOffset: number,
      width: number,
      height: number,
      zoom: number
    ) => {
      const data = track.data as number[];
      const centerY = yOffset + height / 2;

      ctx.strokeStyle = track.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((value, index) => {
        const x = (index / data.length) * width;
        const normalizedValue = Math.max(0, Math.min(1, value));
        const y = centerY - (normalizedValue * height) / 2;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Fill area
      if (defaultTrackRenderConfig.fillStyle !== "none") {
        ctx.lineTo(width, centerY);
        ctx.lineTo(0, centerY);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(
          0,
          yOffset,
          0,
          yOffset + height
        );
        gradient.addColorStop(0, `${track.color}40`);
        gradient.addColorStop(1, `${track.color}10`);

        ctx.fillStyle = gradient;
        ctx.fill();
      }
    },
    [defaultTrackRenderConfig.fillStyle]
  );

  const renderSpectralTrack = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      track: TrackData,
      yOffset: number,
      width: number,
      height: number,
      zoom: number
    ) => {
      const data = track.data as number[];

      data.forEach((value, index) => {
        const x = (index / data.length) * width;
        const normalizedValue = Math.max(0, Math.min(1, value));
        const barHeight = normalizedValue * height;
        const y = yOffset + height - barHeight;

        // Color based on value
        const hue = 120 + normalizedValue * 60; // Green to yellow
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        ctx.fillRect(x, y, Math.max(1, width / data.length), barHeight);
      });
    },
    []
  );

  const renderEmotionTrack = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      track: TrackData,
      yOffset: number,
      width: number,
      height: number,
      zoom: number
    ) => {
      const data = track.data as number[];

      data.forEach((value, index) => {
        const x = (index / data.length) * width;
        const normalizedValue = Math.max(0, Math.min(1, value));
        const radius = Math.max(2, normalizedValue * 8);
        const y = yOffset + height / 2;

        // Color based on intensity
        const alpha = 0.3 + normalizedValue * 0.7;
        ctx.fillStyle = `${track.color}${Math.round(alpha * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
      });
    },
    []
  );

  const renderStructureTrack = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      track: TrackData,
      yOffset: number,
      width: number,
      height: number,
      zoom: number
    ) => {
      const data = track.data as number[];

      data.forEach((value, index) => {
        const x = (index / data.length) * width;
        const normalizedValue = Math.max(0, Math.min(1, value));
        const barHeight = height * 0.6;
        const y = yOffset + (height - barHeight) / 2;

        // Color based on segment type
        let color = track.color;
        if (normalizedValue < 0.2) color = "#EF4444"; // Intro
        else if (normalizedValue < 0.4) color = "#3B82F6"; // Verse
        else if (normalizedValue < 0.6) color = "#10B981"; // Chorus
        else if (normalizedValue < 0.8) color = "#F59E0B"; // Bridge
        else color = "#8B5CF6"; // Outro

        ctx.fillStyle = color;
        ctx.fillRect(x, y, Math.max(1, width / data.length), barHeight);
      });
    },
    []
  );

  const renderOnsetTrack = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      track: TrackData,
      yOffset: number,
      width: number,
      height: number,
      zoom: number
    ) => {
      const data = track.data as number[];
      const centerY = yOffset + height / 2;

      // Zeichne Onset-Peaks als vertikale Linien
      data.forEach((value, index) => {
        if (value > 0.1) {
          // Nur Onsets über Threshold anzeigen
          const x = (index / data.length) * width;
          const normalizedValue = Math.max(0, Math.min(1, value));
          const peakHeight = height * 0.8 * normalizedValue;
          const y = centerY - peakHeight / 2;

          // Farbe basierend auf Onset-Stärke
          const alpha = 0.4 + normalizedValue * 0.6;
          ctx.strokeStyle = `${track.color}${Math.round(alpha * 255)
            .toString(16)
            .padStart(2, "0")}`;
          ctx.lineWidth = Math.max(1, normalizedValue * 3);

          // Vertikale Linie für Onset
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + peakHeight);
          ctx.stroke();

          // Kleiner Kreis am Peak
          if (normalizedValue > 0.5) {
            ctx.fillStyle = track.color;
            ctx.beginPath();
            ctx.arc(x, centerY, 2, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      });

      // Zeichne Beat-Grid als Hintergrund
      ctx.strokeStyle = `${track.color}20`;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]);

      // Beat-Linien alle 4 Beats (bei 120 BPM = alle 2 Sekunden)
      const beatInterval = 2.0; // Sekunden
      const pixelsPerSecond = width / (duration || 60);
      const beatSpacing = beatInterval * pixelsPerSecond;

      for (let x = 0; x < width; x += beatSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, yOffset);
        ctx.lineTo(x, yOffset + height);
        ctx.stroke();
      }

      ctx.setLineDash([]); // Reset line dash
    },
    [duration]
  );

  const renderGenericTrack = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      track: TrackData,
      yOffset: number,
      width: number,
      height: number,
      zoom: number
    ) => {
      const data = track.data as number[];
      const centerY = yOffset + height / 2;

      ctx.strokeStyle = track.color;
      ctx.lineWidth = 1;
      ctx.beginPath();

      data.forEach((value, index) => {
        const x = (index / data.length) * width;
        const normalizedValue = Math.max(0, Math.min(1, value));
        const y = centerY - (normalizedValue * height) / 2;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    },
    []
  );

  const renderTrackLabel = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      track: TrackData,
      yOffset: number,
      height: number
    ) => {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "12px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const labelX = 8;
      const labelY = yOffset + height / 2;

      ctx.fillText(track.name, labelX, labelY);
    },
    []
  );

  const renderMarkersOverlay = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const height = canvasHeight;
      markers.forEach((marker) => {
        const startX = getXFromTime(marker.t_start_s);
        const endX = getXFromTime(marker.t_end_s);
        const markerHeight = height * 0.8;
        const markerY = height * 0.1;

        // Marker background
        ctx.fillStyle = marker.id === selectedMarkerId ? "#F59E0B" : "#6B7280";
        ctx.fillRect(startX, markerY, endX - startX, markerHeight);

        // Marker border
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, markerY, endX - startX, markerHeight);
      });
    },
    [getXFromTime, selectedMarkerId, markers, canvasHeight]
  );

  const renderCurrentTimeIndicator = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const x = getXFromTime(currentTime);
      const height = canvasHeight;

      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    },
    [getXFromTime, currentTime, canvasHeight]
  );

  // Trigger canvas rendering when dependencies change
  useEffect(() => {
    renderMultiTrackCanvas();
  }, [
    effectiveTracks.length,
    trackHeight,
    trackSpacing,
    zoom,
    markers.length,
    currentTime,
    renderMultiTrackCanvas,
  ]);

  // Marker navigation functions
  const navigateToMarker = useCallback(
    (direction: "prev" | "next") => {
      if (markers.length === 0) return;

      const sortedMarkers = [...markers].sort(
        (a, b) => a.t_start_s - b.t_start_s
      );
      const currentIndex = selectedMarkerId
        ? sortedMarkers.findIndex((m) => m.id === selectedMarkerId)
        : -1;

      let targetIndex: number;
      if (direction === "next") {
        targetIndex =
          currentIndex < sortedMarkers.length - 1 ? currentIndex + 1 : 0;
      } else {
        targetIndex =
          currentIndex > 0 ? currentIndex - 1 : sortedMarkers.length - 1;
      }

      const targetMarker = sortedMarkers[targetIndex];
      if (targetMarker) {
        onMarkerSelect(targetMarker.id);
        onScrub(targetMarker.t_start_s);
      }
    },
    [markers, selectedMarkerId, onMarkerSelect, onScrub]
  );

  const animationFrameRef = useRef<number | null>(null);

  // Auto-scroll logic
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !animationFrameRef.current) return; // Only auto-scroll during playback

    const playheadX = getXFromTime(currentTime);
    const scrollerWidth = scroller.clientWidth;
    const scrollLeft = scroller.scrollLeft;

    const isOutOfView =
      playheadX < scrollLeft + 20 ||
      playheadX > scrollLeft + scrollerWidth - 20;

    if (isOutOfView) {
      scroller.scrollTo({
        left: playheadX - scrollerWidth / 2,
        behavior: "smooth",
      });
    }
  }, [currentTime, getXFromTime]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const container = containerRef.current;
    if (!canvas || !ctx || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const canvasContentWidth = duration * zoom;
    if (container.style.width !== `${canvasContentWidth}px`) {
      container.style.width = `${canvasContentWidth}px`;
    }

    const { height } = rect;

    // Background
    ctx.fillStyle = "#23272d";
    ctx.fillRect(0, 0, canvasContentWidth, height);

    // Waveform
    if (waveform) {
      const centerY = height / 2;
      const step = Math.max(1, canvasContentWidth / waveform.length);

      for (let i = 0; i < waveform.length; i++) {
        const point = waveform[i];
        const barHeight = point.amp * centerY;

        let hue: number;
        let saturation = 80;
        let lightness = 60;

        // Use spectralCentroid for color mapping
        const colorValue = point.spectralCentroid;

        switch (colorPalette) {
          case "spectral":
            hue = 300 * (1 - colorValue);
            break;
          case "thermal":
            hue = 60 * colorValue;
            lightness = 40 + colorValue * 50;
            saturation = 90;
            break;
          case "grayscale":
            hue = 0;
            saturation = 0;
            lightness = 30 + colorValue * 60;
            break;
          case "vibrant":
          default:
            hue = 240 - colorValue * 200;
            break;
        }
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`;

        ctx.fillRect(i * step, centerY - barHeight, step, barHeight * 2);
      }
    }

    // Ticks
    const tickInterval = zoom > 50 ? 1 : zoom > 10 ? 5 : 10;
    ctx.font = "10px sans-serif";
    for (let i = 0; i <= duration; i += tickInterval) {
      const x = getXFromTime(i);
      ctx.fillStyle = "#484f58";
      ctx.fillRect(x, height - 10, 1, 10);
      if (zoom > 20) {
        ctx.fillStyle = "#909dab";
        ctx.fillText(String(i), x + 2, height - 12);
      }
    }

    // MER Suggestions are now rendered as HTML elements above the canvas

    // Emotional Hotspots (T-002) - Jetzt als einheitliche Marker
    if (suggestions && suggestions.length > 0) {
      renderUnifiedEmotionalMarkers(ctx, suggestions, zoom, height);
    }

    // Markers
    markers.forEach((marker) => {
      const startX = getXFromTime(marker.t_start_s);
      const endX = getXFromTime(marker.t_end_s);
      const isSelected = marker.id === selectedMarkerId;
      const isHovered = marker.id === hoveredMarkerId;

      let fillOpacity = 0.2;
      if (isHovered) fillOpacity = 0.3;
      if (isSelected) fillOpacity = 0.4;

      ctx.fillStyle = `rgba(47, 129, 247, ${fillOpacity})`;
      ctx.fillRect(startX, 0, endX - startX, height);

      ctx.fillStyle = isSelected ? "#2f81f7" : "#388bfd";
      ctx.fillRect(startX - 1, 0, 2, height);
      ctx.fillRect(endX - 1, 0, 2, height);
    });

    // Draw pending marker visualization
    if (pendingMarkerStart !== null) {
      const startX = getXFromTime(pendingMarkerStart);
      ctx.fillStyle = "rgba(210, 153, 34, 0.7)";
      ctx.fillRect(startX, 0, 2, height);

      if (mouseTime !== null) {
        const endX = getXFromTime(mouseTime);
        ctx.fillStyle = "rgba(210, 153, 34, 0.3)";
        ctx.fillRect(
          Math.min(startX, endX),
          0,
          Math.abs(endX - startX),
          height
        );
      }
    }

    // Playhead
    const playheadX = getXFromTime(currentTime);
    ctx.fillStyle = "#d83c3e";
    ctx.fillRect(playheadX, 0, 2, height);
  }, [
    duration,
    currentTime,
    markers,
    selectedMarkerId,
    zoom,
    getXFromTime,
    pendingMarkerStart,
    mouseTime,
    waveform,
    colorPalette,
    hoveredMarkerId,
    suggestions,
    renderUnifiedEmotionalMarkers,
  ]);

  useEffect(() => {
    draw();
  }, [draw, waveform, suggestions]); // Waveform und Suggestions als Dependencies

  const getMouseEventTime = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return getTimeFromX(x);
  };

  const getTouchEventTime = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    const x = touch.clientX - rect.left;
    return getTimeFromX(x);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const time = getMouseEventTime(e);

    if (!containerRef.current) {
      return;
    }
    const currentY =
      e.clientY - containerRef.current.getBoundingClientRect().top;

    // Prüfe zuerst, ob ein emotionaler Marker geklickt wurde
    const clickedSuggestion = getClickedSuggestion(e.clientX, e.clientY);
    if (clickedSuggestion && onSuggestionClick) {
      // Erstelle einen echten Marker aus der Suggestion
      const newMarker: Marker = {
        id: `marker-${Date.now()}`,
        trackLocalId: "emotion-generated", // Platzhalter
        title: "Emotion Marker",
        artist: "AI Generated",
        duration_s: 1, // 1 Sekunde Dauer
        t_start_s: clickedSuggestion.time,
        t_end_s: clickedSuggestion.time + 1,
        valence: clickedSuggestion.valence || 0,
        arousal: clickedSuggestion.arousal || 0,
        intensity: clickedSuggestion.intensity || 50,
        confidence: clickedSuggestion.confidence || 0.8,
        gems: clickedSuggestion.gems || "",
        trigger: clickedSuggestion.trigger || [],
        imagery: clickedSuggestion.reason || "AI-generierte emotionale Analyse",
        sync_notes: `${clickedSuggestion.intensity}% Intensität`,
      };

      // Konvertiere Marker zu MerSuggestion für onSuggestionClick
      const suggestionForClick: MerSuggestion = {
        time: clickedSuggestion.time,
        valence: clickedSuggestion.valence || 0,
        arousal: clickedSuggestion.arousal || 0,
        intensity: clickedSuggestion.intensity || 50,
        confidence: clickedSuggestion.confidence || 0.8,
        reason: clickedSuggestion.reason || "AI-generierte emotionale Analyse",
        gems: clickedSuggestion.gems || "",
        trigger: clickedSuggestion.trigger || [],
        sync_notes: `${clickedSuggestion.intensity}% Intensität`,
        imagery: clickedSuggestion.reason || "AI-generierte emotionale Analyse",
      };

      onSuggestionClick(suggestionForClick);
      return; // Beende hier, da wir einen Marker erstellt haben
    }

    // Multi-Track Click Logic - Only for explicit track interactions
    if (effectiveTracks.length > 0) {
      const trackIndex = Math.floor(currentY / (trackHeight + trackSpacing));
      const track = effectiveTracks[trackIndex];

      // Only treat as track click if clicking in the middle of a track
      // Allow timeline scrubbing even when clicking on tracks
      if (track && track.visible && onTrackClick) {
        const trackY = trackIndex * (trackHeight + trackSpacing);
        const clickOffsetY = currentY - trackY;

        // Only treat as track click if clicking in the center area of the track
        if (
          clickOffsetY > trackHeight * 0.2 &&
          clickOffsetY < trackHeight * 0.8
        ) {
          onTrackClick(track.id, time, trackIndex);
          // Don't return - allow both track click AND timeline scrubbing
        }
      }
    }

    if (pendingMarkerStart !== null) return;

    let clickedOnMarker = false;
    for (const marker of [...markers].reverse()) {
      const startX = getXFromTime(marker.t_start_s);
      const endX = getXFromTime(marker.t_end_s);
      const mouseX =
        e.clientX - (containerRef.current?.getBoundingClientRect().left || 0);
      const handleHitboxWidth = 16; // Larger hitbox

      if (
        mouseX >= startX - handleHitboxWidth / 2 &&
        mouseX <= startX + handleHitboxWidth / 2
      ) {
        interactionState.current = {
          isDragging: true,
          draggedMarkerId: marker.id,
          draggedHandle: "start",
          dragOffset: time - marker.t_start_s,
          touchStartPos: null,
          hasMoved: false,
          isSwipeGesture: false,
          swipeStartX: 0,
          longPressTimer: null,
          dragStartX: null,
        };
        clickedOnMarker = true;
      } else if (
        mouseX >= endX - handleHitboxWidth / 2 &&
        mouseX <= endX + handleHitboxWidth / 2
      ) {
        interactionState.current = {
          isDragging: true,
          draggedMarkerId: marker.id,
          draggedHandle: "end",
          dragOffset: time - marker.t_end_s,
          touchStartPos: null,
          hasMoved: false,
          isSwipeGesture: false,
          swipeStartX: 0,
          longPressTimer: null,
          dragStartX: null,
        };
        clickedOnMarker = true;
      } else if (mouseX > startX && mouseX < endX) {
        interactionState.current = {
          isDragging: true,
          draggedMarkerId: marker.id,
          draggedHandle: "body",
          dragOffset: time - marker.t_start_s,
          touchStartPos: null,
          hasMoved: false,
          isSwipeGesture: false,
          swipeStartX: 0,
          longPressTimer: null,
          dragStartX: null,
        };
        clickedOnMarker = true;
      }

      if (clickedOnMarker) {
        if (marker.id !== selectedMarkerId) {
          onMarkerSelect(marker.id);
        }
        break;
      }
    }

    if (!clickedOnMarker) {
      onMarkerSelect(null);
      onScrub(time);
      interactionState.current = {
        isDragging: true,
        draggedMarkerId: null,
        draggedHandle: null,
        dragOffset: 0,
        touchStartPos: null,
        hasMoved: false,
        isSwipeGesture: false,
        swipeStartX: 0,
        longPressTimer: null,
        dragStartX: e.clientX,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !scrollerRef.current) {
      return;
    }
    const time = Math.max(0, Math.min(duration, getMouseEventTime(e)));
    setMouseTime(time);

    const currentX = getXFromTime(time);
    const currentY =
      e.clientY - containerRef.current.getBoundingClientRect().top;

    // Multi-Track Hover Logic
    if (effectiveTracks.length > 0) {
      const trackIndex = Math.floor(currentY / (trackHeight + trackSpacing));
      const track = effectiveTracks[trackIndex];

      if (track && track.visible) {
        setHoveredTrackId(track.id);

        // Track-spezifische Hover-Logik
        if (onTrackHover) {
          onTrackHover(track.id, time, trackIndex);
        }
      } else {
        setHoveredTrackId(null);
      }
    }

    // Tooltip & Suggestion Hover Logic
    // BUGFIX: Find the CLOSEST suggestion, not the first one in range.
    // Hit-Radius an Zoom anpassen: Bei Zoom 50 sollte der Radius größer sein
    const suggestionHitRadius = Math.max(20, zoom * 0.5); // Mindestens 20px, bei Zoom 50 = 25px
    let closestSuggestion: MerSuggestion | null = null;
    let minDistance = Infinity;

    for (const suggestion of suggestions) {
      const suggestionX = getXFromTime(suggestion.time);
      const xDistance = Math.abs(currentX - suggestionX);

      // 2D Hit-Test: Berücksichtige sowohl X als auch Y
      // Y-Distanz: Maus muss in der Nähe der Track-Mitte sein
      // Verwende die tatsächliche Canvas-Höhe statt trackHeight Parameter
      const canvasHeight = containerRef.current?.clientHeight || 100;
      const trackCenterY = canvasHeight / 2; // Canvas-Mitte
      const yDistance = Math.abs(currentY - trackCenterY);
      const yHitRadius = canvasHeight * 0.3; // 30% der Canvas-Höhe

      // 2D Hit-Test: X UND Y müssen im Bereich sein
      if (xDistance < suggestionHitRadius && yDistance < yHitRadius) {
        const totalDistance = Math.sqrt(
          xDistance * xDistance + yDistance * yDistance
        );
        if (totalDistance < minDistance) {
          minDistance = totalDistance;
          closestSuggestion = suggestion;
        }
      }
    }

    if (closestSuggestion !== prevClosestSuggestion.current) {
      prevClosestSuggestion.current = closestSuggestion;
    }

    setClosestSuggestion(closestSuggestion);

    // Cursor and Marker Hover Logic
    let newHoveredMarkerId = null;
    let cursor = "default";
    if (closestSuggestion) {
      cursor = "pointer";
    }

    const handleHitboxWidth = 16;
    for (const marker of markers) {
      const startX = getXFromTime(marker.t_start_s);
      const endX = getXFromTime(marker.t_end_s);
      if (
        currentX > startX + handleHitboxWidth / 2 &&
        currentX < endX - handleHitboxWidth / 2
      ) {
        newHoveredMarkerId = marker.id;
        cursor = interactionState.current.isDragging ? "grabbing" : "grab";
        break;
      }
      if (
        Math.abs(currentX - startX) < handleHitboxWidth / 2 ||
        Math.abs(currentX - endX) < handleHitboxWidth / 2
      ) {
        newHoveredMarkerId = marker.id;
        cursor = "ew-resize";
        break;
      }
    }

    // Set cursor based on track hover
    if (
      hoveredTrackId &&
      effectiveTracks.find((t) => t.id === hoveredTrackId)
    ) {
      cursor = "crosshair";
    }

    e.currentTarget.style.cursor = cursor;
    if (newHoveredMarkerId !== hoveredMarkerId) {
      setHoveredMarkerId(newHoveredMarkerId);
    }

    // Dragging Logic
    if (!interactionState.current.isDragging) return;

    // Timeline Scroll Logic - Update scroll position based on mouse movement
    if (interactionState.current.draggedMarkerId === null) {
      // This is a timeline drag (not a marker drag)
      const scroller = scrollerRef.current;
      if (scroller) {
        // Calculate the change in mouse position since drag start
        const dragStartX = interactionState.current.dragStartX || e.clientX;
        const deltaX = dragStartX - e.clientX;

        // Update scroll position (invert deltaX for natural feel)
        const newScrollLeft = scroller.scrollLeft + deltaX;
        scroller.scrollLeft = Math.max(0, newScrollLeft);

        // Update drag start position for next move
        interactionState.current.dragStartX = e.clientX;
      }
    }

    const { draggedMarkerId, draggedHandle, dragOffset } =
      interactionState.current;
    if (draggedMarkerId && draggedHandle) {
      const marker = markers.find((m) => m.id === draggedMarkerId);
      if (!marker) return;

      if (draggedHandle === "start") {
        const newStartTime = Math.max(0, time);
        onMarkerMove(
          draggedMarkerId,
          newStartTime,
          Math.max(newStartTime + 0.1, marker.t_end_s)
        );
      } else if (draggedHandle === "end") {
        const newEndTime = Math.min(duration, time);
        onMarkerMove(
          draggedMarkerId,
          Math.min(newEndTime - 0.1, marker.t_start_s),
          newEndTime
        );
      } else if (draggedHandle === "body") {
        const newStartTime = time - dragOffset;
        const markerDuration = marker.t_end_s - marker.t_start_s;
        const newEndTime = newStartTime + markerDuration;
        if (newStartTime >= 0 && newEndTime <= duration) {
          onMarkerMove(draggedMarkerId, newStartTime, newEndTime);
        }
      }
    } else {
      onScrub(time);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    interactionState.current.isDragging = false;
    if (containerRef.current) {
      handleMouseMove(e); // To reset cursor to 'grab' if still over a body
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMouseUp(e);
    setMouseTime(null);
    setHoveredMarkerId(null);
    setClosestSuggestion(null); // Reset closest suggestion on leave
    if (e.currentTarget) {
      e.currentTarget.style.cursor = "default";
    }
  };

  // Touch support (basic single-touch for scrub/drag)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const time = getTouchEventTime(e);
    const touch = e.touches[0];

    // Store touch start position for drag/swipe detection
    interactionState.current.touchStartPos = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    interactionState.current.hasMoved = false;
    interactionState.current.isSwipeGesture = false;
    interactionState.current.swipeStartX = touch.clientX;

    // Start long press timer
    interactionState.current.longPressTimer = setTimeout(() => {
      if (
        !interactionState.current.hasMoved &&
        interactionState.current.draggedMarkerId
      ) {
        // Long press detected on a marker - could trigger context menu
        // For now, just select the marker (could be extended with context menu)
        const markerId = interactionState.current.draggedMarkerId;
        if (markerId !== selectedMarkerId) {
          onMarkerSelect(markerId);
        }
        // Add haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 500); // 500ms for long press

    if (pendingMarkerStart !== null) return;

    let clickedOnMarker = false;
    const x = getXFromTime(time);
    const handleHitboxWidth = 24; // optimized for touch (44px Apple guideline)

    for (const marker of [...markers].reverse()) {
      const startX = getXFromTime(marker.t_start_s);
      const endX = getXFromTime(marker.t_end_s);
      if (
        x >= startX - handleHitboxWidth / 2 &&
        x <= startX + handleHitboxWidth / 2
      ) {
        interactionState.current = {
          isDragging: false,
          draggedMarkerId: marker.id,
          draggedHandle: "start",
          dragOffset: time - marker.t_start_s,
          touchStartPos: interactionState.current.touchStartPos,
          hasMoved: false,
          isSwipeGesture: false,
          swipeStartX: interactionState.current.swipeStartX,
          longPressTimer: interactionState.current.longPressTimer,
          dragStartX: null,
        };
        clickedOnMarker = true;
      } else if (
        x >= endX - handleHitboxWidth / 2 &&
        x <= endX + handleHitboxWidth / 2
      ) {
        interactionState.current = {
          isDragging: false,
          draggedMarkerId: marker.id,
          draggedHandle: "end",
          dragOffset: time - marker.t_end_s,
          touchStartPos: interactionState.current.touchStartPos,
          hasMoved: false,
          isSwipeGesture: false,
          swipeStartX: interactionState.current.swipeStartX,
          longPressTimer: interactionState.current.longPressTimer,
          dragStartX: null,
        };
        clickedOnMarker = true;
      } else if (x > startX && x < endX) {
        interactionState.current = {
          isDragging: false,
          draggedMarkerId: marker.id,
          draggedHandle: "body",
          dragOffset: time - marker.t_start_s,
          touchStartPos: interactionState.current.touchStartPos,
          hasMoved: false,
          isSwipeGesture: false,
          swipeStartX: interactionState.current.swipeStartX,
          longPressTimer: interactionState.current.longPressTimer,
          dragStartX: null,
        };
        clickedOnMarker = true;
      }
      if (clickedOnMarker) {
        // Don't select marker immediately - wait for drag detection
        break;
      }
    }
    if (!clickedOnMarker) {
      onMarkerSelect(null);
      onScrub(time);
      interactionState.current = {
        ...interactionState.current,
        isDragging: false, // Don't set dragging yet
        draggedMarkerId: null,
        draggedHandle: null,
        dragOffset: 0,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const time = Math.max(0, Math.min(duration, getTouchEventTime(e)));
    const touch = e.touches[0];

    setMouseTime(time);

    // Check if this is the start of a drag or swipe gesture
    if (
      interactionState.current.touchStartPos &&
      !interactionState.current.hasMoved
    ) {
      const deltaX = touch.clientX - interactionState.current.touchStartPos.x;
      const deltaY = Math.abs(
        touch.clientY - interactionState.current.touchStartPos.y
      );
      const swipeThreshold = 50; // pixels for swipe
      const dragThreshold = 8; // pixels for drag

      // Check for horizontal swipe gesture (for marker navigation)
      if (Math.abs(deltaX) > swipeThreshold && deltaY < 30) {
        interactionState.current.hasMoved = true;
        interactionState.current.isSwipeGesture = true;
        // Clear long press timer on movement
        if (interactionState.current.longPressTimer) {
          clearTimeout(interactionState.current.longPressTimer);
          interactionState.current.longPressTimer = null;
        }
        // Don't set isDragging for swipe gestures
      } else if (Math.abs(deltaX) > dragThreshold || deltaY > dragThreshold) {
        interactionState.current.hasMoved = true;
        interactionState.current.isDragging = true;
        // Clear long press timer on movement
        if (interactionState.current.longPressTimer) {
          clearTimeout(interactionState.current.longPressTimer);
          interactionState.current.longPressTimer = null;
        }
      }
    }

    if (!interactionState.current.isDragging) return;
    const { draggedMarkerId, draggedHandle, dragOffset } =
      interactionState.current;
    if (draggedMarkerId && draggedHandle) {
      const marker = markers.find((m) => m.id === draggedMarkerId);
      if (!marker) return;
      if (draggedHandle === "start") {
        const newStartTime = Math.max(0, time);
        onMarkerMove(
          draggedMarkerId,
          newStartTime,
          Math.max(newStartTime + 0.1, marker.t_end_s)
        );
      } else if (draggedHandle === "end") {
        const newEndTime = Math.min(duration, time);
        onMarkerMove(
          draggedMarkerId,
          Math.min(newEndTime - 0.1, marker.t_start_s),
          newEndTime
        );
      } else if (draggedHandle === "body") {
        const newStartTime = time - dragOffset;
        const markerDuration = marker.t_end_s - marker.t_start_s;
        const newEndTime = newStartTime + markerDuration;
        if (newStartTime >= 0 && newEndTime <= duration) {
          onMarkerMove(draggedMarkerId, newStartTime, newEndTime);
        }
      }
    } else {
      onScrub(time);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Handle swipe gestures for marker navigation
    if (
      interactionState.current.isSwipeGesture &&
      interactionState.current.touchStartPos
    ) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - interactionState.current.swipeStartX;
      const swipeThreshold = 50;

      if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
          // Swipe right - go to previous marker
          navigateToMarker("prev");
        } else {
          // Swipe left - go to next marker
          navigateToMarker("next");
        }
      }
    }
    // If this was a tap (not a drag or swipe), handle marker selection
    else if (
      interactionState.current.draggedMarkerId &&
      !interactionState.current.hasMoved
    ) {
      const markerId = interactionState.current.draggedMarkerId;
      if (markerId !== selectedMarkerId) {
        onMarkerSelect(markerId);
      }
    }

    // Clear long press timer
    if (interactionState.current.longPressTimer) {
      clearTimeout(interactionState.current.longPressTimer);
      interactionState.current.longPressTimer = null;
    }

    // Reset interaction state
    interactionState.current.isDragging = false;
    interactionState.current.touchStartPos = null;
    interactionState.current.hasMoved = false;
    interactionState.current.isSwipeGesture = false;
    interactionState.current.swipeStartX = 0;
    interactionState.current.draggedMarkerId = null;
    interactionState.current.draggedHandle = null;
    interactionState.current.dragOffset = 0;

    setHoveredMarkerId(null);
    setClosestSuggestion(null); // Reset closest suggestion on end
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      onZoom(e.deltaY < 0 ? "in" : "out");
    },
    [onZoom]
  );

  // useEffect für Wheel Event Listener
  useEffect(() => {
    const scrollerElement = scrollerRef.current;
    if (!scrollerElement) return;

    // Event Listener mit passive: false hinzufügen
    scrollerElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      scrollerElement.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  return (
    <div className="w-full relative" style={{ height: `${canvasHeight}px` }}>
      <div
        ref={scrollerRef}
        className="w-full h-full cursor-default bg-gray-900 relative touch-pan-y overflow-x-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={containerRef}
          className="relative h-full"
          style={{
            minWidth: `${Math.max(100, duration * zoom)}px`,
            width: `${Math.max(100, duration * zoom)}px`,
            height: `${canvasHeight}px`,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Lyrics-Zwischenspeicher Status */}
          {hasLyricsContext && (
            <div
              className="absolute top-2 left-2 z-10 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 cursor-pointer hover:bg-green-500 transition-colors duration-200 active:bg-green-700"
              onClick={onLyricsStatusClick}
              title="Klicken um Lyrics anzuzeigen"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Lyrics verfügbar</span>
              {lyricsContextLength && (
                <span className="bg-green-700 px-2 py-0.5 rounded text-xs">
                  {lyricsContextLength} Zeichen
                </span>
              )}
            </div>
          )}

          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `${Math.max(100, duration * zoom)}px`,
              height: `${canvasHeight}px`,
            }}
          />

          {/* Alle Suggestions werden jetzt als einheitliche Marker auf dem Canvas gerendert */}
          {/* Keine separaten HTML-Elemente mehr */}
        </div>
      </div>

      {/* Enhanced Tooltip für Suggestions - T-002.1: Visuelle Hierarchie & Emotion Mapping */}
      {closestSuggestion && (
        <div
          className="fixed z-[9999] bg-gray-800 text-white px-4 py-3 rounded-lg shadow-xl text-sm max-w-sm pointer-events-none border border-gray-600"
          style={{
            left: `${Math.max(
              20,
              getXFromTime(closestSuggestion.time) + 20
            )}px`,
            top: "60px",
            filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.7))",
            maxWidth: "350px",
            wordWrap: "break-word",
          }}
        >
          {/* T-002.1: GEMS-Farben im Tooltip-Header */}
          <div
            className="flex items-center gap-3 mb-3 p-2 rounded-lg"
            style={{
              backgroundColor:
                EMOTION_VISUAL_CONFIGS[
                  closestSuggestion.gems || GEMS.JoyfulActivation
                ]?.baseColor + "20" || "#fbbf2420",
              borderLeft: `4px solid ${
                EMOTION_VISUAL_CONFIGS[
                  closestSuggestion.gems || GEMS.JoyfulActivation
                ]?.baseColor || "#fbbf24"
              }`,
            }}
          >
            <div
              className="w-4 h-4 rounded-full shadow-md"
              style={{
                backgroundColor:
                  EMOTION_VISUAL_CONFIGS[
                    closestSuggestion.gems || GEMS.JoyfulActivation
                  ]?.baseColor || "#fbbf24",
                boxShadow: `0 0 8px ${
                  EMOTION_VISUAL_CONFIGS[
                    closestSuggestion.gems || GEMS.JoyfulActivation
                  ]?.baseColor || "#fbbf24"
                }40`,
              }}
            />
            <div className="flex-1">
              <div
                className="font-bold text-base"
                style={{
                  color:
                    EMOTION_VISUAL_CONFIGS[
                      closestSuggestion.gems || GEMS.JoyfulActivation
                    ]?.baseColor || "#fbbf24",
                }}
              >
                {closestSuggestion.gems || "Emotion"}
              </div>
              <div className="text-xs text-gray-400 font-mono">
                @{closestSuggestion.time.toFixed(1)}s
              </div>
            </div>
          </div>

          {/* T-002.1: Valence/Arousal-Indikatoren */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Valence Indicator */}
            <div className="bg-gray-700 rounded-lg p-2">
              <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
                Valence
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-600 rounded-full h-2 relative overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.abs(
                        (closestSuggestion.valence || 0) * 50 + 50
                      )}%`,
                      backgroundColor:
                        (closestSuggestion.valence || 0) >= 0
                          ? "#10B981" // Positive (grün)
                          : "#EF4444", // Negative (rot)
                      marginLeft:
                        (closestSuggestion.valence || 0) < 0
                          ? `${50 + (closestSuggestion.valence || 0) * 50}%`
                          : "50%",
                    }}
                  />
                  {/* Center line */}
                  <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-400 transform -translate-x-1/2" />
                </div>
                <span className="text-xs text-gray-300 font-mono w-8 text-right">
                  {(closestSuggestion.valence || 0) >= 0 ? "+" : ""}
                  {(closestSuggestion.valence || 0).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Arousal Indicator */}
            <div className="bg-gray-700 rounded-lg p-2">
              <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
                Arousal
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-600 rounded-full h-2 relative overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(closestSuggestion.arousal || 0) * 100}%`,
                      backgroundColor: "#F59E0B", // Orange für Arousal
                    }}
                  />
                </div>
                <span className="text-xs text-gray-300 font-mono w-8 text-right">
                  {(closestSuggestion.arousal || 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Metriken */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                Intensität
              </div>
              <div className="text-lg font-bold text-white">
                {closestSuggestion.intensity}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                Confidence
              </div>
              <div className="text-lg font-bold text-white">
                {Math.round((closestSuggestion.confidence || 0.8) * 100)}%
              </div>
            </div>
          </div>

          {/* AI-Analyse */}
          {closestSuggestion.reason && (
            <div className="text-gray-400 text-xs mt-3 pt-3 border-t border-gray-600">
              <div className="font-medium mb-2 text-gray-300 uppercase tracking-wide">
                AI-Analyse
              </div>
              <div className="leading-relaxed">{closestSuggestion.reason}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Timeline;
