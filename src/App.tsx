import React, { useState, useRef, useEffect, useCallback } from "react";
import { XIcon } from "./components/icons";
import Header from "./components/Header";
import Workspace from "./components/Workspace";
import Footer from "./components/Footer";
import LabelPanel from "./components/LabelPanel";
import Modal from "./components/Modal";
import SettingsModal from "./components/SettingsModal";
import BottomNavigation from "./components/BottomNavigation";
import GeniusSearchModal from "./components/GeniusSearchModal";
import { Button } from "./components/ui/button";
import { SparklesIcon, SpinnerIcon } from "./components/icons";
import {
  Marker,
  WaveformPoint,
  TrackInfo,
  MerSuggestion,
  ColorPalette,
  Profile,
  TrainingSample,
  AppState,
  GeniusSongDetails,
  TrackData,
  TrackRenderConfig,
} from "./types";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useAnnotationSystem } from "./hooks/useAnnotationSystem";
import { stringToHash } from "./utils/hash";
import { cleanFileName } from "./utils/fileNameParser";
import { handleExport, handleImport } from "./utils/importExport";
import { indexedDBService, fallbackStorage } from "./services/indexedDBService";
import { generateMerSuggestions } from "./services/geminiService";
import { clearAnalysisCache } from "./services/geminiService";

// --- Main App Component ---
const App: React.FC = () => {
  const hasGeminiKey: boolean = !!(import.meta as any).env?.VITE_GOOGLE_API_KEY;
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
  const [zoom, setZoom] = useState(50);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showDebugModal, setShowDebugModal] = useState(false);

  // Visualization Settings
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [pipelineResults, setPipelineResults] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [currentValidation, setCurrentValidation] = useState<any>(null);
  const [validationStep, setValidationStep] = useState<
    "setup" | "validating" | "complete"
  >("setup");
  const [waveformDetail, setWaveformDetail] = useState(2000);
  const [colorPalette, setColorPalette] = useState<ColorPalette>("vibrant");

  // Neue Multi-Track States
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [trackHeight, setTrackHeight] = useState(80);
  const [trackSpacing, setTrackSpacing] = useState(4);
  const [trackRenderConfig, setTrackRenderConfig] = useState<TrackRenderConfig>(
    {
      showGrid: true,
      showLabels: true,
      showValues: false,
      interpolation: "smooth",
      fillStyle: "gradient",
    }
  );

  // Multi-Track Event Handler
  const handleTrackClick = useCallback(
    (trackId: string, time: number, trackIndex: number) => {
      console.log(
        `Track ${trackId} clicked at time ${time}s, index ${trackIndex}`
      );
      // Hier können wir später erweiterte Track-Interaktionen hinzufügen
    },
    []
  );

  const handleTrackHover = useCallback(
    (trackId: string, time: number, trackIndex: number) => {
      // Optional: Tooltip oder andere Hover-Effekte
    },
    []
  );

  const handleTrackVisibilityChange = useCallback(
    (trackId: string, visible: boolean) => {
      setTracks((prev) =>
        prev.map((track) =>
          track.id === trackId ? { ...track, visible } : track
        )
      );
    },
    []
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // State für IndexedDB-Status
  const [isIndexedDBReady, setIsIndexedDBReady] = useState(false);

  // IndexedDB-Initialisierung
  useEffect(() => {
    const initIndexedDB = async () => {
      try {
        await indexedDBService.init();
        setIsIndexedDBReady(true);
      } catch (error) {
        console.warn("IndexedDB nicht verfügbar:", error);
      }
    };

    initIndexedDB();
  }, []);

  const {
    audioContext,
    audioBuffer,
    isPlaying,
    currentTime,
    volume,
    setVolume,
    initializeAudio,
    generateWaveform,
    resetAudio,
    scrub,
    togglePlayPause,
  } = useAudioEngine();

  // Lokaler waveform State für die App
  const [waveform, setWaveform] = useState<any[] | null>(null);

  const {
    markers,
    setMarkers,
    selectedMarkerId,
    setSelectedMarkerId,
    pendingMarkerStart,
    setPendingMarkerStart,
    merSuggestions,
    setMerSuggestions, // Neue Import für AI-Suggestions-Persistierung
    songContext,
    setSongContext,
    profiles,
    activeProfileId,
    setActiveProfileId,
    trainingDataCount,
    trainingStatus,
    modalConfig,
    setModalConfig,
    modalInputValue,
    setModalInputValue,
    isDirty,
    setIsDirty,
    updateMarker,
    deleteMarker,
    handleMarkerCreationToggle,
    handleSuggestionClick,
    analyzeEmotions,
    refineProfile,
    openModal,
    openManualLyricsModal,
    handleModalSubmit,
    MIN_TRAINING_SAMPLES,
    geniusSearchState,
    searchGenius,
    selectGeniusSong,
    confirmGeniusSelection,
    backToGeniusSearch,
  } = useAnnotationSystem(trackInfo);

  // Ref für Wiederherstellungs-Status
  const isRestoringRef = useRef(false);

  // Ref für "bereits ausgeführt" Status
  const hasRunRef = useRef(false);

  // AI Suggestions Manager - Lädt und speichert AI-generierte Marker
  const suggestionsManager = useCallback(
    async (trackId: string) => {
      try {
        // Check if AI suggestions already exist in IndexedDB
        const hasCachedSuggestions = await indexedDBService.hasSuggestions(
          trackId
        );

        if (hasCachedSuggestions) {
          const cachedSuggestions = await indexedDBService.loadSuggestions(
            trackId
          );
          if (cachedSuggestions) {
            setMerSuggestions(cachedSuggestions);
            return;
          }
        }

        setMerSuggestions([]);
      } catch (error) {
        console.warn("Fehler im AI-Suggestions Manager:", error);
        setMerSuggestions([]);
      }
    },
    [setMerSuggestions]
  );

  // Separate Funktion für DB-Wiederherstellung
  const restoreFromIndexedDB = useCallback(async () => {
    // Verhindere mehrfache Ausführung
    if (isRestoringRef.current) {
      return;
    }

    isRestoringRef.current = true;

    try {
      const savedState = await indexedDBService.loadAppState();

      if (savedState?.currentTrackLocalId) {
        const trackMetadata =
          savedState.trackMetadata[savedState.currentTrackLocalId];
        if (trackMetadata) {
          // Lade zuerst die AI-Suggestions
          try {
            await suggestionsManager(savedState.currentTrackLocalId);
          } catch (suggestionsError) {
            console.warn(
              "Fehler beim Laden der AI-Suggestions:",
              suggestionsError
            );
          }

          // Lade die Audio-Datei aus der DB
          try {
            const audioFile = await indexedDBService.loadAudioFile(
              trackMetadata.name
            );
            if (audioFile) {
              // Lade das Waveform aus der DB
              const cachedWaveform = await indexedDBService.loadWaveform(
                savedState.currentTrackLocalId
              );
              if (cachedWaveform) {
                setWaveform(cachedWaveform);
              }

              // Lade den AudioBuffer aus der DB
              try {
                if (audioFile.arrayBuffer && audioContext) {
                  const decodedBuffer = await audioContext.decodeAudioData(
                    audioFile.arrayBuffer
                  );
                  initializeAudio(decodedBuffer);
                }
              } catch (decodeError) {
                console.warn(
                  "Fehler beim Dekodieren der Audio-Datei:",
                  decodeError
                );
              }

              // Setze trackInfo
              const restoredTrackInfo: TrackInfo = {
                localId: savedState.currentTrackLocalId,
                name: trackMetadata.name,
                duration_s: trackMetadata.duration,
                title: trackMetadata.title,
                artist: trackMetadata.artist,
              };
              setTrackInfo(restoredTrackInfo);
            }
          } catch (audioError) {
            console.warn("Fehler beim Laden der Audio-Datei:", audioError);
          }
        }
      }
    } catch (error) {
      console.warn("Fehler beim Wiederherstellen des TrackInfo:", error);
    } finally {
      // Entsperre die Wiederherstellung
      isRestoringRef.current = false;
    }
  }, [suggestionsManager, audioContext, initializeAudio]);

  // Effect für DB-Wiederherstellung nach IndexedDB-Initialisierung
  useEffect(() => {
    // Warte bis IndexedDB bereit ist
    if (!isIndexedDBReady) {
      return;
    }

    // Verhindere mehrfache Ausführung des useEffect
    if (hasRunRef.current) {
      return;
    }

    hasRunRef.current = true;

    const startRestore = async () => {
      try {
        await restoreFromIndexedDB();
      } catch (error) {
        console.warn("Fehler bei der DB-Wiederherstellung:", error);
      }
    };

    // Starte sofort, da IndexedDB bereits bereit ist
    startRestore();
  }, [isIndexedDBReady, restoreFromIndexedDB]);

  // Entfernt: Der zweite useEffect für DB-Wiederherstellung ist nicht mehr nötig,
  // da der erste useEffect nach IndexedDB-Init jetzt alles übernimmt

  // Simplified Waveform Manager - replaces complex useEffect chains
  const waveformManager = useCallback(
    async (audioBuffer: AudioBuffer, trackInfo: TrackInfo) => {
      try {
        // Check if waveform already exists in IndexedDB
        const hasCachedWaveform = await indexedDBService.hasWaveform(
          trackInfo.localId
        );

        if (hasCachedWaveform) {
          const cachedWaveform = await indexedDBService.loadWaveform(
            trackInfo.localId
          );
          if (cachedWaveform) {
            setWaveform(cachedWaveform);
            return;
          }
        }

        // Generate new waveform
        setIsProcessing(true);
        setProcessingMessage("Generating audio waveform...");

        // Generate waveform and get the result
        const newWaveform = await generateWaveform(audioBuffer, waveformDetail);

        if (newWaveform && newWaveform.length > 0) {
          // Save to IndexedDB
          await indexedDBService.saveWaveform(trackInfo.localId, newWaveform);

          // Update state (already done by generateWaveform, but ensure it's set)
          setWaveform(newWaveform);
        }
      } catch (error) {
        console.error("❌ [App] Fehler im Waveform Manager:", error);
      } finally {
        setIsProcessing(false);
        setProcessingMessage("");
      }
    },
    [generateWaveform, waveformDetail, setWaveform]
  );

  // Simple effect to trigger waveform generation when both audioBuffer and trackInfo are available
  useEffect(() => {
    if (audioBuffer && trackInfo && !waveform) {
      waveformManager(audioBuffer, trackInfo);
    }
  }, [audioBuffer, trackInfo, waveform, waveformManager]);

  // Effect to generate tracks from waveform when available
  useEffect(() => {
    if (waveform && waveform.length > 0) {
      // Generiere Tracks aus Waveform-Daten
      const generatedTracks: TrackData[] = [
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
        generatedTracks.push({
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

      setTracks(generatedTracks);
    }
  }, [waveform, trackHeight]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !audioContext) {
        if (e.target) e.target.value = "";
        return;
      }

      setIsProcessing(true);
      setProcessingMessage("Decoding audio file...");

      resetAudio();

      try {
        const arrayBuffer = await file.arrayBuffer();

        // ArrayBuffer kopieren, bevor er detached wird
        const arrayBufferCopy = arrayBuffer.slice(0);

        const decodedBuffer = await audioContext.decodeAudioData(
          arrayBufferCopy
        );

        // ArrayBuffer nach decodeAudioData neu kopieren (da er detached wurde)
        const arrayBufferForStorage = arrayBuffer.slice(0);

        const localId = `${stringToHash(file.name)}-${file.size}`;
        const { title, artist } = cleanFileName(file.name);
        const newTrackInfo: TrackInfo = {
          localId,
          name: file.name,
          duration_s: decodedBuffer.duration,
          title,
          artist,
        };

        setTrackInfo(newTrackInfo);
        initializeAudio(decodedBuffer);

        // Audio-Datei in IndexedDB speichern (kein Base64-Overhead)
        try {
          const audioFileData = {
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
            arrayBuffer: arrayBufferForStorage, // Direkter ArrayBuffer (kein Base64)
            duration: decodedBuffer.duration,
            channels: decodedBuffer.numberOfChannels,
            sampleRate: decodedBuffer.sampleRate,
          };

          await indexedDBService.saveAudioFile(audioFileData);

          // App State in IndexedDB speichern (für Wiederherstellung)
          try {
            const appState = {
              currentTrackLocalId: localId, // Verwende localId direkt, nicht trackInfo.localId
              trackMetadata: {
                [localId]: {
                  name: file.name,
                  size: file.size,
                  lastModified: file.lastModified,
                  duration: decodedBuffer.duration,
                  title,
                  artist,
                },
              },
              markers: [],
              profiles: [],
              activeProfileId: null,
              songContext: {},
              suggestions: {}, // Neue Eigenschaft für AI-Suggestions
            };

            await indexedDBService.saveAppState(appState);
          } catch (stateError) {
            console.warn(
              "⚠️ [IndexedDB] Fehler beim Speichern des App States:",
              stateError
            );
          }
        } catch (error) {
          console.warn(
            "⚠️ [IndexedDB] Fehler beim Speichern der Audio-Datei, verwende Fallback:",
            error
          );
          // Fallback: Kleine Metadaten in localStorage
          const fallbackData = {
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
            duration: decodedBuffer.duration,
          };
          localStorage.setItem(
            "music-emotion-annotation-audio-metadata",
            JSON.stringify(fallbackData)
          );
        }

        setIsDirty(true);
      } catch (err) {
        alert(
          `Error decoding audio data: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        setTrackInfo(null);
        setIsDirty(false);
      } finally {
        setIsProcessing(false);
        setProcessingMessage("");
        if (e.target) e.target.value = "";
      }
    },
    [audioContext, initializeAudio, resetAudio]
  );

  const handleAnalyzeEmotions = async () => {
    if (!waveform || !trackInfo) return;

    setIsProcessing(true);
    setProcessingMessage("Analyzing emotions with AI...");

    try {
      // Nur 1x AI-Aufruf - direkt hier
      const currentSuggestions = await generateMerSuggestions(
        waveform,
        trackInfo.duration_s,
        trackInfo ? songContext[trackInfo.localId] : undefined,
        trackInfo?.localId
      );

      // State korrekt aktualisieren
      setMerSuggestions(currentSuggestions);

      // In DB speichern
      if (currentSuggestions.length > 0) {
        try {
          await indexedDBService.saveSuggestions(
            trackInfo.localId,
            currentSuggestions
          );
        } catch (saveError) {
          console.warn(
            "⚠️ [App] Fehler beim Speichern der AI-Suggestions:",
            saveError
          );
        }
      }

      setIsDirty(true);
    } catch (error) {
      console.error("AI analysis failed:", error);

      // Behalte bestehende Suggestions bei, falls vorhanden
      if (merSuggestions.length > 0) {
        // Behalte bestehende Suggestions
      } else {
        // Nur bei Fehler und ohne bestehende Suggestions: Leere Liste setzen
        setMerSuggestions([]);
      }

      // Zeige benutzerfreundliche Fehlermeldung
      alert(
        "Could not get emotion analysis from the AI. Please check your API key and network connection. Existing markers and suggestions are preserved."
      );
      setIsDirty(false);
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const handlePipelineTest = async () => {
    if (!waveform || !trackInfo) return;
    setIsProcessing(true);
    setProcessingMessage("Führe Pipeline-Test durch...");
    try {
      const currentSuggestions = await generateMerSuggestions(
        waveform,
        trackInfo.duration_s,
        trackInfo ? songContext[trackInfo.localId] : undefined,
        trackInfo?.localId
      );

      const pipelineResult = {
        fileName: trackInfo.name,
        timestamp: new Date().toISOString(),
        lyrics: !!(trackInfo && songContext[trackInfo.localId]),
        response: { suggestions: currentSuggestions },
        quality: calculatePipelineQuality(currentSuggestions),
      };

      setPipelineResults((prev) => [...prev, pipelineResult]);

      // Starte Validierung
      setCurrentValidation({
        ...pipelineResult,
        validations: currentSuggestions.map((suggestion: any) => ({
          suggestion,
          timingAccuracy: 5,
          lyricsCorrelation: 5,
          visualCueRecognition: 5,
          overallRating: 5,
          notes: "",
        })),
      });

      setValidationStep("validating");
      setProcessingMessage("Pipeline-Test erfolgreich! Starte Validierung...");
    } catch (error) {
      console.error("Pipeline test failed:", error);
      alert(
        "Pipeline-Test fehlgeschlagen. Bitte überprüfe deine API-Keys und Netzwerkverbindung."
      );
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const handleForceReAnalysis = async () => {
    if (!waveform || !trackInfo) return;

    // Cache für aktuelle Datei löschen
    clearAnalysisCache(trackInfo.localId);

    setIsProcessing(true);
    setProcessingMessage("Erzwinge neue AI-Analyse...");

    try {
      const currentSuggestions = await generateMerSuggestions(
        waveform,
        trackInfo.duration_s,
        trackInfo ? songContext[trackInfo.localId] : undefined,
        trackInfo?.localId
      );

      const pipelineResult = {
        fileName: trackInfo.name,
        timestamp: new Date().toISOString(),
        lyrics: !!(trackInfo && songContext[trackInfo.localId]),
        response: { suggestions: currentSuggestions },
        quality: calculatePipelineQuality(currentSuggestions),
        forcedReAnalysis: true, // Markiere als erzwungene Neu-Analyse
      };

      setPipelineResults((prev) => [...prev, pipelineResult]);

      // Starte Validierung
      setCurrentValidation({
        ...pipelineResult,
        validations: currentSuggestions.map((suggestion: any) => ({
          suggestion,
          timingAccuracy: 5,
          lyricsCorrelation: 5,
          visualCueRecognition: 5,
          overallRating: 5,
          notes: "",
        })),
      });

      setValidationStep("validating");
      setProcessingMessage(
        "Neue AI-Analyse erfolgreich! Starte Validierung..."
      );
    } catch (error) {
      console.error("Forced re-analysis failed:", error);
      alert(
        "Erzwungene Neu-Analyse fehlgeschlagen. Bitte überprüfe deine API-Keys und Netzwerkverbindung."
      );
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const handleValidationComplete = () => {
    if (!currentValidation) return;

    const validationResult = {
      ...currentValidation,
      validationTimestamp: new Date().toISOString(),
      validationMetrics: calculateValidationMetrics(
        currentValidation.validations
      ),
      userValidations: currentValidation.validations,
    };

    setValidationResults((prev) => [...prev, validationResult]);
    setValidationStep("complete");
    setCurrentValidation(null);
  };

  const updateValidation = (
    suggestionIndex: number,
    field: string,
    value: number | string
  ) => {
    if (!currentValidation) return;

    const updatedValidations = [...currentValidation.validations];
    updatedValidations[suggestionIndex] = {
      ...updatedValidations[suggestionIndex],
      [field]: value,
    };

    // Berechne overall rating
    const validation = updatedValidations[suggestionIndex];
    const overallRating = Math.round(
      (validation.timingAccuracy +
        validation.lyricsCorrelation +
        validation.visualCueRecognition) /
        3
    );

    updatedValidations[suggestionIndex].overallRating = overallRating;

    setCurrentValidation({
      ...currentValidation,
      validations: updatedValidations,
    });
  };

  const calculateValidationMetrics = (validations: any[]) => {
    if (validations.length === 0) return {};

    const metrics = {
      avgTimingAccuracy: 0,
      avgLyricsCorrelation: 0,
      avgVisualCueRecognition: 0,
      avgOverallRating: 0,
      totalSuggestions: validations.length,
    };

    validations.forEach((v) => {
      metrics.avgTimingAccuracy += v.timingAccuracy;
      metrics.avgLyricsCorrelation += v.lyricsCorrelation;
      metrics.avgVisualCueRecognition += v.visualCueRecognition;
      metrics.avgOverallRating += v.overallRating;
    });

    metrics.avgTimingAccuracy = Math.round(
      metrics.avgTimingAccuracy / validations.length
    );
    metrics.avgLyricsCorrelation = Math.round(
      metrics.avgLyricsCorrelation / validations.length
    );
    metrics.avgVisualCueRecognition = Math.round(
      metrics.avgVisualCueRecognition / validations.length
    );
    metrics.avgOverallRating = Math.round(
      metrics.avgOverallRating / validations.length
    );

    return metrics;
  };

  const calculatePipelineQuality = (suggestions: any[]) => {
    if (suggestions.length === 0) return 0;
    let totalConfidence = 0;
    let totalIntensity = 0;
    let hasValidGems = 0;
    suggestions.forEach((s) => {
      totalConfidence += s.confidence || 0;
      totalIntensity += s.intensity || 0;
      if (s.gems && s.gems.length > 0) hasValidGems++;
    });
    const avgConfidence = totalConfidence / suggestions.length;
    const avgIntensity = totalIntensity / suggestions.length;
    const gemsCoverage = hasValidGems / suggestions.length;
    return (
      (avgConfidence * 0.4 + (avgIntensity / 100) * 0.3 + gemsCoverage * 0.3) *
      100
    );
  };

  const exportPipelineResults = () => {
    if (validationResults.length === 0) {
      alert("Keine Validierungsergebnisse zum Exportieren vorhanden.");
      return;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      pipelineVersion: "2.0.0",
      trackInfo: trackInfo
        ? {
            name: trackInfo.name,
            duration: trackInfo.duration_s,
            hasLyrics: !!(trackInfo && songContext[trackInfo.localId]),
          }
        : null,
      validationResults,
      summary: {
        totalValidations: validationResults.length,
        avgTimingAccuracy: (
          validationResults.reduce(
            (sum, r) => sum + r.validationMetrics.avgTimingAccuracy,
            0
          ) / validationResults.length
        ).toFixed(1),
        avgLyricsCorrelation: (
          validationResults.reduce(
            (sum, r) => sum + r.validationMetrics.avgLyricsCorrelation,
            0
          ) / validationResults.length
        ).toFixed(1),
        avgVisualCueRecognition: (
          validationResults.reduce(
            (sum, r) => sum + r.validationMetrics.avgVisualCueRecognition,
            0
          ) / validationResults.length
        ).toFixed(1),
        avgOverallRating: (
          validationResults.reduce(
            (sum, r) => sum + r.validationMetrics.avgOverallRating,
            0
          ) / validationResults.length
        ).toFixed(1),
      },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pipeline-validation-results-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert("Validierungsergebnisse erfolgreich exportiert!");
  };

  const copyValidationResultsToClipboard = async () => {
    if (validationResults.length === 0) {
      alert("Keine Validierungsergebnisse zum Kopieren vorhanden.");
      return;
    }

    try {
      const summaryText = `🧪 Timeline-Validierung Pipeline Ergebnisse

📊 Zusammenfassung:
• Gesamt-Validierungen: ${validationResults.length}
• Durchschnittliche Timing-Genauigkeit: ${(
        validationResults.reduce(
          (sum, r) => sum + r.validationMetrics.avgTimingAccuracy,
          0
        ) / validationResults.length
      ).toFixed(1)}/10
• Durchschnittliche Lyrics-Korrelation: ${(
        validationResults.reduce(
          (sum, r) => sum + r.validationMetrics.avgLyricsCorrelation,
          0
        ) / validationResults.length
      ).toFixed(1)}/10
• Durchschnittliche Visuelle Cue-Erkennung: ${(
        validationResults.reduce(
          (sum, r) => sum + r.validationMetrics.avgVisualCueRecognition,
          0
        ) / validationResults.length
      ).toFixed(1)}/10
• Durchschnittliche Gesamtbewertung: ${(
        validationResults.reduce(
          (sum, r) => sum + r.validationMetrics.avgOverallRating,
          0
        ) / validationResults.length
      ).toFixed(1)}/10

🎵 Einzelne Validierungen:
${validationResults
  .map(
    (result, index) => `
Validierung #${index + 1} - ${result.fileName}:
• Timing-Genauigkeit: ${result.validationMetrics.avgTimingAccuracy}/10
• Lyrics-Korrelation: ${result.validationMetrics.avgLyricsCorrelation}/10
• Visuelle Cue-Erkennung: ${result.validationMetrics.avgVisualCueRecognition}/10
• Gesamtbewertung: ${result.validationMetrics.avgOverallRating}/10
• Vorschläge validiert: ${result.validationMetrics.totalSuggestions}
• Lyrics: ${result.lyrics ? "Ja" : "Nein"}
`
  )
  .join("\n")}

📅 Zeitstempel: ${new Date().toISOString()}
🔧 Pipeline Version: 2.0.0 (Timeline-Validierung)`;

      await navigator.clipboard.writeText(summaryText);
      alert(
        "Validierungsergebnisse erfolgreich in die Zwischenablage kopiert!"
      );
    } catch (error) {
      console.error("Fehler beim Kopieren in die Zwischenablage:", error);
      alert(
        "Fehler beim Kopieren in die Zwischenablage. Bitte versuche es erneut."
      );
    }
  };

  const handleSelectMarkerAndSeek = useCallback(
    (markerId: string | null) => {
      setSelectedMarkerId(markerId);
      // Temporär den scrub-Aufruf entfernen, um das Problem zu beheben
      // if (markerId) {
      //     const marker = markers.find(m => m.id === markerId);
      //     if (marker) {
      //         scrub(marker.t_start_s);
      //     }
      // }
    },
    [setSelectedMarkerId]
  );

  const handleMarkerMove = (
    markerId: string,
    newStartTime: number,
    newEndTime: number
  ) => {
    if (!trackInfo) return;
    const marker = markers.find((m) => m.id === markerId);
    if (!marker) return;

    const clampedStartTime = Math.max(
      0,
      Math.min(newStartTime, trackInfo.duration_s)
    );
    const clampedEndTime = Math.max(
      clampedStartTime,
      Math.min(newEndTime, trackInfo.duration_s)
    );

    updateMarker({
      ...marker,
      t_start_s: clampedStartTime,
      t_end_s: clampedEndTime,
    });
    setIsDirty(true);
  };

  // --- Keyboard Shortcuts ---
  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/) ||
        !!modalConfig ||
        showDebugModal
      )
        return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlayPause();
          break;
        case "KeyM":
          e.preventDefault();
          handleMarkerCreationToggle(currentTime);
          break;
        case "Escape":
          e.preventDefault();
          if (pendingMarkerStart !== null) setPendingMarkerStart(null);
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          if (selectedMarkerId) deleteMarker(selectedMarkerId);
          break;
        case "ArrowRight":
          e.preventDefault();
          scrub(currentTime + (e.shiftKey ? 1 : 5));
          break;
        case "ArrowLeft":
          e.preventDefault();
          scrub(currentTime - (e.shiftKey ? 1 : 5));
          break;
      }
    },
    [
      togglePlayPause,
      handleMarkerCreationToggle,
      selectedMarkerId,
      deleteMarker,
      scrub,
      currentTime,
      pendingMarkerStart,
      modalConfig,
      showDebugModal,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  // --- Import/Export handlers ---
  const onExport = () => {
    handleExport(markers, trackInfo);
    setIsDirty(false);
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleImport(
      file,
      trackInfo,
      (importedMarkers) => {
        setMarkers(importedMarkers);
        setSelectedMarkerId(null);
        setIsDirty(true);
      },
      (warnings) => setWarnings(warnings)
    );

    if (e.target) e.target.value = "";
  };

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) || null;

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col font-sans">
      <Header
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onActiveProfileIdChange={setActiveProfileId}
        onAddNewProfileClick={() => openModal("ADD_PROFILE")}
        onOpenApiSettings={() => openModal("API_KEYS")}
        trainingDataCount={trainingDataCount}
        minTrainingSamples={MIN_TRAINING_SAMPLES}
        onRefineProfile={refineProfile}
        trainingStatus={trainingStatus}
        trackInfo={trackInfo}
        onEditLyricsClick={() => openModal("SEARCH_GENIUS")}
        onAnalyzeEmotions={handleAnalyzeEmotions}
        canAnalyzeEmotions={hasGeminiKey}
        analyzeDisabledReason={
          hasGeminiKey
            ? undefined
            : "Set VITE_GOOGLE_API_KEY and reload to enable AI analysis."
        }
        isProcessing={isProcessing}
        isPlaying={isPlaying}
        onTogglePlayPause={togglePlayPause}
        pendingMarkerStart={pendingMarkerStart}
        onMarkerCreationToggle={() => handleMarkerCreationToggle(currentTime)}
        currentTime={currentTime}
        volume={volume}
        onVolumeChange={setVolume}
        onZoom={(dir) =>
          setZoom((z) =>
            dir === "in" ? Math.min(z * 1.5, 500) : Math.max(z / 1.5, 5)
          )
        }
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenPipeline={() => setShowPipelineModal(true)}
        hasGeminiKey={hasGeminiKey}
      />

      <main className="flex flex-col lg:flex-row flex-grow overflow-hidden pb-20 lg:pb-0">
        <Workspace
          isProcessing={isProcessing}
          processingMessage={processingMessage}
          trackInfo={trackInfo}
          currentTime={currentTime}
          markers={markers}
          waveform={waveform}
          merSuggestions={merSuggestions}
          selectedMarkerId={selectedMarkerId}
          zoom={zoom}
          pendingMarkerStart={pendingMarkerStart}
          colorPalette={colorPalette}
          // Neue Multi-Track Props
          tracks={tracks}
          trackHeight={trackHeight}
          trackSpacing={trackSpacing}
          trackRenderConfig={trackRenderConfig}
          // Lyrics-Zwischenspeicher Status
          hasLyricsContext={
            trackInfo ? !!songContext[trackInfo.localId] : false
          }
          lyricsContextLength={
            trackInfo ? songContext[trackInfo.localId]?.length || 0 : 0
          }
          onLyricsStatusClick={() => {
            if (trackInfo && songContext[trackInfo.localId]) {
              setModalConfig({
                type: "LYRICS_PREVIEW",
                title: "Gespeicherte Lyrics anzeigen",
                submitText: "Schließen",
              });
              setModalInputValue(songContext[trackInfo.localId]);
            }
          }}
          onScrub={scrub}
          onMarkerSelect={handleSelectMarkerAndSeek}
          onMarkerMove={handleMarkerMove}
          onSuggestionClick={handleSuggestionClick}
          onZoom={(dir) =>
            setZoom((z) =>
              dir === "in" ? Math.min(z * 1.5, 500) : Math.max(z / 1.5, 5)
            )
          }
          // Neue Multi-Track Event Handler
          onTrackClick={handleTrackClick}
          onTrackHover={handleTrackHover}
          onTrackVisibilityChange={handleTrackVisibilityChange}
          warnings={warnings}
          onClearWarnings={() => setWarnings([])}
          onDeleteMarker={deleteMarker}
        />

        <LabelPanel
          selectedMarker={selectedMarker}
          onUpdateMarker={updateMarker}
          onDeleteMarker={deleteMarker}
        />
      </main>

      <Footer
        isDirty={isDirty}
        importInputRef={importInputRef}
        onImport={onImport}
        onExport={onExport}
        markers={markers}
      />

      {modalConfig && (
        <Modal
          onClose={() => setModalConfig(null)}
          size={modalConfig.type === "SEARCH_GENIUS" ? "lg" : "md"}
        >
          {modalConfig.type === "SEARCH_GENIUS" && trackInfo ? (
            <GeniusSearchModal
              initialQuery={`${trackInfo.title} ${trackInfo.artist}`
                .replace(/ unknown artist/i, "")
                .trim()}
              geniusSearchState={geniusSearchState}
              searchGenius={searchGenius}
              selectSong={selectGeniusSong}
              confirmSelection={confirmGeniusSelection}
              backToSearch={backToGeniusSearch}
              onTrackInfoUpdate={(meta) =>
                setTrackInfo((ti) => (ti ? { ...ti, ...meta } : null))
              }
              onSwitchToManual={openManualLyricsModal}
              onViewRawJson={() => setShowDebugModal(true)}
              onClose={() => setModalConfig(null)}
            />
          ) : (
            <>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-100">
                    {modalConfig.title}
                  </h3>
                  <Button
                    onClick={() => setModalConfig(null)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-300"
                  >
                    <XIcon />
                  </Button>
                </div>

                {modalConfig.type === "ADD_PROFILE" && (
                  <input
                    type="text"
                    value={modalInputValue}
                    onChange={(e) => setModalInputValue(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter profile name..."
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleModalSubmit()}
                  />
                )}
                {modalConfig.type === "MANUAL_LYRICS" && (
                  <textarea
                    value={modalInputValue}
                    onChange={(e) => setModalInputValue(e.target.value)}
                    rows={15}
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="Paste song context (lyrics, annotations, etc.) here..."
                    autoFocus
                  />
                )}
                {modalConfig.type === "API_KEYS" && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="genius-api-key"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        Genius API Key (Client Access Token)
                      </label>
                      <input
                        id="genius-api-key"
                        type="password"
                        value={modalInputValue}
                        onChange={(e) => setModalInputValue(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Paste your key here"
                        autoFocus
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleModalSubmit()
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Your key is stored securely in your browser's local
                        storage.
                      </p>
                    </div>
                  </div>
                )}
                {modalConfig.type === "LYRICS_PREVIEW" && (
                  <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                      <h4 className="font-semibold text-gray-200 mb-3">
                        📝 Gespeicherte Lyrics & Kontext
                      </h4>
                      <div className="bg-gray-900 p-3 rounded border border-gray-700 max-h-96 overflow-y-auto">
                        <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                          {modalInputValue}
                        </pre>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Diese Lyrics werden für die KI-Analyse verwendet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-700 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                <Button
                  onClick={() => setModalConfig(null)}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button onClick={handleModalSubmit} variant="primary" size="sm">
                  {modalConfig.submitText}
                </Button>
              </div>
            </>
          )}
        </Modal>
      )}

      {showDebugModal && geniusSearchState.rawGeniusData && (
        <Modal onClose={() => setShowDebugModal(false)} size="lg">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h3 className="text-lg font-bold text-gray-100">
              Raw Genius API Response
            </h3>
            <Button
              onClick={() => setShowDebugModal(false)}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-300"
            >
              <XIcon />
            </Button>
          </div>
          <div className="p-4 overflow-auto max-h-[80vh]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">
                  /songs/:id Response
                </h4>
                <pre className="bg-gray-900 p-2 rounded text-xs text-gray-300 overflow-auto">
                  <code>
                    {JSON.stringify(
                      geniusSearchState.rawGeniusData.song,
                      null,
                      2
                    )}
                  </code>
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">
                  /referents Response
                </h4>
                <pre className="bg-gray-900 p-2 rounded text-xs text-gray-300 overflow-auto">
                  <code>
                    {JSON.stringify(
                      geniusSearchState.rawGeniusData.referents,
                      null,
                      2
                    )}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Settings Modal */}
      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        waveformDetail={waveformDetail}
        onWaveformDetailChange={setWaveformDetail}
        colorPalette={colorPalette}
        onColorPaletteChange={setColorPalette}
        audioBuffer={audioBuffer}
      />

      {/* Pipeline Testing Modal */}
      {showPipelineModal && (
        <Modal onClose={() => setShowPipelineModal(false)} size="lg">
          <div className="flex flex-col h-[90vh] max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-100">
                🧪 Pipeline Testing - Echte Gemini-Validierung
              </h3>
              <Button
                onClick={() => setShowPipelineModal(false)}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-300"
              >
                <XIcon />
              </Button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto min-h-0">
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Test-Philosophie */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    🧪 Timeline-Validierung Pipeline
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Diese Pipeline validiert die Genauigkeit von Gemini's
                    emotionalen Vorhersagen durch subjektive Bewertung von
                    Timing, Lyrics-Korrelation und visueller Cue-Erkennung. Das
                    ermöglicht es, Verbesserungen der AI-Vorhersagen quantitativ
                    zu messen.
                  </p>
                </div>

                {/* Pipeline-Status */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    📊 Pipeline-Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {validationResults.length}
                      </div>
                      <div className="text-gray-300">Validierungen</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {validationResults.length > 0
                          ? (
                              validationResults.reduce(
                                (sum, r) =>
                                  sum + r.validationMetrics.avgOverallRating,
                                0
                              ) / validationResults.length
                            ).toFixed(1)
                          : "0.0"}
                      </div>
                      <div className="text-gray-300">Ø Gesamtbewertung</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {validationResults.length > 0
                          ? (
                              validationResults.reduce(
                                (sum, r) =>
                                  sum + r.validationMetrics.avgTimingAccuracy,
                                0
                              ) / validationResults.length
                            ).toFixed(1)
                          : "0.0"}
                      </div>
                      <div className="text-gray-300">Ø Timing-Genauigkeit</div>
                    </div>
                  </div>
                </div>

                {/* Pipeline-Ausführung */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    🚀 Pipeline-Ausführung
                  </h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <Button
                        onClick={handlePipelineTest}
                        disabled={!waveform || !trackInfo || isProcessing}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2">
                            <SpinnerIcon />
                            {processingMessage}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <SparklesIcon />
                            Timeline-Validierung starten
                          </div>
                        )}
                      </Button>
                    </div>

                    <div className="text-center">
                      <Button
                        onClick={handleForceReAnalysis}
                        disabled={!waveform || !trackInfo || isProcessing}
                        variant="outline"
                        size="lg"
                        className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white px-8 py-3"
                      >
                        🔄 Neue AI-Analyse erzwingen
                      </Button>
                      <p className="text-sm text-gray-400 mt-2">
                        Umgeht den Cache und führt eine komplett neue
                        Gemini-Analyse durch
                      </p>
                    </div>
                  </div>
                </div>

                {/* Validierungs-Interface */}
                {validationStep === "validating" && currentValidation && (
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">
                      ✅ Validierung: {currentValidation.fileName}
                    </h3>
                    <p className="text-gray-300 mb-6">
                      Bewerte jede Gemini-Vorhersage auf einer Skala von 1-10:
                    </p>

                    <div className="space-y-6">
                      {currentValidation.validations.map(
                        (validation: any, index: number) => (
                          <div
                            key={index}
                            className="bg-gray-700 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-medium text-white">
                                Vorschlag #{index + 1}:{" "}
                                {validation.suggestion.gems} bei{" "}
                                {validation.suggestion.time.toFixed(1)}s
                              </h4>
                              <div className="text-sm text-gray-400">
                                Confidence:{" "}
                                {(
                                  validation.suggestion.confidence * 100
                                ).toFixed(1)}
                                %
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Timing-Genauigkeit (1-10)
                                </label>
                                <input
                                  type="range"
                                  min="1"
                                  max="10"
                                  value={validation.timingAccuracy}
                                  onChange={(e) =>
                                    updateValidation(
                                      index,
                                      "timingAccuracy",
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="text-center text-white font-medium">
                                  {validation.timingAccuracy}/10
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Lyrics-Korrelation (1-10)
                                </label>
                                <input
                                  type="range"
                                  min="1"
                                  max="10"
                                  value={validation.lyricsCorrelation}
                                  onChange={(e) =>
                                    updateValidation(
                                      index,
                                      "lyricsCorrelation",
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="text-center text-white font-medium">
                                  {validation.lyricsCorrelation}/10
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Visuelle Cue-Erkennung (1-10)
                                </label>
                                <input
                                  type="range"
                                  min="1"
                                  max="10"
                                  value={validation.visualCueRecognition}
                                  onChange={(e) =>
                                    updateValidation(
                                      index,
                                      "visualCueRecognition",
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="text-center text-white font-medium">
                                  {validation.visualCueRecognition}/10
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-600 rounded-lg p-3 mb-4">
                              <div className="text-sm text-gray-300 mb-2">
                                <strong>Gemini-Vorhersage:</strong>{" "}
                                {validation.suggestion.reason}
                              </div>
                              <div className="text-sm text-gray-400">
                                <strong>GEMS:</strong>{" "}
                                {validation.suggestion.gems} |
                                <strong>Intensität:</strong>{" "}
                                {validation.suggestion.intensity} |
                                <strong>Trigger:</strong>{" "}
                                {validation.suggestion.trigger?.join(", ")}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-lg font-medium text-white">
                                Gesamtbewertung:{" "}
                                <span className="text-blue-400">
                                  {validation.overallRating}/10
                                </span>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Notizen (optional)
                                </label>
                                <input
                                  type="text"
                                  value={validation.notes}
                                  onChange={(e) =>
                                    updateValidation(
                                      index,
                                      "notes",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Warum diese Bewertung?"
                                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <div className="text-center mt-6">
                      <Button
                        onClick={handleValidationComplete}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                      >
                        ✅ Validierung abschließen
                      </Button>
                    </div>
                  </div>
                )}

                {/* Validierungsergebnisse */}
                {validationStep === "complete" &&
                  validationResults.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-white mb-4">
                        📊 Validierungsergebnisse
                      </h3>

                      <div className="space-y-4">
                        {validationResults.map((result, index) => (
                          <div
                            key={index}
                            className="bg-gray-700 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-medium text-white">
                                {result.fileName}
                              </h4>
                              <div className="text-sm text-gray-400">
                                {new Date(
                                  result.validationTimestamp
                                ).toLocaleString()}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-400">
                                  {result.validationMetrics.avgTimingAccuracy}
                                  /10
                                </div>
                                <div className="text-sm text-gray-300">
                                  Timing
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">
                                  {
                                    result.validationMetrics
                                      .avgLyricsCorrelation
                                  }
                                  /10
                                </div>
                                <div className="text-sm text-gray-300">
                                  Lyrics
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-400">
                                  {
                                    result.validationMetrics
                                      .avgVisualCueRecognition
                                  }
                                  /10
                                </div>
                                <div className="text-sm text-gray-300">
                                  Visuell
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-400">
                                  {result.validationMetrics.avgOverallRating}/10
                                </div>
                                <div className="text-sm text-gray-300">
                                  Gesamt
                                </div>
                              </div>
                            </div>

                            <div className="text-sm text-gray-400">
                              {result.validationMetrics.totalSuggestions}{" "}
                              Vorschläge validiert | Lyrics:{" "}
                              {result.lyrics ? "Ja" : "Nein"}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                          onClick={exportPipelineResults}
                          variant="outline"
                          size="lg"
                          className="flex items-center gap-2"
                        >
                          📁 Ergebnisse exportieren
                        </Button>

                        <Button
                          onClick={copyValidationResultsToClipboard}
                          variant="secondary"
                          size="lg"
                          className="flex items-center gap-2"
                        >
                          📋 Ergebnisse in Zwischenablage kopieren
                        </Button>
                      </div>
                    </div>
                  )}

                {/* Neue Validierung starten */}
                {validationStep === "complete" && (
                  <div className="bg-gray-800 rounded-lg p-6 text-center">
                    <Button
                      onClick={() => setValidationStep("setup")}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                    >
                      🚀 Neue Validierung starten
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation
        isPlaying={isPlaying}
        onTogglePlayPause={togglePlayPause}
        pendingMarkerStart={pendingMarkerStart}
        onMarkerCreationToggle={() => handleMarkerCreationToggle(currentTime)}
        onZoom={(dir) =>
          setZoom((z) =>
            dir === "in" ? Math.min(z * 1.5, 500) : Math.max(z / 1.5, 5)
          )
        }
        onOpenSettings={() => setShowSettingsModal(true)}
        trackInfo={trackInfo}
      />
    </div>
  );
};

export default App;
