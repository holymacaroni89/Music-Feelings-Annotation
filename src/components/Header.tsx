import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  PlayIcon,
  PauseIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MarkerIcon,
  VolumeIcon,
  SparklesIcon,
  LyricsIcon,
  VisualizationSettingsIcon,
  ApiKeyIcon,
  PipelineIcon,
} from "./icons";
import ProfileSelector from "./ProfileSelector";
import { Profile, TrackInfo } from "../types";

// Pull-to-refresh hook
const usePullToRefresh = (onRefresh: () => void) => {
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const touchStartY = React.useRef(0);
  const maxPullDistance = 80;
  const refreshThreshold = 60;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setPullDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    // Only allow pull down when at top of page
    if (window.scrollY === 0 && deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, maxPullDistance);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > refreshThreshold && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1000);
    } else {
      setPullDistance(0);
    }
  };

  return {
    pullDistance,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

interface HeaderProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  profiles: Profile[];
  activeProfileId: string;
  onActiveProfileIdChange: (id: string) => void;
  onAddNewProfileClick: () => void;
  onOpenApiSettings: () => void;
  trainingDataCount: number;
  minTrainingSamples: number;
  onRefineProfile: () => void;
  trainingStatus: "idle" | "training" | "done";
  trackInfo: TrackInfo | null;
  onEditLyricsClick: () => void;
  onAnalyzeEmotions: () => void;
  onReAnalyzeEmotions?: () => void;
  canAnalyzeEmotions?: boolean;
  analyzeDisabledReason?: string;
  hasCachedAnalysis?: boolean;
  hasCachedWaveform?: boolean;
  cacheStatus?: {
    hasAnalysis: boolean;
    hasWaveform: boolean;
    lastAnalysis: number;
    needsReanalysis: boolean;
    reason?: string;
  } | null;
  isProcessing: boolean;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  pendingMarkerStart: number | null;
  onMarkerCreationToggle: () => void;
  currentTime: number;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onZoom: (direction: "in" | "out") => void;
  onOpenSettings: () => void;
  onOpenPipeline: () => void;
  hasGeminiKey: boolean;
}

const Header: React.FC<HeaderProps> = ({
  fileInputRef,
  onFileChange,
  profiles,
  activeProfileId,
  onActiveProfileIdChange,
  onAddNewProfileClick,
  onOpenApiSettings,
  trainingDataCount,
  minTrainingSamples,
  onRefineProfile,
  trainingStatus,
  trackInfo,
  onEditLyricsClick,
  onAnalyzeEmotions,
  onReAnalyzeEmotions,
  canAnalyzeEmotions = true,
  analyzeDisabledReason,
  hasCachedAnalysis,
  hasCachedWaveform,
  cacheStatus,
  isProcessing,
  isPlaying,
  onTogglePlayPause,
  pendingMarkerStart,
  onMarkerCreationToggle,
  currentTime,
  volume,
  onVolumeChange,
  onZoom,
  onOpenSettings,
  onOpenPipeline,
  hasGeminiKey,
}) => {
  // Pull-to-refresh for reloading audio
  const pullToRefresh = usePullToRefresh(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  });
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  const refineButtonText =
    trainingStatus === "training"
      ? "Training..."
      : trainingStatus === "done"
      ? "Done!"
      : "Refine Profile";

  return (
    <header
      className="bg-gray-900 border-b border-gray-800 flex-shrink-0 shadow-lg w-full relative"
      onTouchStart={pullToRefresh.handleTouchStart}
      onTouchMove={pullToRefresh.handleTouchMove}
      onTouchEnd={pullToRefresh.handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullToRefresh.pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 bg-accent-600 text-white text-center py-2 text-sm transition-all duration-200"
          style={{
            transform: `translateY(-${Math.max(
              0,
              40 - pullToRefresh.pullDistance
            )}px)`,
            opacity: pullToRefresh.pullDistance / 60,
          }}
        >
          {pullToRefresh.isRefreshing
            ? "Loading..."
            : pullToRefresh.pullDistance > 60
            ? "Release to reload audio"
            : "Pull to reload audio"}
        </div>
      )}

      {/* Main Header Card - Optimized for vertical space */}
      <div className="p-2 lg:p-3">
        {/* Top Row - Primary Actions with compact spacing */}
        <div className="flex items-center justify-between gap-4 mb-2">
          {/* Primary Action - Load Audio */}
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="primary"
            size="lg"
            className="flex-shrink-0"
          >
            Load Audio
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".mp3,.wav,.flac"
            className="hidden"
          />

          {/* Profile & Training - Improved spacing and grouping */}
          <div className="flex items-center gap-4">
            <ProfileSelector
              profiles={profiles}
              activeProfileId={activeProfileId}
              onProfileChange={onActiveProfileIdChange}
              onAddNewProfile={onAddNewProfileClick}
            />

            {/* Training Points - Enhanced visual design */}
            <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
              <span className="text-sm text-gray-300 tabular-nums font-medium">
                <span className="hidden sm:inline">
                  {trainingDataCount} training points
                </span>
                <span className="sm:hidden">{trainingDataCount}pts</span>
              </span>
              {trainingDataCount >= minTrainingSamples && (
                <Button
                  onClick={onRefineProfile}
                  disabled={trainingStatus === "training"}
                  variant="secondary"
                  size="sm"
                  className="h-6 px-2 text-xs bg-info-600 hover:bg-info-700 text-info-50"
                >
                  <SparklesIcon />
                  <span className="hidden sm:inline ml-1">
                    {refineButtonText}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Middle Row - Track Info & Secondary Actions with compact spacing */}
        {trackInfo && (
          <div className="flex items-center justify-between gap-4 py-1">
            {/* Track Info Group */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <span className="text-gray-200 truncate font-medium text-base">
                {trackInfo.name}
              </span>
              <Button
                onClick={onEditLyricsClick}
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200 flex-shrink-0 rounded-lg"
                title="Find Lyrics & Info"
              >
                <LyricsIcon />
              </Button>
            </div>

            {/* Secondary Action - Analyze with enhanced styling */}
            <div className="flex items-center gap-2">
              <Button
                onClick={onAnalyzeEmotions}
                disabled={isProcessing || !canAnalyzeEmotions}
                variant="secondary"
                size="lg"
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-accent-600 via-accent-500 to-info-500 hover:from-accent-700 hover:via-accent-600 hover:to-info-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 font-semibold"
                title={
                  canAnalyzeEmotions
                    ? "Analyze emotions with AI"
                    : analyzeDisabledReason || "AI analysis unavailable"
                }
              >
                <SparklesIcon />
                <span className="hidden sm:inline">Analyze Emotions</span>
                <span className="sm:hidden">Analyze</span>
              </Button>

              {hasCachedAnalysis && onReAnalyzeEmotions && (
                <Button
                  onClick={onReAnalyzeEmotions}
                  disabled={isProcessing}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 px-4 py-3 border-accent-400 text-accent-400 hover:bg-accent-400 hover:text-white transition-all duration-300 flex-shrink-0"
                  title="Re-analyze emotions with updated AI model"
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Re-Analyze</span>
                  <span className="sm:hidden">Re-Analyze</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Row - Audio Controls & Settings (desktop only, compact layout) */}
        {trackInfo && (
          <div className="hidden lg:flex items-center justify-between gap-4 pt-2 mt-2 border-t border-gray-700">
            {/* Cache Status Anzeige */}
            {cacheStatus && (
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`px-2 py-1 rounded-md text-xs font-medium ${
                    cacheStatus.hasAnalysis && cacheStatus.hasWaveform
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : cacheStatus.hasWaveform
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                      : "bg-gray-100 text-gray-800 border border-gray-200"
                  }`}
                >
                  {cacheStatus.hasAnalysis && cacheStatus.hasWaveform
                    ? "✅ Gecacht"
                    : cacheStatus.hasWaveform
                    ? "🔄 Waveform"
                    : "❌ Kein Cache"}
                </div>
                {cacheStatus.lastAnalysis > 0 && (
                  <span className="text-gray-500">
                    {new Date(cacheStatus.lastAnalysis).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            {/* Audio Controls Group - Left */}
            <div className="flex items-center gap-6">
              {/* Playback Controls */}
              <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
                <Button
                  onClick={onTogglePlayPause}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg hover:bg-gray-700 text-white transition-all duration-200"
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </Button>
                <Button
                  onClick={onMarkerCreationToggle}
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-lg text-white transition-all duration-200 ${
                    pendingMarkerStart !== null
                      ? "bg-warning-400 text-warning-950 hover:bg-warning-500"
                      : "hover:bg-gray-700"
                  }`}
                  title={
                    pendingMarkerStart !== null
                      ? "Set Marker End (M)"
                      : "Set Marker Start (M)"
                  }
                >
                  <MarkerIcon />
                </Button>
              </div>

              {/* Time Display */}
              <div className="text-base font-mono text-gray-200 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                <span className="font-medium">
                  {formatTime(currentTime)} / {formatTime(trackInfo.duration_s)}
                </span>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
                <VolumeIcon />
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[volume]}
                  onValueChange={(v) => onVolumeChange(v[0] ?? 0)}
                  className="w-24 [&_[role=slider]]:bg-accent-500 [&_[role=slider]]:hover:bg-accent-400"
                />
              </div>
            </div>

            {/* Tools & Settings Group - Right */}
            <div className="flex items-center gap-4">
              {/* Zoom Controls Group */}
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-2 py-1 border border-gray-700">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors duration-200 rounded-md"
                  onClick={() => onZoom("in")}
                  title="Zoom In"
                >
                  <ZoomInIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors duration-200 rounded-md"
                  onClick={() => onZoom("out")}
                  title="Zoom Out"
                >
                  <ZoomOutIcon />
                </Button>
              </div>

              {/* Settings Group */}
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-2 py-1 border border-gray-700">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors duration-200 rounded-md"
                  onClick={onOpenSettings}
                  title="Visualization Settings"
                >
                  <VisualizationSettingsIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors duration-200 rounded-md"
                  onClick={onOpenApiSettings}
                  title="API Key Settings"
                >
                  <ApiKeyIcon />
                </Button>
                {hasGeminiKey && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors duration-200 rounded-md"
                    onClick={onOpenPipeline}
                    title="Pipeline Testing (Developer Mode)"
                  >
                    <PipelineIcon />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
