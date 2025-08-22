import {
  PersistentAudioAnalysis,
  AudioCacheStatus,
  WaveformPoint,
  MerSuggestion,
  GEMS,
} from "../types";

// Konstanten für Cache-Verwaltung
const CACHE_VERSION = "1.0";
const MAX_CACHE_AGE_DAYS = 30;
const CACHE_STORAGE_KEY = "mea_audio_cache_v1";

// Hilfsfunktionen für Hash-Generierung
const generateWaveformHash = (waveform: WaveformPoint[]): string => {
  if (!waveform || waveform.length === 0) return "";

  // Erstelle einen kompakten Hash aus den ersten, mittleren und letzten Punkten
  const samplePoints = [
    ...waveform.slice(0, 10), // Erste 10 Punkte
    ...waveform.slice(
      Math.floor(waveform.length / 2) - 5,
      Math.floor(waveform.length / 2) + 5
    ), // Mittlere 10 Punkte
    ...waveform.slice(-10), // Letzte 10 Punkte
  ];

  const data = samplePoints
    .map(
      (p) =>
        `${p.amp?.toFixed(3) || 0}${p.spectralCentroid?.toFixed(3) || 0}${
          p.spectralFlux?.toFixed(3) || 0
        }`
    )
    .join("");

  // Einfacher Hash-Algorithmus
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
};

const generateContextHash = (context: string): string => {
  if (!context) return "";

  let hash = 0;
  for (let i = 0; i < context.length; i++) {
    const char = context.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
};

// Audio-Cache-Service
export class AudioCacheService {
  private static instance: AudioCacheService;
  private cache: Map<string, PersistentAudioAnalysis> = new Map();
  private cacheStatus: Map<string, AudioCacheStatus> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): AudioCacheService {
    if (!AudioCacheService.instance) {
      AudioCacheService.instance = new AudioCacheService();
    }
    return AudioCacheService.instance;
  }

  // Cache aus localStorage laden
  loadFromStorage(): void {
    try {
      const data = localStorage.getItem(CACHE_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.cache) {
          this.cache = new Map(Object.entries(parsed.cache));
        }
        if (parsed.status) {
          this.cacheStatus = new Map(Object.entries(parsed.status));
        }
      }
    } catch (error) {
      console.warn("Failed to load audio cache from storage:", error);
      this.cache = new Map();
      this.cacheStatus = new Map();
    }
  }

  // Cache in localStorage speichern
  saveToStorage(): void {
    try {
      const data = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        cache: Object.fromEntries(this.cache),
        status: Object.fromEntries(this.cacheStatus),
      };

      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save audio cache to storage:", error);
    }
  }

  // Prüfen ob Audio-Analyse gecacht ist
  hasCachedAnalysis(
    trackId: string,
    waveform: WaveformPoint[],
    context?: string
  ): boolean {
    const cached = this.cache.get(trackId);
    if (!cached) {
      return false;
    }

    const waveformHash = generateWaveformHash(waveform);
    const contextHash = context ? generateContextHash(context) : "";

    if (waveformHash !== cached.waveformHash) {
      return false;
    }

    if (context && contextHash !== cached.contextHash) {
      return false;
    }

    const isExpired =
      Date.now() - cached.timestamp > MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;

    if (isExpired) {
      return false;
    }

    return true;
  }

  // Gecachte Audio-Analyse abrufen
  getCachedAnalysis(trackId: string): PersistentAudioAnalysis | null {
    const cached = this.cache.get(trackId);
    if (!cached) return null;

    // Prüfe ob Cache abgelaufen ist
    const cacheAge = Date.now() - cached.timestamp;
    const maxAge = MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (cacheAge > maxAge) {
      this.removeCachedAnalysis(trackId);
      return null;
    }

    return cached;
  }

  // Audio-Analyse cachen
  cacheAnalysis(
    trackId: string,
    waveform: WaveformPoint[],
    suggestions: MerSuggestion[],
    context?: string
  ): void {
    const waveformHash = generateWaveformHash(waveform);
    const contextHash = context ? generateContextHash(context) : "";

    const analysis: PersistentAudioAnalysis = {
      waveform,
      suggestions,
      waveformHash,
      contextHash,
      timestamp: Date.now(),
      analysisVersion: CACHE_VERSION,
      isComplete: true,
      lastLyricsUpdate: context ? Date.now() : undefined,
    };

    this.cache.set(trackId, analysis);

    this.updateCacheStatus(trackId, true, true, false);
    this.saveToStorage();
  }

  // Cache-Status aktualisieren
  updateCacheStatus(
    trackId: string,
    hasAnalysis: boolean,
    hasWaveform: boolean,
    needsReanalysis: boolean,
    reason?: string
  ): void {
    const status: AudioCacheStatus = {
      hasAnalysis,
      hasWaveform,
      lastAnalysis: hasAnalysis ? Date.now() : 0,
      needsReanalysis,
      reason,
    };

    this.cacheStatus.set(trackId, status);
  }

  // Cache-Status abrufen
  getCacheStatus(trackId: string): AudioCacheStatus | null {
    return this.cacheStatus.get(trackId) || null;
  }

  // Gecachte Analyse entfernen
  removeCachedAnalysis(trackId: string): void {
    this.cache.delete(trackId);
    this.cacheStatus.delete(trackId);
    this.saveToStorage();
  }

  // Cache leeren
  clearCache(): void {
    this.cache.clear();
    this.cacheStatus.clear();
    this.saveToStorage();
  }

  // Cache-Statistiken
  getCacheStats(): {
    totalTracks: number;
    totalSize: number;
    oldestEntry: number;
  } {
    const totalTracks = this.cache.size;
    let totalSize = 0;
    let oldestEntry = Date.now();

    this.cache.forEach((analysis) => {
      // Grobe Größen-Schätzung
      totalSize += JSON.stringify(analysis).length;
      if (analysis.timestamp < oldestEntry) {
        oldestEntry = analysis.timestamp;
      }
    });

    return { totalTracks, totalSize, oldestEntry };
  }

  // Cache bereinigen (alte Einträge entfernen)
  cleanupCache(): void {
    const now = Date.now();
    const maxAge = MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;

    for (const [trackId, analysis] of this.cache.entries()) {
      if (now - analysis.timestamp > maxAge) {
        this.removeCachedAnalysis(trackId);
      }
    }
  }
}

// Export der Service-Instanz
export const audioCacheService = AudioCacheService.getInstance();
