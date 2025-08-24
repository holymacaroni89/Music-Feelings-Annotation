import { WaveformPoint } from "../types";

/**
 * Extrahiert Audio-Feature-Werte für einen spezifischen Zeitpunkt
 */
export const getTrackValueAtTime = (
  waveform: WaveformPoint[] | null,
  time: number,
  feature: keyof WaveformPoint
): number | null => {
  if (!waveform || waveform.length === 0) return null;

  // Finde den nächsten Waveform-Punkt für den Zeitpunkt
  const timeStep = waveform[0]?.timeStep || 0.1; // Standard: 0.1s Schritte
  const index = Math.round(time / timeStep);

  if (index >= 0 && index < waveform.length) {
    const point = waveform[index];
    const value = point[feature];

    if (typeof value === "number") {
      return value;
    }
  }

  return null;
};

/**
 * Formatiert Track-Werte für die Tooltip-Anzeige
 */
export const formatTrackValue = (
  value: number | null,
  feature: keyof WaveformPoint,
  unit?: string
): string => {
  if (value === null) return "N/A";

  switch (feature) {
    case "spectralCentroid":
      return `${(value * 20).toFixed(1)} kHz`;
    case "vocalProbability":
    case "vocalClarity":
    case "vocalIntensity":
    case "onsetStrength":
    case "harmonicRichness":
    case "localDynamics":
      return `${(value * 100).toFixed(0)}%`;
    case "tempoBpm":
      return `${value.toFixed(0)} BPM`;
    case "amplitude":
    case "amp":
      return `${(value * 100).toFixed(0)}%`;
    case "emotionIntensity":
      return `${(value * 100).toFixed(0)}%`;
    default:
      return unit ? `${value.toFixed(2)} ${unit}` : value.toFixed(2);
  }
};

/**
 * Extrahiert alle relevanten Track-Werte für einen Zeitpunkt
 */
export const getAudioFeatureSnapshot = (
  waveform: WaveformPoint[] | null,
  time: number
) => {
  if (!waveform) return null;

  const features = {
    spectral: getTrackValueAtTime(waveform, time, "spectralCentroid"),
    vocal: getTrackValueAtTime(waveform, time, "vocalProbability"),
    onset: getTrackValueAtTime(waveform, time, "onsetStrength"),
    harmonic: getTrackValueAtTime(waveform, time, "harmonicRichness"),
    dynamics: getTrackValueAtTime(waveform, time, "localDynamics"),
    amplitude:
      getTrackValueAtTime(waveform, time, "amplitude") ||
      getTrackValueAtTime(waveform, time, "amp"),
    tempo: getTrackValueAtTime(waveform, time, "tempoBpm"),
    energy: getTrackValueAtTime(waveform, time, "energyFlow"),
  };

  return features;
};

/**
 * Bestimmt die Farbe für Track-Werte basierend auf dem Wert
 */
export const getTrackValueColor = (
  value: number | null,
  feature: keyof WaveformPoint
): string => {
  if (value === null) return "#6B7280"; // Grau für N/A

  const normalizedValue = typeof value === "number" ? value : 0;

  switch (feature) {
    case "spectralCentroid":
      // Höhere Frequenzen = wärmere Farben
      return normalizedValue > 0.7
        ? "#F59E0B"
        : normalizedValue > 0.4
        ? "#10B981"
        : "#3B82F6";
    case "vocalProbability":
      // Höhere Wahrscheinlichkeit = intensivere Farben
      return normalizedValue > 0.7
        ? "#EC4899"
        : normalizedValue > 0.4
        ? "#F59E0B"
        : "#6B7280";
    case "onsetStrength":
      // Höhere Stärke = intensivere Farben
      return normalizedValue > 0.7
        ? "#EF4444"
        : normalizedValue > 0.4
        ? "#F59E0B"
        : "#6B7280";
    case "harmonicRichness":
      // Höhere Reichhaltigkeit = wärmere Farben
      return normalizedValue > 0.7
        ? "#8B5CF6"
        : normalizedValue > 0.4
        ? "#10B981"
        : "#6B7280";
    case "localDynamics":
      // Höhere Dynamik = intensivere Farben
      return normalizedValue > 0.7
        ? "#F97316"
        : normalizedValue > 0.4
        ? "#F59E0B"
        : "#6B7280";
    default:
      return "#6B7280";
  }
};

