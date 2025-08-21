export interface OnsetFeature {
  time: number; // Zeitstempel in Sekunden
  strength: number; // 0-1: Stärke des Einsatzes
  type: "beat" | "phrase" | "section" | "onset"; // Art des Einsatzes
  confidence: number; // 0-1: Konfidenz der Erkennung
  frequency?: number; // Dominante Frequenz (optional)
  amplitude?: number; // Amplitude zum Zeitpunkt (optional)
}

export interface OnsetDetectionConfig {
  segmentSize: number; // Größe der Audio-Segmente (Samples)
  hopSize: number; // Überlappung zwischen Segmenten
  onsetThreshold: number; // Schwellenwert für Onset-Erkennung
  minOnsetInterval: number; // Minimaler Abstand zwischen Onsets (Sekunden)
  spectralFluxWeight: number; // Gewichtung für spektrale Änderungen
  amplitudeWeight: number; // Gewichtung für Amplituden-Änderungen
}

const DEFAULT_CONFIG: OnsetDetectionConfig = {
  segmentSize: 512,
  hopSize: 256,
  onsetThreshold: 0.3,
  minOnsetInterval: 0.1,
  spectralFluxWeight: 0.6,
  amplitudeWeight: 0.4,
};

/**
 * Berechnet die spektrale Flux zwischen zwei Audio-Segmenten
 * Misst Änderungen im Frequenzspektrum - wichtig für Onset-Erkennung
 */
const calculateSpectralFlux = (
  currentSegment: Float32Array,
  previousSegment: Float32Array
): number => {
  if (!previousSegment || previousSegment.length === 0) return 0;

  let flux = 0;
  for (let i = 0; i < currentSegment.length; i++) {
    const diff = Math.abs(currentSegment[i] - previousSegment[i]);
    flux += diff * diff;
  }

  return Math.sqrt(flux / currentSegment.length);
};

/**
 * Berechnet die Amplituden-Änderung zwischen Segmenten
 * Erkennt plötzliche Lautstärke-Änderungen
 */
const calculateAmplitudeChange = (
  currentSegment: Float32Array,
  previousSegment: Float32Array
): number => {
  if (!previousSegment || previousSegment.length === 0) return 0;

  const currentRMS = Math.sqrt(
    currentSegment.reduce((sum, sample) => sum + sample * sample, 0) /
      currentSegment.length
  );

  const previousRMS = Math.sqrt(
    previousSegment.reduce((sum, sample) => sum + sample * sample, 0) /
      previousSegment.length
  );

  return Math.abs(currentRMS - previousRMS) / Math.max(previousRMS, 0.001);
};

/**
 * Klassifiziert den Typ eines Onsets basierend auf Stärke und Kontext
 */
const classifyOnsetType = (
  strength: number,
  time: number,
  previousOnsets: OnsetFeature[]
): "beat" | "phrase" | "section" | "onset" => {
  // Sehr starke Einsätze sind meist Sections (Verse/Chorus)
  if (strength > 0.8) return "section";

  // Starke Einsätze sind meist Phrasen
  if (strength > 0.6) return "phrase";

  // Mittlere Einsätze sind meist Beats
  if (strength > 0.4) return "beat";

  // Schwache Einsätze sind allgemeine Onsets
  return "onset";
};

/**
 * Berechnet die Konfidenz eines Onsets basierend auf Stärke und Kontext
 */
const calculateConfidence = (
  strength: number,
  time: number,
  previousOnsets: OnsetFeature[]
): number => {
  let confidence = strength;

  // Höhere Konfidenz wenn Onset in regelmäßigen Abständen
  const recentOnsets = previousOnsets.filter(
    (o) => Math.abs(o.time - time) < 2.0
  );

  if (recentOnsets.length > 0) {
    const intervals = [];
    for (let i = 1; i < recentOnsets.length; i++) {
      intervals.push(recentOnsets[i].time - recentOnsets[i - 1].time);
    }

    if (intervals.length > 0) {
      const avgInterval =
        intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
      const timeSinceLast =
        time - (recentOnsets[recentOnsets.length - 1]?.time || 0);

      // Höhere Konfidenz wenn Timing konsistent ist
      const timingConsistency =
        1 - Math.abs(timeSinceLast - avgInterval) / avgInterval;
      confidence = (confidence + timingConsistency) / 2;
    }
  }

  return Math.min(confidence, 1.0);
};

/**
 * Hauptfunktion: Erkennt Onsets in einem AudioBuffer
 */
export const detectOnsets = (
  audioBuffer: AudioBuffer,
  config: Partial<OnsetDetectionConfig> = {}
): OnsetFeature[] => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const onsets: OnsetFeature[] = [];

  const channelData = audioBuffer.getChannelData(0); // Mono-Analyse
  const sampleRate = audioBuffer.sampleRate;

  // Audio in Segmente aufteilen
  for (
    let i = 0;
    i < channelData.length - finalConfig.segmentSize;
    i += finalConfig.hopSize
  ) {
    const currentSegment = channelData.slice(i, i + finalConfig.segmentSize);
    const previousSegment =
      i > 0
        ? channelData.slice(
            i - finalConfig.hopSize,
            i - finalConfig.hopSize + finalConfig.segmentSize
          )
        : new Float32Array(finalConfig.segmentSize);

    // Spektrale Flux berechnen
    const spectralFlux = calculateSpectralFlux(currentSegment, previousSegment);

    // Amplituden-Änderung berechnen
    const amplitudeChange = calculateAmplitudeChange(
      currentSegment,
      previousSegment
    );

    // Kombinierte Onset-Stärke
    const onsetStrength =
      spectralFlux * finalConfig.spectralFluxWeight +
      amplitudeChange * finalConfig.amplitudeWeight;

    // Onset-Threshold prüfen
    if (onsetStrength > finalConfig.onsetThreshold) {
      const time = i / sampleRate;

      // Minimalen Abstand zu vorherigen Onsets prüfen
      const lastOnset = onsets[onsets.length - 1];
      if (!lastOnset || time - lastOnset.time >= finalConfig.minOnsetInterval) {
        const onsetType = classifyOnsetType(onsetStrength, time, onsets);
        const confidence = calculateConfidence(onsetStrength, time, onsets);

        onsets.push({
          time,
          strength: onsetStrength,
          type: onsetType,
          confidence,
          amplitude: Math.sqrt(
            currentSegment.reduce((sum, sample) => sum + sample * sample, 0) /
              currentSegment.length
          ),
        });
      }
    }
  }

  return onsets;
};

/**
 * Erkennt Beat-Patterns in den Onsets
 */
export const detectBeatPattern = (onsets: OnsetFeature[]): number => {
  const beatOnsets = onsets.filter(
    (o) => o.type === "beat" || o.type === "onset"
  );

  if (beatOnsets.length < 3) return 0;

  const intervals: number[] = [];
  for (let i = 1; i < beatOnsets.length; i++) {
    intervals.push(beatOnsets[i].time - beatOnsets[i - 1].time);
  }

  // Durchschnittliches Beat-Intervall
  const avgInterval =
    intervals.reduce((sum, int) => sum + int, 0) / intervals.length;

  // BPM berechnen
  return Math.round(60 / avgInterval);
};

/**
 * Erkennt Phrase-Grenzen basierend auf Section-Onsets
 */
export const detectPhraseBoundaries = (onsets: OnsetFeature[]): number[] => {
  return onsets
    .filter((o) => o.type === "section" || o.type === "phrase")
    .map((o) => o.time);
};
