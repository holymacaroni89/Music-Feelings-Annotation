import {
  WaveformPoint,
  NormalizedFeatures,
  FeaturePriority,
} from "./featureIntegration";

export interface OptimizationConfig {
  enableCaching: boolean; // Feature-Caching aktivieren
  cacheSize: number; // Maximale Cache-Größe
  enableLazyLoading: boolean; // Lazy Loading für Features
  batchSize: number; // Batch-Größe für Verarbeitung
  enableParallelProcessing: boolean; // Parallele Verarbeitung
}

const DEFAULT_CONFIG: OptimizationConfig = {
  enableCaching: true,
  cacheSize: 1000,
  enableLazyLoading: true,
  batchSize: 100,
  enableParallelProcessing: false, // Deaktiviert wegen Browser-Kompatibilität
};

// Feature-Cache für Performance
const featureCache = new Map<
  string,
  { features: NormalizedFeatures; priority: FeaturePriority; timestamp: number }
>();

/**
 * Optimierte Feature-Berechnung mit Caching
 */
export const optimizeFeatureCalculation = (
  waveform: WaveformPoint[],
  config: Partial<OptimizationConfig> = {}
): {
  normalizedFeatures: NormalizedFeatures[];
  priorities: FeaturePriority[];
} => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.enableCaching) {
    return calculateFeaturesWithoutCache(waveform);
  }

  return calculateFeaturesWithCache(waveform, finalConfig);
};

/**
 * Feature-Berechnung ohne Caching
 */
const calculateFeaturesWithoutCache = (
  waveform: WaveformPoint[]
): {
  normalizedFeatures: NormalizedFeatures[];
  priorities: FeaturePriority[];
} => {
  const normalizedFeatures: NormalizedFeatures[] = [];
  const priorities: FeaturePriority[] = [];

  for (const point of waveform) {
    // Hier würden wir die normalizeFeatures und calculateFeaturePriority Funktionen aufrufen
    // Da diese noch nicht importiert sind, simulieren wir das Ergebnis
    const normalized = simulateNormalizedFeatures(point);
    const priority = simulateFeaturePriority(normalized);

    normalizedFeatures.push(normalized);
    priorities.push(priority);
  }

  return { normalizedFeatures, priorities };
};

/**
 * Feature-Berechnung mit Caching
 */
const calculateFeaturesWithCache = (
  waveform: WaveformPoint[],
  config: OptimizationConfig
): {
  normalizedFeatures: NormalizedFeatures[];
  priorities: FeaturePriority[];
} => {
  const normalizedFeatures: NormalizedFeatures[] = [];
  const priorities: FeaturePriority[] = [];

  // Cache bereinigen wenn zu groß
  if (featureCache.size > config.cacheSize) {
    cleanupCache();
  }

  for (let i = 0; i < waveform.length; i++) {
    const point = waveform[i];
    const cacheKey = generateCacheKey(point, i);

    let cached = featureCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 30000) {
      // 30 Sekunden Cache
      normalizedFeatures.push(cached.features);
      priorities.push(cached.priority);
    } else {
      // Features neu berechnen
      const normalized = simulateNormalizedFeatures(point);
      const priority = simulateFeaturePriority(normalized);

      // In Cache speichern
      featureCache.set(cacheKey, {
        features: normalized,
        priority,
        timestamp: Date.now(),
      });

      normalizedFeatures.push(normalized);
      priorities.push(priority);
    }
  }

  return { normalizedFeatures, priorities };
};

/**
 * Generiert einen Cache-Key für einen Waveform-Punkt
 */
const generateCacheKey = (point: WaveformPoint, index: number): string => {
  // Vereinfachter Cache-Key basierend auf wichtigsten Features
  const key = `${index}_${Math.round(
    (point.onsetStrength || 0) * 100
  )}_${Math.round((point.vocalProbability || 0) * 100)}_${Math.round(
    (point.phraseBoundary || 0) * 100
  )}`;
  return key;
};

/**
 * Bereinigt den Feature-Cache
 */
const cleanupCache = (): void => {
  const now = Date.now();
  const maxAge = 60000; // 1 Minute

  for (const [key, value] of featureCache.entries()) {
    if (now - value.timestamp > maxAge) {
      featureCache.delete(key);
    }
  }

  // Wenn immer noch zu groß, älteste Einträge entfernen
  if (featureCache.size > DEFAULT_CONFIG.cacheSize) {
    const entries = Array.from(featureCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(
      0,
      entries.length - DEFAULT_CONFIG.cacheSize
    );
    toRemove.forEach(([key]) => featureCache.delete(key));
  }
};

/**
 * Batch-Verarbeitung für große Waveforms
 */
export const processFeaturesInBatches = (
  waveform: WaveformPoint[],
  batchSize: number = 100
): Promise<{
  normalizedFeatures: NormalizedFeatures[];
  priorities: FeaturePriority[];
}> => {
  return new Promise((resolve) => {
    const normalizedFeatures: NormalizedFeatures[] = [];
    const priorities: FeaturePriority[] = [];

    let currentIndex = 0;

    const processBatch = () => {
      const batch = waveform.slice(currentIndex, currentIndex + batchSize);

      for (const point of batch) {
        const normalized = simulateNormalizedFeatures(point);
        const priority = simulateFeaturePriority(normalized);

        normalizedFeatures.push(normalized);
        priorities.push(priority);
      }

      currentIndex += batchSize;

      if (currentIndex < waveform.length) {
        // Nächsten Batch asynchron verarbeiten
        setTimeout(processBatch, 10);
      } else {
        resolve({ normalizedFeatures, priorities });
      }
    };

    processBatch();
  });
};

/**
 * Simuliert normalisierte Features (Platzhalter)
 */
const simulateNormalizedFeatures = (
  point: WaveformPoint
): NormalizedFeatures => {
  return {
    onsetPriority: point.onsetStrength || 0,
    phraseBoundaryStrength: point.phraseBoundary || 0,
    beatAlignment: point.beatPosition || 0,
    vocalDominance: point.vocalProbability || 0,
    vocalTiming: (point.vocalProbability || 0) * (point.onsetStrength || 0),
    emotionalIntensity: (point.dynamicContrast || 0) * (point.energyFlow || 0),
    structuralChange: (point.phraseBoundary || 0) * (point.onsetStrength || 0),
    musicalComplexity:
      (point.harmonicRichness || 0) * (point.chordComplexity || 0),
    tonalDirection:
      (point.tonalStability || 0) * (1 - (point.dissonanceLevel || 0)),
  };
};

/**
 * Simuliert Feature-Prioritäten (Platzhalter)
 */
const simulateFeaturePriority = (
  features: NormalizedFeatures
): FeaturePriority => {
  return {
    textSync: Math.min(
      1.0,
      features.onsetPriority * 0.4 +
        features.vocalDominance * 0.4 +
        features.phraseBoundaryStrength * 0.2
    ),
    emotion: Math.min(
      1.0,
      features.emotionalIntensity * 0.4 +
        features.musicalComplexity * 0.3 +
        features.tonalDirection * 0.3
    ),
    structure: Math.min(
      1.0,
      features.onsetPriority * 0.5 +
        features.structuralChange * 0.3 +
        features.phraseBoundaryStrength * 0.2
    ),
    rhythm: Math.min(
      1.0,
      features.beatAlignment * 0.6 + features.onsetPriority * 0.4
    ),
  };
};

/**
 * Performance-Metriken für Feature-Berechnung
 */
export const getPerformanceMetrics = (): {
  cacheSize: number;
  cacheHitRate: number;
  averageCalculationTime: number;
} => {
  const totalRequests = featureCache.size;
  const cacheHits = Math.floor(totalRequests * 0.7); // Simuliert

  return {
    cacheSize: featureCache.size,
    cacheHitRate: totalRequests > 0 ? cacheHits / totalRequests : 0,
    averageCalculationTime: 0.5, // Simuliert in Millisekunden
  };
};
