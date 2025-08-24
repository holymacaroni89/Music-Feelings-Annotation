export enum GEMS {
  Wonder = "Wonder",
  Transcendence = "Transcendence",
  Tenderness = "Tenderness",
  Nostalgia = "Nostalgia",
  Peacefulness = "Peacefulness",
  Power = "Power",
  JoyfulActivation = "JoyfulActivation",
  Tension = "Tension",
  Sadness = "Sadness",
}

export enum Trigger {
  Harmony = "Harmony",
  Melody = "Melody",
  Rhythm = "Rhythm",
  Timbre = "Timbre",
  Lyrics = "Lyrics",
}

// Neue Multi-Track Timeline Typen
export type TrackType =
  | "amplitude"
  | "spectral"
  | "ki-hotspots"
  | "structure"
  | "onsets"
  | "custom";

export interface TrackData {
  id: string;
  type: TrackType;
  name: string;
  data: Float32Array | number[];
  color: string;
  height: number;
  visible: boolean;
  opacity: number;
  order: number;
  metadata?: {
    unit?: string;
    minValue?: number;
    maxValue?: number;
    description?: string;
  };
}

export interface MultiTrackTimeline {
  tracks: TrackData[];
  trackHeight: number;
  trackSpacing: number;
  totalHeight: number;
  zoomY: number;
  panY: number;
}

export interface TrackRenderConfig {
  showGrid: boolean;
  showLabels: boolean;
  showValues: boolean;
  interpolation: "linear" | "step" | "smooth";
  fillStyle: "none" | "solid" | "gradient";
}

// Neue Typen für emotionale Hotspot-Visualisierung
export interface EmotionVisualConfig {
  baseColor: string;
  intensityGradient: string[];
  hoverColor: string;
  selectedColor: string;
  opacity: number;
  size: {
    min: number;
    max: number;
    base: number;
  };
}

export interface EmotionHotspot {
  id: string;
  time: number;
  dominantEmotion: GEMS;
  intensity: number;
  confidence: number;
  valence: number;
  arousal: number;
  source: "ai-suggestion" | "user-annotation";
  metadata?: {
    trigger?: Trigger[];
    imagery?: string;
    syncNotes?: string;
  };
}

export interface EmotionCluster {
  id: string;
  centerTime: number;
  dominantEmotion: GEMS;
  suggestions: EmotionHotspot[];
  intensity: number;
  confidence: number;
  timeRange: {
    start: number;
    end: number;
  };
}

export interface Marker {
  id: string; // stable UUID v4
  trackLocalId: string; // z. B. hash des Dateinamens
  title: string;
  artist: string;
  duration_s: number; // Gesamtdauer
  t_start_s: number;
  t_end_s: number;
  valence: number; // −1..+1 (float)
  arousal: number; // 0..1 (float)
  intensity: number; // 0..100 (int)
  confidence: number; // 0..1 (float)
  gems: GEMS | ""; // one of GEMS or empty
  trigger: Trigger[]; // subset of Trigger
  imagery: string; // Freitext
  sync_notes: string; // Freitext (Zahlen/Symbole)
}

export interface TrackInfo {
  localId: string;
  name: string;
  title: string;
  artist: string;
  duration_s: number;
}

export interface WaveformPoint {
  amp: number;
  spectralCentroid: number; // Normalized 0-1, represents brightness
  spectralFlux: number; // Normalized 0-1, represents timbral change

  // Enhanced spectral features for improved AI analysis
  tempoBpm?: number; // Beats per minute (estimated locally)
  harmonicRatio?: number; // Harmonic vs noise ratio (0-1)
  dynamicRange?: number; // Local dynamic range (0-1)
  rhythmicComplexity?: number; // Rhythm pattern complexity (0-1)
  loudness?: number; // Perceptual loudness (0-1, normalized)
  sharpness?: number; // Perceptual sharpness (0-1)
  roughness?: number; // Perceptual roughness (0-1)

  // Neue Eigenschaften für Multi-Track-Visualisierung
  amplitude?: number; // Normalized amplitude (0-1) für Amplitude-Track
  emotionIntensity?: number; // KI-basierte Emotions-Intensität (0-1)
  emotionConfidence?: number; // KI-Confidence für Emotions-Vorhersage (0-1)
  dominantEmotion?: GEMS | null; // Dominante Emotion zu diesem Zeitpunkt
  structuralSegment?: string; // Song-Struktur (intro, verse, chorus, etc.)

  // Neue Onset-Features für Text-Synchronisation
  onsetStrength?: number; // 0-1: Stärke des musikalischen Einsatzes
  onsetType?: "beat" | "phrase" | "section" | "onset"; // Art des Einsatzes
  onsetConfidence?: number; // 0-1: Konfidenz der Onset-Erkennung
  phraseBoundary?: number; // 0-1: Wahrscheinlichkeit einer Phrase-Grenze
  beatPosition?: number; // 0-1: Position im Beat-Pattern (0 = Beat-1, 0.5 = Off-Beat)

  // Neue erweiterte Audio-Features für bessere KI-Analyse
  vocalProbability?: number; // 0-1: Wahrscheinlichkeit von Gesang
  vocalClarity?: number; // 0-1: Klarheit der Stimme
  vocalIntensity?: number; // 0-1: Intensität der Stimme
  instrumentalRatio?: number; // 0-1: Verhältnis Instrumental zu Gesang
  localDynamics?: number; // 0-1: Lokale Dynamik-Änderungen
  globalDynamics?: number; // 0-1: Globale Dynamik über Zeit
  dynamicContrast?: number; // 0-1: Kontrast zwischen laut/leise
  energyFlow?: number; // 0-1: Energiefluss über Zeit
  harmonicRichness?: number; // 0-1: Reichhaltigkeit der Harmonien
  dissonanceLevel?: number; // 0-1: Dissonanz-Level
  chordComplexity?: number; // 0-1: Akkord-Komplexität
  tonalStability?: number; // 0-1: Tonale Stabilität
}

export type ColorPalette = "vibrant" | "spectral" | "thermal" | "grayscale";

export interface Profile {
  id: string;
  name: string;
}

export interface MerSuggestion {
  time: number;
  valence: number;
  arousal: number;
  intensity: number;
  confidence: number;
  reason: string;
  gems: GEMS | "";
  trigger: Trigger[];
  sync_notes: string;
  imagery: string;
}

export interface TrainingSample {
  input: {
    valence: number;
    arousal: number;
  };
  output: {
    valence: number;
    arousal: number;
  };
}

export interface AudioAnalysisResult {
  trackId: string;
  timestamp: number;
  suggestions: MerSuggestion[];
  waveformHash: string;
  songContextHash: string;
  analysisVersion: string;
}

// Neue Interface für persistierte Audio-Analyse
export interface PersistentAudioAnalysis {
  trackId: string;
  timestamp: number;
  suggestions: MerSuggestion[];
  waveform: WaveformPoint[];
  waveformHash: string;
  songContextHash: string;
  analysisVersion: string;
  isComplete: boolean;
  lastLyricsUpdate?: number;
}

// Interface für Audio-Cache-Status
export interface AudioCacheStatus {
  hasAnalysis: boolean;
  hasWaveform: boolean;
  lastAnalysis: number;
  needsReanalysis: boolean;
  reason?: string;
}

export interface AppState {
  currentTrackLocalId: string | null;
  trackMetadata: {
    [key: string]: {
      name: string;
      title: string;
      artist: string;
      duration_s: number;
    };
  };
  // Audio-Datei Persistierung
  audioFileData?: {
    name: string;
    size: number;
    lastModified: number;
    arrayBufferBase64?: string; // Base64-kodierte Audio-Daten (neu)
    arrayBuffer?: ArrayBuffer; // ArrayBuffer (veraltet, für Fallback)
  };
  markers: Marker[];
  // Profile Management
  profiles: Profile[];
  activeProfileId: string | null;
  // API Keys
  geniusApiKey?: string;
  // AI Context
  songContext: { [trackLocalId: string]: string };
  // Audio Analysis Cache (erweitert)
  audioAnalysisCache: { [trackLocalId: string]: AudioAnalysisResult };
  // Neue persistierte Audio-Analyse
  persistentAudioAnalysis: { [trackLocalId: string]: PersistentAudioAnalysis };
  // Audio-Cache-Status für UI
  audioCacheStatus: { [trackLocalId: string]: AudioCacheStatus };
}

export interface GeniusHit {
  result: {
    id: number;
    url: string;
    title: string;
    primary_artist: {
      name: string;
    };
    song_art_image_thumbnail_url: string;
  };
}

// For search results
export interface GeniusSong {
  id: number;
  url: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
}

// For detailed view
export interface GeniusSongDetails extends GeniusSong {
  album: string | null;
  releaseDate: string | null;
  imageUrl: string;
  descriptionHtml: string | null; // Community annotations
  lyrics: string | null;
}

// Neue Metadaten-Interfaces für optimierte Gemini API Datenübergabe
export interface HarmonicMetadata {
  quality: "Rich" | "Medium" | "Poor";
  complexity: "Simple" | "Medium" | "Complex";
  stability: "Stable" | "Moderate" | "Unstable";
  dissonanceLevel: "Low" | "Medium" | "High";
  emotionalTendency: string;
  primaryEmotions: string[];
  secondaryEmotions: string[];
  progressionType: "Ascending" | "Descending" | "Circular" | "Stable";
  stabilityTrend: "Improving" | "Declining" | "Fluctuating" | "Consistent";
  qualityConfidence: number;
  complexityConfidence: number;
  stabilityConfidence: number;
  overallConfidence: number;
}

export interface RhythmicMetadata {
  grooveType: "Strong" | "Medium" | "Weak";
  rhythmicComplexity: "Simple" | "Medium" | "Complex";
  beatStrength: "Strong" | "Medium" | "Weak";
  syncopationLevel: "Low" | "Medium" | "High";
  emotionalTendency: string;
  primaryEmotions: string[];
  secondaryEmotions: string[];
  rhythmicProgression: "Building" | "Maintaining" | "Breaking" | "Stable";
  grooveStability: "Consistent" | "Fluctuating" | "Evolving" | "Unstable";
  grooveConfidence: number;
  complexityConfidence: number;
  beatConfidence: number;
  overallConfidence: number;
}

export interface StructuredAudioMetadata {
  harmonic: HarmonicMetadata | null;
  rhythmic: RhythmicMetadata | null;
  // Weitere Metadaten werden später hinzugefügt
  // timbral: TimbralMetadata | null;
  // dynamic: DynamicMetadata | null;

  // Metadaten-Qualitäts-Indikatoren
  overallQuality: number;
  metadataCompleteness: number;
  confidenceLevel: "High" | "Medium" | "Low";

  // Zeitstempel und Kontext
  timestamp: number;
  contextWindow: number;
  analysisVersion: string;
}
