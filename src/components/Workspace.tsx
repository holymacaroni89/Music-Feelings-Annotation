import React from "react";
import Timeline from "./Timeline";
import MarkerList from "./MarkerList";
import { Button } from "@/components/ui/button";
import {
  Marker,
  WaveformPoint,
  TrackInfo,
  MerSuggestion,
  ColorPalette,
} from "../types";

interface WorkspaceProps {
  isProcessing: boolean;
  processingMessage: string;
  trackInfo: TrackInfo | null;
  currentTime: number;
  markers: Marker[];
  waveform: WaveformPoint[] | null;
  merSuggestions: MerSuggestion[];
  selectedMarkerId: string | null;
  zoom: number;
  pendingMarkerStart: number | null;
  colorPalette: ColorPalette;
  onScrub: (time: number) => void;
  onMarkerSelect: (markerId: string | null) => void;
  onMarkerMove: (markerId: string, start: number, end: number) => void;
  onSuggestionClick: (suggestion: MerSuggestion) => void;
  onZoom: (direction: "in" | "out") => void;
  warnings: string[];
  onClearWarnings: () => void;
  onDeleteMarker: (markerId: string) => void;
}

const Workspace: React.FC<WorkspaceProps> = ({
  isProcessing,
  processingMessage,
  trackInfo,
  currentTime,
  markers,
  waveform,
  merSuggestions,
  selectedMarkerId,
  zoom,
  pendingMarkerStart,
  colorPalette,
  onScrub,
  onMarkerSelect,
  onMarkerMove,
  onSuggestionClick,
  onZoom,
  warnings,
  onClearWarnings,
  onDeleteMarker,
}) => {
  return (
    <div className="flex flex-col lg:flex-row flex-grow min-w-0 w-full h-full">
      {/* Main Content Area - Waveform und MarkerList */}
      <div className="flex flex-col flex-grow min-w-0 w-full h-full">
        {/* Timeline - Optimized height for better MarkerList space */}
        <div className="h-20 xs:h-24 sm:h-32 md:h-36 lg:h-40 flex-shrink-0 border-b border-gray-800 w-full">
          {isProcessing && (
            <div className="w-full h-full flex justify-center items-center text-gray-400 bg-gray-950">
              <div className="text-center">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 border-b-2 border-accent-500 mx-auto mb-2"></div>
                <span className="text-xs sm:text-sm md:text-base">
                  {processingMessage || "Processing..."}
                </span>
              </div>
            </div>
          )}
          {!isProcessing && trackInfo ? (
            <Timeline
              duration={trackInfo.duration_s}
              currentTime={currentTime}
              markers={markers}
              waveform={waveform}
              suggestions={merSuggestions}
              selectedMarkerId={selectedMarkerId}
              zoom={zoom}
              pendingMarkerStart={pendingMarkerStart}
              colorPalette={colorPalette}
              onScrub={onScrub}
              onMarkerSelect={onMarkerSelect}
              onMarkerMove={onMarkerMove}
              onSuggestionClick={onSuggestionClick}
              onZoom={onZoom}
            />
          ) : (
            !isProcessing && (
              <div className="w-full h-full flex justify-center items-center text-gray-500 bg-gray-950 text-xs sm:text-sm md:text-base px-2 sm:px-4 text-center">
                Please load an audio file to begin.
              </div>
            )
          )}
        </div>

        {/* Warnings - Fixed height when present */}
        {warnings.length > 0 && (
          <div className="p-2 sm:p-3 bg-warning-900 bg-opacity-50 border-t border-b border-warning-700 text-warning-200 text-xs flex-shrink-0 shadow-sm w-full">
            <div className="flex justify-between items-center">
              <span className="font-medium">⚠️ Import Warnings:</span>
              <Button
                onClick={onClearWarnings}
                variant="ghost"
                size="sm"
                className="font-bold hover:text-warning-100 text-warning-200"
              >
                ✕
              </Button>
            </div>
            <ul className="list-disc list-inside mt-1 sm:mt-2 max-h-16 sm:max-h-20 md:max-h-24 overflow-y-auto space-y-0.5 sm:space-y-1">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* MarkerList - Takes remaining height and enables scrolling */}
        <div className="flex-grow w-full min-h-0 overflow-hidden">
          <MarkerList
            markers={markers}
            selectedMarkerId={selectedMarkerId}
            onSelectMarker={onMarkerSelect}
            onDeleteMarker={onDeleteMarker}
          />
        </div>
      </div>
    </div>
  );
};

export default Workspace;
