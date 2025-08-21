import { WaveformPoint } from "../types";

export interface FeaturePriority {
  textSync: number; // 0-1: Priorität für Text-Synchronisation
  emotion: number; // 0-1: Priorität für Emotions-Analyse
  structure: number; // 0-1: Priorität für Struktur-Erkennung
  rhythm: number; // 0-1: Priorität für Rhythmus-Analyse
}

export interface NormalizedFeatures {
  // Onset-Features (normalisiert und priorisiert)
  onsetPriority: number; // 0-1: Gewichtete Onset-Bedeutung
  phraseBoundaryStrength: number; // 0-1: Stärke der Phrase-Grenze
  beatAlignment: number; // 0-1: Beat-Synchronisation

  // Vocal-Features (normalisiert und priorisiert)
  vocalDominance: number; // 0-1: Dominanz von Gesang
  vocalTiming: number; // 0-1: Timing der Gesangs-Passagen

  // Dynamic-Features (normalisiert und priorisiert)
  emotionalIntensity: number; // 0-1: Emotionale Intensität
  structuralChange: number; // 0-1: Strukturelle Änderungen

  // Harmonic-Features (normalisiert und priorisiert)
  musicalComplexity: number; // 0-1: Musikalische Komplexität
  tonalDirection: number; // 0-1: Tonale Richtung
}

export interface FeatureContext {
  genre?: string; // Musik-Genre
  tempo?: number; // BPM
  timePosition?: number; // Position im Song (0-1)
  previousFeatures?: WaveformPoint[]; // Vorherige Features für Kontext
}

/**
 * Normalisiert alle Audio-Features auf konsistente 0-1 Skala
 */
export const normalizeFeatures = (
  features: WaveformPoint
): NormalizedFeatures => {
  // Onset-Features normalisieren
  const onsetPriority = calculateOnsetPriority(features);
  const phraseBoundaryStrength = features.phraseBoundary || 0;
  const beatAlignment = calculateBeatAlignment(features);

  // Vocal-Features normalisieren
  const vocalDominance = features.vocalProbability || 0;
  const vocalTiming = calculateVocalTiming(features);

  // Dynamic-Features normalisieren
  const emotionalIntensity = calculateEmotionalIntensity(features);
  const structuralChange = calculateStructuralChange(features);

  // Harmonic-Features normalisieren
  const musicalComplexity = calculateMusicalComplexity(features);
  const tonalDirection = calculateTonalDirection(features);

  return {
    onsetPriority,
    phraseBoundaryStrength,
    beatAlignment,
    vocalDominance,
    vocalTiming,
    emotionalIntensity,
    structuralChange,
    musicalComplexity,
    tonalDirection,
  };
};

/**
 * Berechnet die Priorität von Onset-Features für Text-Synchronisation
 */
const calculateOnsetPriority = (features: WaveformPoint): number => {
  const onsetStrength = features.onsetStrength || 0;
  const onsetConfidence = features.onsetConfidence || 0;
  const onsetType = features.onsetType;

  let typeMultiplier = 1.0;
  if (onsetType === "section") typeMultiplier = 1.5; // Sections sind wichtig
  else if (onsetType === "phrase") typeMultiplier = 1.3; // Phrasen sind wichtig
  else if (onsetType === "beat")
    typeMultiplier = 1.1; // Beats sind mäßig wichtig
  else typeMultiplier = 0.8; // Allgemeine Onsets weniger wichtig

  return Math.min(1.0, onsetStrength * onsetConfidence * typeMultiplier);
};

/**
 * Berechnet die Beat-Alignment für präzise Timing
 */
const calculateBeatAlignment = (features: WaveformPoint): number => {
  const beatPosition = features.beatPosition || 0;
  const onsetStrength = features.onsetStrength || 0;

  // Beat-1 (Position 0) ist am wichtigsten
  const beat1Alignment = 1.0 - Math.abs(beatPosition - 0);
  // Off-Beat (Position 0.5) ist weniger wichtig
  const offBeatAlignment = 1.0 - Math.abs(beatPosition - 0.5) * 0.5;

  // Kombiniere mit Onset-Stärke
  return Math.min(1.0, (beat1Alignment + offBeatAlignment) * onsetStrength);
};

/**
 * Berechnet das Timing der Gesangs-Passagen
 */
const calculateVocalTiming = (features: WaveformPoint): number => {
  const vocalProbability = features.vocalProbability || 0;
  const vocalClarity = features.vocalClarity || 0;
  const onsetStrength = features.onsetStrength || 0;

  // Gesang + Onset = perfektes Timing für Text
  if (vocalProbability > 0.7 && onsetStrength > 0.6) {
    return 1.0;
  }

  // Gesang ohne Onset = Text läuft weiter
  if (vocalProbability > 0.7 && onsetStrength < 0.3) {
    return 0.7;
  }

  // Kein Gesang = wahrscheinlich Instrumental
  return vocalProbability * vocalClarity;
};

/**
 * Berechnet die emotionale Intensität
 */
const calculateEmotionalIntensity = (features: WaveformPoint): number => {
  const dynamicContrast = features.dynamicContrast || 0;
  const energyFlow = features.energyFlow || 0;
  const dissonanceLevel = features.dissonanceLevel || 0;
  const onsetStrength = features.onsetStrength || 0;

  // Dynamik + Energie + Dissonanz = emotionale Spannung
  const intensity =
    dynamicContrast * 0.4 + energyFlow * 0.3 + dissonanceLevel * 0.3;

  // Onset verstärkt emotionale Wirkung
  return Math.min(1.0, intensity * (1 + onsetStrength * 0.5));
};

/**
 * Berechnet strukturelle Änderungen
 */
const calculateStructuralChange = (features: WaveformPoint): number => {
  const phraseBoundary = features.phraseBoundary || 0;
  const onsetType = features.onsetType;
  const dynamicContrast = features.dynamicContrast || 0;

  let structuralScore = 0;

  // Phrase-Grenzen sind sehr wichtig
  if (phraseBoundary > 0.8) structuralScore += 0.6;

  // Section-Onsets markieren große Struktur-Änderungen
  if (onsetType === "section") structuralScore += 0.4;

  // Dynamik-Änderungen unterstützen Struktur
  structuralScore += dynamicContrast * 0.2;

  return Math.min(1.0, structuralScore);
};

/**
 * Berechnet die musikalische Komplexität
 */
const calculateMusicalComplexity = (features: WaveformPoint): number => {
  const harmonicRichness = features.harmonicRichness || 0;
  const chordComplexity = features.chordComplexity || 0;
  const rhythmicComplexity = features.rhythmicComplexity || 0;

  // Gewichtete Kombination der Komplexitäts-Features
  return Math.min(
    1.0,
    harmonicRichness * 0.4 + chordComplexity * 0.4 + rhythmicComplexity * 0.2
  );
};

/**
 * Berechnet die tonale Richtung
 */
const calculateTonalDirection = (features: WaveformPoint): number => {
  const tonalStability = features.tonalStability || 0;
  const dissonanceLevel = features.dissonanceLevel || 0;

  // Stabile Tonalität = klare Richtung
  if (tonalStability > 0.7) return 0.8;

  // Hohe Dissonanz = Richtungsänderung
  if (dissonanceLevel > 0.6) return 0.9;

  // Mittlere Stabilität
  return (tonalStability + dissonanceLevel) / 2;
};

/**
 * Berechnet die Gesamt-Priorität für verschiedene Analyse-Zwecke
 */
export const calculateFeaturePriority = (
  features: NormalizedFeatures,
  context: FeatureContext = {}
): FeaturePriority => {
  // Text-Synchronisation: Onset + Vocal sind kritisch
  const textSync = Math.min(
    1.0,
    features.onsetPriority * 0.4 +
      features.vocalDominance * 0.4 +
      features.phraseBoundaryStrength * 0.2
  );

  // Emotions-Analyse: Dynamic + Harmonic sind wichtig
  const emotion = Math.min(
    1.0,
    features.emotionalIntensity * 0.4 +
      features.musicalComplexity * 0.3 +
      features.tonalDirection * 0.3
  );

  // Struktur-Erkennung: Onset + Structural sind wichtig
  const structure = Math.min(
    1.0,
    features.onsetPriority * 0.5 +
      features.structuralChange * 0.3 +
      features.phraseBoundaryStrength * 0.2
  );

  // Rhythmus-Analyse: Beat + Onset sind wichtig
  const rhythm = Math.min(
    1.0,
    features.beatAlignment * 0.6 + features.onsetPriority * 0.4
  );

  return { textSync, emotion, structure, rhythm };
};

/**
 * Generiert kontext-bewusste Feature-Zusammenfassung für KI-Prompts
 */
export const generateFeatureSummary = (
  features: NormalizedFeatures,
  priority: FeaturePriority,
  context: FeatureContext = {}
): string => {
  let summary = "Audio-Feature-Analyse:\n";

  // Text-Synchronisation (höchste Priorität)
  if (priority.textSync > 0.7) {
    summary += `🎵 TEXT-SYNC (${Math.round(priority.textSync * 100)}%): `;
    if (features.onsetPriority > 0.6)
      summary += "Starker musikalischer Einsatz ";
    if (features.vocalDominance > 0.7) summary += "+ Gesang dominant ";
    if (features.phraseBoundaryStrength > 0.8)
      summary += "+ Neue Phrase beginnt ";
    summary += "\n";
  }

  // Emotions-Analyse
  if (priority.emotion > 0.6) {
    summary += `😊 EMOTION (${Math.round(priority.emotion * 100)}%): `;
    if (features.emotionalIntensity > 0.7)
      summary += "Hohe emotionale Intensität ";
    if (features.musicalComplexity > 0.6) summary += "+ Komplexe Harmonien ";
    summary += "\n";
  }

  // Struktur-Erkennung
  if (priority.structure > 0.6) {
    summary += `🏗️ STRUKTUR (${Math.round(priority.structure * 100)}%): `;
    if (features.structuralChange > 0.7) summary += "Strukturelle Änderung ";
    if (features.phraseBoundaryStrength > 0.8) summary += "+ Phrase-Grenze ";
    summary += "\n";
  }

  // Rhythmus-Analyse
  if (priority.rhythm > 0.6) {
    summary += `🥁 RHYTHMUS (${Math.round(priority.rhythm * 100)}%): `;
    if (features.beatAlignment > 0.7) summary += "Beat-synchronisiert ";
    if (features.onsetPriority > 0.6) summary += "+ Rhythmisches Onset ";
    summary += "\n";
  }

  // Kontext-Informationen
  if (context.tempo) {
    summary += `⏱️ Tempo: ${context.tempo} BPM\n`;
  }
  if (context.timePosition) {
    const position =
      context.timePosition > 0.8
        ? "Ende"
        : context.timePosition > 0.6
        ? "Später Teil"
        : context.timePosition > 0.3
        ? "Mittlerer Teil"
        : "Anfang";
    summary += `📍 Position: ${position} (${Math.round(
      context.timePosition * 100
    )}%)\n`;
  }

  return summary;
};
