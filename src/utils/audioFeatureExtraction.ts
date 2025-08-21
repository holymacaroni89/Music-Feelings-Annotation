export interface VocalPresenceFeatures {
  vocalProbability: number; // 0-1: Wahrscheinlichkeit von Gesang
  vocalClarity: number; // 0-1: Klarheit der Stimme
  vocalIntensity: number; // 0-1: Intensität der Stimme
  instrumentalRatio: number; // 0-1: Verhältnis Instrumental zu Gesang
}

export interface DynamicIntensityFeatures {
  localDynamics: number; // 0-1: Lokale Dynamik-Änderungen
  globalDynamics: number; // 0-1: Globale Dynamik über Zeit
  dynamicContrast: number; // 0-1: Kontrast zwischen laut/leise
  energyFlow: number; // 0-1: Energiefluss über Zeit
}

export interface HarmonicComplexityFeatures {
  harmonicRichness: number; // 0-1: Reichhaltigkeit der Harmonien
  dissonanceLevel: number; // 0-1: Dissonanz-Level
  chordComplexity: number; // 0-1: Akkord-Komplexität
  tonalStability: number; // 0-1: Tonale Stabilität
}

/**
 * Vocal-Presence-Detection basierend auf spektralen Eigenschaften
 * Gesang hat charakteristische Frequenzbereiche und Formanten
 */
export const detectVocalPresence = (
  magnitudes: Float32Array,
  sampleRate: number
): VocalPresenceFeatures => {
  // Gesang-Frequenzbereiche (80Hz - 8000Hz)
  const vocalLowFreq = 80;
  const vocalHighFreq = 8000;

  // Formant-Bereiche (charakteristische Resonanzen der Stimme)
  const formant1Range = [200, 800]; // Erster Formant
  const formant2Range = [800, 2000]; // Zweiter Formant
  const formant3Range = [2000, 3500]; // Dritter Formant

  let vocalEnergy = 0;
  let totalEnergy = 0;
  let formant1Energy = 0;
  let formant2Energy = 0;
  let formant3Energy = 0;

  for (let i = 1; i < magnitudes.length; i++) {
    const freq = (i * sampleRate) / (2 * magnitudes.length);
    const magnitude = magnitudes[i];
    const energy = magnitude * magnitude;

    totalEnergy += energy;

    // Gesang-Bereich
    if (freq >= vocalLowFreq && freq <= vocalHighFreq) {
      vocalEnergy += energy;
    }

    // Formant-Bereiche
    if (freq >= formant1Range[0] && freq <= formant1Range[1]) {
      formant1Energy += energy;
    }
    if (freq >= formant2Range[0] && freq <= formant2Range[1]) {
      formant2Energy += energy;
    }
    if (freq >= formant3Range[0] && freq <= formant3Range[1]) {
      formant3Energy += energy;
    }
  }

  // Vocal Probability basierend auf Energie-Verhältnis
  const vocalProbability = totalEnergy > 0 ? vocalEnergy / totalEnergy : 0;

  // Vocal Clarity basierend auf Formant-Stärke
  const formantStrength =
    (formant1Energy + formant2Energy + formant3Energy) / 3;
  const vocalClarity = totalEnergy > 0 ? formantStrength / totalEnergy : 0;

  // Vocal Intensity basierend auf Gesamt-Energie im Gesang-Bereich
  const vocalIntensity = Math.min(1.0, vocalEnergy / 0.1); // Normalisiert

  // Instrumental Ratio (Inverse von Vocal Probability)
  const instrumentalRatio = 1 - vocalProbability;

  return {
    vocalProbability,
    vocalClarity,
    vocalIntensity,
    instrumentalRatio,
  };
};

/**
 * Dynamic-Intensity-Analyse für Energiefluss und Dynamik
 */
export const analyzeDynamicIntensity = (
  amplitudes: number[],
  windowSize: number = 50
): DynamicIntensityFeatures => {
  if (amplitudes.length === 0) {
    return {
      localDynamics: 0,
      globalDynamics: 0,
      dynamicContrast: 0,
      energyFlow: 0,
    };
  }

  // Lokale Dynamik (Änderungen in kleinen Fenstern)
  let localDynamics = 0;
  for (let i = windowSize; i < amplitudes.length; i++) {
    const window = amplitudes.slice(i - windowSize, i);
    const windowVariance = calculateVariance(window);
    localDynamics += windowVariance;
  }
  localDynamics = Math.min(1.0, localDynamics / amplitudes.length);

  // Globale Dynamik (Gesamt-Amplituden-Varianz)
  const globalVariance = calculateVariance(amplitudes);
  const globalDynamics = Math.min(1.0, globalVariance);

  // Dynamik-Kontrast (Laut vs. Leise)
  const maxAmp = Math.max(...amplitudes);
  const minAmp = Math.min(...amplitudes);
  const dynamicContrast = maxAmp > 0 ? (maxAmp - minAmp) / maxAmp : 0;

  // Energiefluss (Trend der Amplituden über Zeit)
  const energyFlow = calculateEnergyFlow(amplitudes);

  return {
    localDynamics,
    globalDynamics,
    dynamicContrast,
    energyFlow,
  };
};

/**
 * Harmonische Komplexität für musikalische Analyse
 */
export const analyzeHarmonicComplexity = (
  magnitudes: Float32Array,
  sampleRate: number
): HarmonicComplexityFeatures => {
  // Harmonische Reichhaltigkeit (Peaks bei harmonischen Frequenzen)
  let harmonicPeaks = 0;
  let totalPeaks = 0;

  for (let i = 1; i < magnitudes.length - 1; i++) {
    const prev = magnitudes[i - 1];
    const curr = magnitudes[i];
    const next = magnitudes[i + 1];

    // Peak-Erkennung
    if (curr > prev && curr > next && curr > 0.1) {
      totalPeaks++;

      // Prüfe ob Peak bei harmonischer Frequenz liegt
      const freq = (i * sampleRate) / (2 * magnitudes.length);
      if (isHarmonicFrequency(freq)) {
        harmonicPeaks++;
      }
    }
  }

  const harmonicRichness = totalPeaks > 0 ? harmonicPeaks / totalPeaks : 0;

  // Dissonanz-Level (Energie bei dissonanten Intervallen)
  const dissonanceLevel = calculateDissonanceLevel(magnitudes, sampleRate);

  // Akkord-Komplexität (Anzahl gleichzeitiger Frequenz-Peaks)
  const chordComplexity = calculateChordComplexity(magnitudes);

  // Tonale Stabilität (Konsistenz der Grundfrequenz)
  const tonalStability = calculateTonalStability(magnitudes, sampleRate);

  return {
    harmonicRichness,
    dissonanceLevel,
    chordComplexity,
    tonalStability,
  };
};

// Hilfsfunktionen
const calculateVariance = (values: number[]): number => {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;

  return variance;
};

const calculateEnergyFlow = (amplitudes: number[]): number => {
  if (amplitudes.length < 2) return 0;

  let energyChange = 0;
  for (let i = 1; i < amplitudes.length; i++) {
    energyChange += Math.abs(amplitudes[i] - amplitudes[i - 1]);
  }

  return Math.min(1.0, energyChange / amplitudes.length);
};

const isHarmonicFrequency = (freq: number): boolean => {
  // Prüfe ob Frequenz nahe einer harmonischen Reihe liegt
  const baseFreq = 110; // A2 als Referenz
  const harmonic = Math.round(freq / baseFreq);
  const expectedFreq = harmonic * baseFreq;

  return Math.abs(freq - expectedFreq) < baseFreq * 0.1;
};

const calculateDissonanceLevel = (
  magnitudes: Float32Array,
  sampleRate: number
): number => {
  // Dissonante Intervalle: kleine Sekunde, Tritonus, etc.
  let dissonantEnergy = 0;
  let totalEnergy = 0;

  for (let i = 1; i < magnitudes.length; i++) {
    const freq = (i * sampleRate) / (2 * magnitudes.length);
    const magnitude = magnitudes[i];
    const energy = magnitude * magnitude;

    totalEnergy += energy;

    // Prüfe auf dissonante Intervalle
    if (isDissonantInterval(freq)) {
      dissonantEnergy += energy;
    }
  }

  return totalEnergy > 0 ? dissonantEnergy / totalEnergy : 0;
};

const isDissonantInterval = (freq: number): boolean => {
  // Vereinfachte Dissonanz-Erkennung
  const baseFreq = 440; // A4
  const ratio = freq / baseFreq;

  // Kleine Sekunde (Halbton)
  const minorSecond = Math.pow(2, 1 / 12);
  if (Math.abs(ratio - minorSecond) < 0.1) return true;

  // Tritonus (übermäßige Quarte)
  const tritone = Math.pow(2, 6 / 12);
  if (Math.abs(ratio - tritone) < 0.1) return true;

  return false;
};

const calculateChordComplexity = (magnitudes: Float32Array): number => {
  // Zähle gleichzeitige Frequenz-Peaks
  let peakCount = 0;
  let totalEnergy = 0;

  for (let i = 1; i < magnitudes.length - 1; i++) {
    const prev = magnitudes[i - 1];
    const curr = magnitudes[i];
    const next = magnitudes[i + 1];

    if (curr > prev && curr > next && curr > 0.1) {
      peakCount++;
    }

    totalEnergy += curr * curr;
  }

  // Normalisiere auf 0-1
  return Math.min(1.0, peakCount / 20); // Max 20 Peaks
};

const calculateTonalStability = (
  magnitudes: Float32Array,
  sampleRate: number
): number => {
  // Finde Grundfrequenz und prüfe Stabilität
  let fundamentalFreq = 0;
  let maxMagnitude = 0;

  for (let i = 1; i < magnitudes.length; i++) {
    if (magnitudes[i] > maxMagnitude) {
      maxMagnitude = magnitudes[i];
      fundamentalFreq = (i * sampleRate) / (2 * magnitudes.length);
    }
  }

  if (fundamentalFreq === 0) return 0;

  // Prüfe Stabilität der Grundfrequenz
  let stability = 0;
  const tolerance = fundamentalFreq * 0.05; // 5% Toleranz

  for (let i = 1; i < magnitudes.length; i++) {
    const freq = (i * sampleRate) / (2 * magnitudes.length);
    if (Math.abs(freq - fundamentalFreq) < tolerance) {
      stability += magnitudes[i];
    }
  }

  return Math.min(1.0, stability / maxMagnitude);
};
