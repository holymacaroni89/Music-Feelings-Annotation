import React, { useState, useRef, useEffect, useCallback } from "react";
import { XIcon, SearchIcon, SpinnerIcon } from "./components/icons";
import Header from "./components/Header";
import Workspace from "./components/Workspace";
import Footer from "./components/Footer";
import LabelPanel from "./components/LabelPanel";
import Modal from "./components/Modal";
import SettingsModal from "./components/SettingsModal";
import BottomNavigation from "./components/BottomNavigation";
import { Button } from "./components/ui/button";
import {
  Marker,
  TrackInfo,
  ColorPalette,
  GeniusSong,
  GeniusSongDetails,
} from "./types";
import { exportToCsv, importFromCsv } from "./services/csvService";
import { useAudioEngine } from "./hooks/useAudioEngine";
import {
  useAnnotationSystem,
  GeniusSearchState,
} from "./hooks/useAnnotationSystem";

// --- Helper Functions ---
const stringToHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString();
};

const cleanFileName = (fileName: string): { title: string; artist: string } => {
  // Remove extension
  let baseName = fileName.split(".").slice(0, -1).join(".");
  // Common separators: -, –, —
  const parts = baseName.split(/ - | – | — /);
  if (parts.length > 1) {
    // Try to detect which part is the artist vs title
    // Common patterns: "Artist - Title" or "Title - Artist"
    // Heuristic: if first part looks like a song title (common words), swap them
    const firstPart = parts[0].trim().toLowerCase();
    const secondPart = parts.slice(1).join(" ").trim().toLowerCase();

    // Common song title indicators (not exhaustive, but covers many cases)
    const titleIndicators = [
      "love",
      "heart",
      "time",
      "night",
      "day",
      "life",
      "world",
      "home",
      "away",
      "back",
      "again",
      "never",
      "always",
      "forever",
      "tonight",
      "yesterday",
      "tomorrow",
      "sunrise",
      "sunset",
      "morning",
      "evening",
    ];

    const firstHasTitleWords = titleIndicators.some((word) =>
      firstPart.includes(word)
    );
    const secondHasTitleWords = titleIndicators.some((word) =>
      secondPart.includes(word)
    );

    // If first part has title words but second doesn't, assume "Title - Artist" format
    if (firstHasTitleWords && !secondHasTitleWords) {
      return {
        title: parts[0].trim(),
        artist: parts.slice(1).join(" ").trim(),
      };
    }

    // Default to "Artist - Title" format
    return { artist: parts[0].trim(), title: parts.slice(1).join(" ").trim() };
  }
  return { title: baseName, artist: "Unknown Artist" };
};

// --- Genius Search Modal Component ---
interface GeniusSearchModalProps {
  initialQuery: string;
  geniusSearchState: GeniusSearchState;
  searchGenius: (query: string) => void;
  selectSong: (song: GeniusSong) => void;
  confirmSelection: (details: GeniusSongDetails) => {
    title: string;
    artist: string;
  };
  backToSearch: () => void;
  onTrackInfoUpdate: (metadata: { title: string; artist: string }) => void;
  onSwitchToManual: () => void;
  onViewRawJson: () => void;
  onClose: () => void;
}

const GeniusSearchModal: React.FC<GeniusSearchModalProps> = ({
  initialQuery,
  geniusSearchState,
  searchGenius,
  selectSong,
  confirmSelection,
  backToSearch,
  onTrackInfoUpdate,
  onSwitchToManual,
  onViewRawJson,
  onClose,
}) => {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGenius(query);
  };

  const handleConfirm = (details: GeniusSongDetails) => {
    const updatedMetadata = confirmSelection(details);
    onTrackInfoUpdate(updatedMetadata);
    onClose();
  };

  const renderContent = () => {
    const { status, results, detailedSong, error } = geniusSearchState;

    if (status === "fetchingDetails") {
      return (
        <div className="flex justify-center items-center h-full p-16">
          <SpinnerIcon />
        </div>
      );
    }

    if (status === "details" && detailedSong) {
      return (
        <div className="flex flex-col max-h-[70vh]">
          <div className="p-6 flex-grow overflow-y-auto">
            <div className="flex items-start gap-4">
              <img
                src={detailedSong.imageUrl}
                alt="Album art"
                className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-grow">
                <h4 className="text-2xl font-bold text-white">
                  {detailedSong.title}
                </h4>
                <p className="text-lg text-gray-300">{detailedSong.artist}</p>
                {detailedSong.album && (
                  <p className="text-sm text-gray-400 mt-1">
                    Album: {detailedSong.album}
                  </p>
                )}
                {detailedSong.releaseDate && (
                  <p className="text-sm text-gray-400">
                    Released: {detailedSong.releaseDate}
                  </p>
                )}
              </div>
            </div>

            {detailedSong.descriptionHtml && (
              <div className="mt-4">
                <h5 className="font-bold text-gray-200 mb-2 border-b border-gray-700 pb-1">
                  About "{detailedSong.title}"
                </h5>
                <div
                  className="prose prose-sm prose-invert text-gray-300 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: detailedSong.descriptionHtml,
                  }}
                />
              </div>
            )}

            {detailedSong.lyrics && (
              <div className="mt-4">
                <h5 className="font-bold text-gray-200 mb-2 border-b border-gray-700 pb-1">
                  Lyrics
                </h5>
                <p className="whitespace-pre-wrap text-gray-300 text-sm font-mono">
                  {detailedSong.lyrics}
                </p>
              </div>
            )}
            {!detailedSong.lyrics && (
              <p className="mt-4 text-gray-500">
                Lyrics could not be found for this song.
              </p>
            )}
          </div>
          <div className="bg-gray-700 px-6 py-4 flex justify-between items-center rounded-b-lg flex-shrink-0">
            <div className="flex gap-4">
              <Button
                onClick={backToSearch}
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300"
              >
                ← Back to Search Results
              </Button>
              <Button
                onClick={onViewRawJson}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-300"
              >
                View Raw JSON
              </Button>
            </div>
            <Button
              onClick={() => handleConfirm(detailedSong)}
              variant="primary"
              size="sm"
            >
              Use This Data for AI Analysis
            </Button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="p-6">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-grow bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter song title and artist..."
              autoFocus
              disabled={status === "searching"}
            />
            <Button
              type="submit"
              variant="primary"
              size="icon"
              disabled={status === "searching"}
            >
              {status === "searching" ? <SpinnerIcon /> : <SearchIcon />}
            </Button>
          </form>

          <div className="h-64 overflow-y-auto pr-2">
            {status === "searching" && (
              <div className="flex justify-center items-center h-full pt-8">
                <SpinnerIcon />
              </div>
            )}
            {status === "results" && results.length === 0 && (
              <div className="text-center text-gray-500 pt-8">
                No results found. Try a different search query.
              </div>
            )}
            {status === "error" && (
              <div className="text-center text-red-400 pt-8">{error}</div>
            )}
            {status === "results" && results.length > 0 && (
              <ul className="space-y-2">
                {results.map((song) => (
                  <li
                    key={song.id}
                    onClick={() => selectSong(song)}
                    className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <img
                      src={song.thumbnailUrl}
                      alt="Album art"
                      className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-gray-600"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjNEI1NTYzIi8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMjQgMjhWMjAiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHA+YXRoIGQ9Ik0yMCAyNEwyOCAyNCIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K";
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">
                        {song.title}
                      </p>
                      <p className="text-gray-400 text-sm truncate">
                        {song.artist}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="bg-gray-700 px-6 py-4 flex justify-between items-center rounded-b-lg">
          <button
            onClick={onSwitchToManual}
            className="text-sm text-blue-400 hover:underline"
          >
            Enter Context Manually
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="flex justify-between items-start p-6 pb-0 mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-100">
            Find Song Info on Genius
          </h3>
          <p className="text-sm text-gray-400 max-w-md">
            Accurate metadata and lyrics provide crucial context for the AI
            analysis.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <XIcon />
        </button>
      </div>
      {renderContent()}
    </>
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  const hasGeminiKey: boolean = !!(import.meta as any).env?.VITE_GOOGLE_API_KEY;
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
  const [zoom, setZoom] = useState(20);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showDebugModal, setShowDebugModal] = useState(false);

  // Visualization Settings
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [waveformDetail, setWaveformDetail] = useState(2000);
  const [colorPalette, setColorPalette] = useState<ColorPalette>("vibrant");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const {
    audioContext,
    audioBuffer,
    waveform,
    isPlaying,
    currentTime,
    volume,
    setVolume,
    initializeAudio,
    generateWaveform,
    resetAudio,
    scrub,
    togglePlayPause,
    startPlayback,
    stopPlayback,
  } = useAudioEngine();

  const {
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

  // Effect to generate waveform when audio buffer is ready or detail level changes
  useEffect(() => {
    if (audioBuffer) {
      setIsProcessing(true);
      setProcessingMessage("Generating audio waveform...");
      generateWaveform(audioBuffer, waveformDetail).then(() => {
        setIsProcessing(false);
        setProcessingMessage("");
      });
    }
  }, [audioBuffer, waveformDetail, generateWaveform]);

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
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);

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
      await analyzeEmotions(waveform, trackInfo.duration_s);
      setIsDirty(true);
    } catch (error) {
      console.error("AI analysis failed:", error);
      alert(
        "Could not get emotion analysis from the AI. Please check your API key and network connection."
      );
      setIsDirty(false);
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const handleSelectMarkerAndSeek = useCallback(
    (markerId: string | null) => {
      console.log("Selecting marker:", markerId); // Debug-Log
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

  // --- Import/Export ---
  const handleExport = () => {
    if (markers.length === 0) {
      alert("No markers to export.");
      return;
    }
    const csvString = exportToCsv(markers);
    const blob = new Blob([`\uFEFF${csvString}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${trackInfo?.title || "markers"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDirty(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!trackInfo) {
      alert("Please load an audio track before importing markers.");
      return;
    }
    if (!confirm("This will replace all current markers. Are you sure?"))
      return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const { markers: importedMarkers, warnings: importWarnings } =
        importFromCsv(event.target?.result as string);
      if (
        importedMarkers.length > 0 &&
        importedMarkers[0].trackLocalId !== trackInfo.localId
      ) {
        importWarnings.unshift(
          "Warning: Imported markers seem to be for a different file."
        );
      }
      setMarkers(importedMarkers.sort((a, b) => a.t_start_s - b.t_start_s));
      setSelectedMarkerId(null);
      setIsDirty(true);
      setWarnings(importWarnings);
    };
    reader.readAsText(file);
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
          onScrub={scrub}
          onMarkerSelect={handleSelectMarkerAndSeek}
          onMarkerMove={handleMarkerMove}
          onSuggestionClick={handleSuggestionClick}
          onZoom={(dir) =>
            setZoom((z) =>
              dir === "in" ? Math.min(z * 1.5, 500) : Math.max(z / 1.5, 5)
            )
          }
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
        onImport={handleImport}
        onExport={handleExport}
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
