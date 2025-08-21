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
import { Marker, TrackInfo, ColorPalette } from "./types";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useAnnotationSystem } from "./hooks/useAnnotationSystem";
import { stringToHash } from "./utils/hash";
import { cleanFileName } from "./utils/fileNameParser";
import { handleExport, handleImport } from "./utils/importExport";

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
