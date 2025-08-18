import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Marker, GEMS } from "../types";
import { GEMS_COLORS } from "../constants";
import { TrashIcon, SearchIcon } from "./icons";
import { useVirtualScroll } from "../hooks/useVirtualScroll";

interface VirtualizedMarkerListProps {
  markers: Marker[];
  selectedMarkerId: string | null;
  onSelectMarker: (markerId: string) => void;
  onDeleteMarker: (markerId: string) => void;
}

type SortOption =
  | "time"
  | "gems"
  | "valence"
  | "arousal"
  | "intensity"
  | "confidence";
type FilterOption = "all" | GEMS | "no-gems";

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const formatTimeCompact = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, "0")}`;
};

const ITEM_HEIGHT = 120; // Height of each marker item in pixels

const VirtualizedMarkerList: React.FC<VirtualizedMarkerListProps> = ({
  markers,
  selectedMarkerId,
  onSelectMarker,
  onDeleteMarker,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("time");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [containerHeight, setContainerHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Filter and sort markers
  const filteredAndSortedMarkers = useMemo(() => {
    let filtered = markers;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (marker) =>
          marker.gems?.toLowerCase().includes(query) ||
          marker.imagery?.toLowerCase().includes(query) ||
          marker.sync_notes?.toLowerCase().includes(query) ||
          formatTime(marker.t_start_s).includes(query)
      );
    }

    // Apply GEMS filter
    if (filterBy !== "all") {
      if (filterBy === "no-gems") {
        filtered = filtered.filter((marker) => !marker.gems);
      } else {
        filtered = filtered.filter((marker) => marker.gems === filterBy);
      }
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "time":
          return a.t_start_s - b.t_start_s;
        case "gems":
          return (a.gems || "").localeCompare(b.gems || "");
        case "valence":
          return b.valence - a.valence;
        case "arousal":
          return b.arousal - a.arousal;
        case "intensity":
          return b.intensity - a.intensity;
        case "confidence":
          return b.confidence - a.confidence;
        default:
          return 0;
      }
    });

    return sorted;
  }, [markers, searchQuery, sortBy, filterBy]);

  const virtualScroll = useVirtualScroll({
    itemHeight: ITEM_HEIGHT,
    containerHeight,
    itemCount: filteredAndSortedMarkers.length,
    overscan: 3,
  });

  if (markers.length === 0) {
    return (
      <div className="h-full flex justify-center items-center text-gray-500 bg-gray-950 p-2 sm:p-3 md:p-4">
        <div className="text-center">
          <p className="text-gray-400 mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">
            No markers created yet.
          </p>
          <p className="text-xs text-gray-500">
            Use 'M' to define a time range.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-950 flex flex-col">
      {/* Header with search and filters */}
      <div className="flex-shrink-0 p-2 sm:p-3 border-b border-gray-800 bg-gray-900">
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search markers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-400 focus:border-accent-400"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex gap-2">
            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="flex-1 bg-gray-800 border-gray-700 text-gray-200">
                <SelectValue placeholder="Filter by GEMS" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Markers</SelectItem>
                <SelectItem value="no-gems">No GEMS</SelectItem>
                {Object.values(GEMS).map((gems) => (
                  <SelectItem key={gems} value={gems}>
                    {gems}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="flex-1 bg-gray-800 border-gray-700 text-gray-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="gems">GEMS</SelectItem>
                <SelectItem value="valence">Valence</SelectItem>
                <SelectItem value="arousal">Arousal</SelectItem>
                <SelectItem value="intensity">Intensity</SelectItem>
                <SelectItem value="confidence">Confidence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="text-xs text-gray-400">
            {filteredAndSortedMarkers.length} of {markers.length} markers
            {filteredAndSortedMarkers.length > 50 && (
              <span className="ml-2 text-accent-400">(Virtualized for performance)</span>
            )}
          </div>
        </div>
      </div>

      {/* Virtualized scrollable marker list */}
      <div 
        ref={containerRef}
        className="flex-grow overflow-y-auto"
        onScroll={virtualScroll.handleScroll}
      >
        {filteredAndSortedMarkers.length === 0 ? (
          <div className="flex justify-center items-center h-32 text-gray-500 p-4">
            <div className="text-center">
              <p className="text-sm">No markers match your search.</p>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-accent-400 hover:text-accent-300"
                >
                  Clear search
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ height: virtualScroll.totalHeight, position: 'relative' }}>
            <div
              style={{
                transform: `translateY(${virtualScroll.offsetY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              {virtualScroll.visibleItems.map((index) => {
                const marker = filteredAndSortedMarkers[index];
                if (!marker) return null;

                const isSelected = marker.id === selectedMarkerId;
                const gemColor = marker.gems
                  ? GEMS_COLORS[marker.gems]
                  : "bg-gray-500 text-gray-50";

                return (
                  <div
                    key={marker.id}
                    style={{ height: ITEM_HEIGHT }}
                    onClick={() => onSelectMarker(marker.id)}
                    className={`
                      group p-3 sm:p-4 mx-2 mb-2 rounded-xl cursor-pointer flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4
                      transition-all duration-200 ease-in-out border-2 border-transparent
                      hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                      ${
                        isSelected
                          ? "bg-gradient-to-r from-accent-900/30 to-accent-800/20 ring-2 ring-accent-500 border-accent-600 shadow-xl shadow-accent-500/10"
                          : "bg-gray-900/80 hover:bg-gray-800/90 hover:border-gray-600/50"
                      }
                    `}
                  >
                    {/* Enhanced layout with better visual hierarchy */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-grow min-w-0 w-full">
                      {/* GEMS indicator and time - Enhanced design */}
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0 shadow-lg ring-2 ring-gray-700 ${gemColor}`}
                          title={marker.gems || "No GEMS category"}
                        ></div>
                        <div className="font-mono text-sm sm:text-base text-gray-200 font-medium w-20 sm:w-28 md:w-32 flex-shrink-0">
                          <span className="hidden sm:inline">
                            {formatTime(marker.t_start_s)} -{" "}
                            {formatTime(marker.t_end_s)}
                          </span>
                          <span className="sm:hidden">
                            {formatTimeCompact(marker.t_start_s)}-
                            {formatTimeCompact(marker.t_end_s)}
                          </span>
                        </div>
                      </div>

                      {/* Enhanced marker details with better typography */}
                      <div className="flex flex-col min-w-0 flex-grow space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm sm:text-base truncate">
                            {marker.gems || "No GEMS"}
                          </span>
                          {isSelected && (
                            <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        
                        {/* Emotional values display */}
                        <div className="flex gap-3 text-xs text-gray-400">
                          <span title="Valence">V: {marker.valence.toFixed(1)}</span>
                          <span title="Arousal">A: {marker.arousal.toFixed(1)}</span>
                          <span title="Intensity">I: {marker.intensity}</span>
                          <span title="Confidence">C: {marker.confidence.toFixed(1)}</span>
                        </div>
                        
                        <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
                          {marker.imagery || "No imagery description available."}
                        </p>
                      </div>
                    </div>

                    {/* Enhanced delete button with better UX */}
                    <div className="flex justify-end sm:justify-start">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent selection when deleting
                          onDeleteMarker(marker.id);
                        }}
                        variant="destructive"
                        size="icon"
                        className="
                          opacity-0 group-hover:opacity-100 transition-all duration-200 
                          hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl
                          w-8 h-8 sm:w-9 sm:h-9 rounded-full
                          bg-red-600/80 hover:bg-red-500 border border-red-500/50
                        "
                        title="Delete Marker"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualizedMarkerList;
