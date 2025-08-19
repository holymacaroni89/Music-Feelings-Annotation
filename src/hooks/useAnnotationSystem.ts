import { useState, useRef, useEffect, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import {
  Marker,
  AppState,
  TrackInfo,
  MerSuggestion,
  TrainingSample,
  Profile,
  GEMS,
  Trigger,
  GeniusSong,
  GeniusSongDetails,
} from "../types";
import { AUTOSAVE_KEY, MARKER_DEFAULT_DURATION_S } from "../constants";
import * as trainingService from "../services/trainingService";
import * as mlService from "../services/mlService";
import * as geminiService from "../services/geminiService";
import * as geniusService from "../services/geniusService";

const MIN_TRAINING_SAMPLES = 10;

// The user-provided key will serve as a default for convenience.
const GENIUS_API_KEY_DEFAULT =
  "1ogp7eMrwwtgrPOk4PEDLp18cKIZ0RO8PKALdh1u02hL_oA0yaTrzs_VHzOMG0DV";

interface ModalConfig {
  type: "ADD_PROFILE" | "SEARCH_GENIUS" | "MANUAL_LYRICS" | "API_KEYS";
  title: string;
  submitText: string;
}

export type GeniusSearchStatus =
  | "idle"
  | "searching"
  | "results"
  | "fetchingDetails"
  | "details"
  | "error";

export interface GeniusSearchState {
  status: GeniusSearchStatus;
  results: GeniusSong[];
  detailedSong: GeniusSongDetails | null;
  error: string | null;
  rawGeniusData?: { song: any; referents: any };
}

export const useAnnotationSystem = (trackInfo: TrackInfo | null) => {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [pendingMarkerStart, setPendingMarkerStart] = useState<number | null>(
    null
  );
  const [merSuggestions, setMerSuggestions] = useState<MerSuggestion[]>([]);
  const [songContext, setSongContext] = useState<{
    [trackLocalId: string]: string;
  }>({});

  // Profile & AI State
  const [profiles, setProfiles] = useState<Profile[]>([
    { id: "default", name: "Default Profile" },
  ]);
  const [activeProfileId, setActiveProfileId] = useState<string>("default");
  const [trainingDataCount, setTrainingDataCount] = useState(0);
  const [personalModel, setPersonalModel] = useState<tf.LayersModel | null>(
    null
  );
  const [trainingStatus, setTrainingStatus] = useState<
    "idle" | "training" | "done"
  >("idle");
  const [geniusApiKey, setGeniusApiKey] = useState<string>("");

  // UI State
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
  const [modalInputValue, setModalInputValue] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [geniusSearchState, setGeniusSearchState] = useState<GeniusSearchState>(
    { status: "idle", results: [], detailedSong: null, error: null }
  );

  // --- Autosave & Initialization ---
  useEffect(() => {
    let keyFound = false;
    try {
      const savedStateJSON = localStorage.getItem(AUTOSAVE_KEY);
      if (savedStateJSON) {
        const savedState: AppState = JSON.parse(savedStateJSON);
        if (savedState.profiles && savedState.profiles.length > 0) {
          setProfiles(savedState.profiles);
          setActiveProfileId(
            savedState.activeProfileId || savedState.profiles[0].id
          );
        }
        if (savedState.geniusApiKey) {
          setGeniusApiKey(savedState.geniusApiKey);
          keyFound = true;
        }
        if (savedState.songContext) {
          setSongContext(savedState.songContext);
        }
      }
    } catch (e) {
      console.error("Failed to parse saved state:", e);
    }

    if (!keyFound) {
      setGeniusApiKey(GENIUS_API_KEY_DEFAULT);
    }
  }, []);

  useEffect(() => {
    if (trackInfo) {
      const savedStateJSON = localStorage.getItem(AUTOSAVE_KEY);
      if (savedStateJSON) {
        const savedState: AppState = JSON.parse(savedStateJSON);
        if (savedState.currentTrackLocalId === trackInfo.localId) {
          setMarkers(savedState.markers);
        } else {
          // New track, reset everything
          setMarkers([]);
          setMerSuggestions([]);
        }
      }
    } else {
      setMarkers([]);
      setMerSuggestions([]);
    }
  }, [trackInfo]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = setTimeout(() => {
      if (trackInfo) {
        const stateToSave: AppState = {
          currentTrackLocalId: trackInfo.localId,
          trackMetadata: {
            [trackInfo.localId]: {
              name: trackInfo.name,
              title: trackInfo.title,
              artist: trackInfo.artist,
              duration_s: trackInfo.duration_s,
            },
          },
          markers: markers,
          profiles: profiles,
          activeProfileId: activeProfileId,
          geniusApiKey: geniusApiKey,
          songContext: songContext,
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(stateToSave));
        setIsDirty(false);
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [
    isDirty,
    markers,
    trackInfo,
    profiles,
    activeProfileId,
    geniusApiKey,
    songContext,
  ]);

  // --- AI & Training Data ---
  const findClosestSuggestion = useCallback(
    (time: number): MerSuggestion | null => {
      if (merSuggestions.length === 0) return null;
      return merSuggestions.reduce((closest, current) => {
        const closestDiff = Math.abs(closest.time - time);
        const currentDiff = Math.abs(current.time - time);
        return currentDiff < closestDiff ? current : closest;
      }, merSuggestions[0]);
    },
    [merSuggestions]
  );

  const captureTrainingSample = useCallback(
    (userMarkerData: { valence: number; arousal: number }, time: number) => {
      if (!activeProfileId) return;
      const aiPrediction = findClosestSuggestion(time);
      if (!aiPrediction) return;

      const newSample: TrainingSample = {
        input: { valence: aiPrediction.valence, arousal: aiPrediction.arousal },
        output: {
          valence: userMarkerData.valence,
          arousal: userMarkerData.arousal,
        },
      };
      trainingService.addTrainingSample(activeProfileId, newSample);
      setTrainingDataCount((prev) => prev + 1);
    },
    [activeProfileId, findClosestSuggestion]
  );

  useEffect(() => {
    if (activeProfileId) {
      const count =
        trainingService.getTrainingDataCountForProfile(activeProfileId);
      setTrainingDataCount(count);
      mlService.loadModel(activeProfileId).then(setPersonalModel);
    }
  }, [activeProfileId]);

  const analyzeEmotions = async (waveform: any, duration: number) => {
    const currentContext = trackInfo
      ? songContext[trackInfo.localId]
      : undefined;
    const baseSuggestions = await geminiService.generateMerSuggestions(
      waveform,
      duration,
      currentContext
    );
    if (personalModel) {
      const refinedSuggestions = mlService.predict(
        personalModel,
        baseSuggestions
      );
      setMerSuggestions(refinedSuggestions);
    } else {
      setMerSuggestions(baseSuggestions);
    }
  };

  const refineProfile = async () => {
    if (!activeProfileId || trainingDataCount < MIN_TRAINING_SAMPLES) return;

    setTrainingStatus("training");
    const trainingData =
      trainingService.loadTrainingDataForProfile(activeProfileId);
    const model = mlService.createModel();

    await mlService.trainModel(model, trainingData);
    await mlService.saveModel(model, activeProfileId);

    setPersonalModel(model);
    setTrainingStatus("done");
    setTimeout(() => setTrainingStatus("idle"), 2000);
  };

  // --- Marker Management ---
  const updateMarker = (updatedMarker: Marker) => {
    setMarkers((prev) =>
      prev
        .map((m) => (m.id === updatedMarker.id ? updatedMarker : m))
        .sort((a, b) => a.t_start_s - b.t_start_s)
    );
    setIsDirty(true);
    captureTrainingSample(
      { valence: updatedMarker.valence, arousal: updatedMarker.arousal },
      updatedMarker.t_start_s
    );
  };

  const deleteMarker = (markerId: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId));
    if (selectedMarkerId === markerId) {
      setSelectedMarkerId(null);
    }
    setIsDirty(true);
  };

  const handleMarkerCreationToggle = (currentTime: number) => {
    if (!trackInfo) return;

    if (pendingMarkerStart !== null) {
      const t_start_s = Math.min(pendingMarkerStart, currentTime);
      const t_end_s = Math.min(
        trackInfo.duration_s,
        Math.max(
          pendingMarkerStart,
          currentTime,
          t_start_s + MARKER_DEFAULT_DURATION_S
        )
      );

      const newMarker: Marker = {
        id: crypto.randomUUID(),
        trackLocalId: trackInfo.localId,
        title: trackInfo.title,
        artist: trackInfo.artist,
        duration_s: trackInfo.duration_s,
        t_start_s,
        t_end_s,
        valence: 0,
        arousal: 0.5,
        intensity: 50,
        confidence: 0.75,
        gems: "",
        trigger: [],
        imagery: "",
        sync_notes: "",
      };
      const newMarkers = [...markers, newMarker].sort(
        (a, b) => a.t_start_s - b.t_start_s
      );
      setMarkers(newMarkers);
      setSelectedMarkerId(newMarker.id);
      setPendingMarkerStart(null);
      setIsDirty(true);
      captureTrainingSample(
        { valence: newMarker.valence, arousal: newMarker.arousal },
        newMarker.t_start_s
      );
    } else {
      setPendingMarkerStart(currentTime);
      setSelectedMarkerId(null);
    }
  };

  const handleSuggestionClick = (suggestion: MerSuggestion) => {
    if (!trackInfo) return;
    const newMarker: Marker = {
      id: crypto.randomUUID(),
      trackLocalId: trackInfo.localId,
      title: trackInfo.title,
      artist: trackInfo.artist,
      duration_s: trackInfo.duration_s,
      t_start_s: suggestion.time,
      t_end_s: Math.min(suggestion.time + 10.0, trackInfo.duration_s),
      valence: parseFloat(suggestion.valence.toFixed(2)),
      arousal: parseFloat(suggestion.arousal.toFixed(2)),
      intensity: suggestion.intensity,
      confidence: parseFloat(suggestion.confidence.toFixed(2)),
      gems: suggestion.gems,
      trigger: suggestion.trigger,
      imagery: suggestion.imagery,
      sync_notes: suggestion.sync_notes,
    };

    const newMarkers = [...markers, newMarker].sort(
      (a, b) => a.t_start_s - b.t_start_s
    );
    setMarkers(newMarkers);
    setSelectedMarkerId(newMarker.id);
    setIsDirty(true);
    captureTrainingSample(
      { valence: newMarker.valence, arousal: newMarker.arousal },
      newMarker.t_start_s
    );
  };

  // --- Genius Lyrics Search ---
  const searchGenius = useCallback(
    async (query: string) => {
      if (!geniusApiKey) {
        setModalInputValue("");
        setModalConfig({
          type: "API_KEYS",
          title: "Genius API Key Required",
          submitText: "Save Key",
        });
        setGeniusSearchState({
          status: "error",
          results: [],
          detailedSong: null,
          error: "Please enter your Genius API Key.",
        });
        return;
      }

      setGeniusSearchState({
        status: "searching",
        results: [],
        detailedSong: null,
        error: null,
      });
      try {
        const results = await geniusService.searchSongs(query, geniusApiKey);
        setGeniusSearchState({
          status: "results",
          results,
          detailedSong: null,
          error: null,
        });
      } catch (e) {
        const message =
          e instanceof Error && e.message.includes("401")
            ? "Authentication failed. Please check if your API key is correct."
            : "Failed to fetch search results. Please check the console for details.";
        setGeniusSearchState({
          status: "error",
          results: [],
          detailedSong: null,
          error: message,
        });
      }
    },
    [geniusApiKey]
  );

  const selectGeniusSong = useCallback(
    async (song: GeniusSong) => {
      setGeniusSearchState((s) => ({ ...s, status: "fetchingDetails" }));
      const result = await geniusService.getSongDetails(song, geniusApiKey);
      if (result) {
        setGeniusSearchState((s) => ({
          ...s,
          status: "details",
          detailedSong: result.details,
          rawGeniusData: result.raw,
        }));
      } else {
        setGeniusSearchState((s) => ({
          ...s,
          status: "error",
          error: "Could not fetch song details from Genius.",
        }));
      }
    },
    [geniusApiKey]
  );

  const confirmGeniusSelection = useCallback(
    (details: GeniusSongDetails) => {
      if (!trackInfo) return { title: "", artist: "" };

      const contextParts = [
        `Title: ${details.title}`,
        `Artist: ${details.artist}`,
      ];
      if (details.album) contextParts.push(`Album: ${details.album}`);
      if (details.releaseDate)
        contextParts.push(`Release Date: ${details.releaseDate}`);
      if (details.descriptionHtml) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = details.descriptionHtml;
        const descriptionText = tempDiv.textContent || tempDiv.innerText || "";
        contextParts.push(
          `\n--- About The Song ---\n${descriptionText.trim()}`
        );
      }
      if (details.lyrics) {
        contextParts.push(`\n--- Lyrics ---\n${details.lyrics}`);
      }

      const newContext = contextParts.join("\n");

      setSongContext((prev) => ({ ...prev, [trackInfo.localId]: newContext }));

      // This will trigger an update in App.tsx
      const updatedMetadata = { title: details.title, artist: details.artist };

      setMerSuggestions([]); // Invalidate old suggestions
      setIsDirty(true);
      setModalConfig(null);

      return updatedMetadata;
    },
    [trackInfo]
  );

  const backToGeniusSearch = () => {
    setGeniusSearchState((s) => ({
      ...s,
      status: "results",
      detailedSong: null,
      error: null,
    }));
  };

  // --- Modal & Profile Management ---
  const openModal = (type: "ADD_PROFILE" | "SEARCH_GENIUS" | "API_KEYS") => {
    if (type === "ADD_PROFILE") {
      setModalInputValue("");
      setModalConfig({
        type,
        title: "Create New Profile",
        submitText: "Create",
      });
    } else if (type === "SEARCH_GENIUS") {
      setModalConfig({ type, title: "Find Lyrics on Genius", submitText: "" }); // Submit managed inside modal
      const query = trackInfo
        ? `${trackInfo.title} ${trackInfo.artist}`
            .replace(/ unknown artist/i, "")
            .trim()
        : "";
      searchGenius(query);
    } else if (type === "API_KEYS") {
      setModalInputValue(geniusApiKey);
      setModalConfig({
        type,
        title: "API Key Management",
        submitText: "Save Keys",
      });
    }
  };

  const openManualLyricsModal = () => {
    const currentContext = trackInfo
      ? songContext[trackInfo.localId] || ""
      : "";
    setModalInputValue(currentContext);
    setModalConfig({
      type: "MANUAL_LYRICS",
      title: "Add/Edit Song Context Manually",
      submitText: "Save Context",
    });
  };

  const handleSaveGeniusApiKey = (key: string) => {
    setGeniusApiKey(key);
    setIsDirty(true);
  };

  const handleModalSubmit = () => {
    if (!modalConfig) return;

    if (modalConfig.type === "ADD_PROFILE") {
      const name = modalInputValue.trim();
      if (name && !profiles.find((p) => p.name === name)) {
        const newProfile: Profile = { id: crypto.randomUUID(), name };
        setProfiles((p) => [...p, newProfile]);
        setActiveProfileId(newProfile.id);
        setIsDirty(true);
      }
    } else if (modalConfig.type === "MANUAL_LYRICS") {
      if (trackInfo && songContext[trackInfo.localId] !== modalInputValue) {
        setSongContext((prev) => ({
          ...prev,
          [trackInfo.localId]: modalInputValue,
        }));
        setMerSuggestions([]); // Invalidate old suggestions
        setIsDirty(true);
      }
    } else if (modalConfig.type === "API_KEYS") {
      handleSaveGeniusApiKey(modalInputValue);
      // If we opened this modal from the search flow, retry the search now.
      if (geniusSearchState.error?.includes("API Key")) {
        openModal("SEARCH_GENIUS");
        return; // Prevent closing the modal immediately
      }
    }
    setModalConfig(null);
  };

  return {
    // State
    markers,
    setMarkers,
    selectedMarkerId,
    setSelectedMarkerId,
    pendingMarkerStart,
    setPendingMarkerStart,
    merSuggestions,
    songContext,
    setSongContext,
    profiles,
    activeProfileId,
    setActiveProfileId,
    trainingDataCount,
    personalModel,
    trainingStatus,
    modalConfig,
    setModalConfig,
    modalInputValue,
    setModalInputValue,
    isDirty,
    setIsDirty,
    geniusSearchState,
    geniusApiKey,
    // Functions
    updateMarker,
    deleteMarker,
    handleMarkerCreationToggle,
    handleSuggestionClick,
    analyzeEmotions,
    refineProfile,
    openModal,
    openManualLyricsModal,
    handleModalSubmit,
    searchGenius,
    selectGeniusSong,
    confirmGeniusSelection,
    backToGeniusSearch,
    MIN_TRAINING_SAMPLES,
  };
};
