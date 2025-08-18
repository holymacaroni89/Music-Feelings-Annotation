import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
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

interface MarkerListProps {
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

const MarkerList: React.FC<MarkerListProps> = ({
  markers,
  selectedMarkerId,
  onSelectMarker,
  onDeleteMarker,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("time");
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

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

  // Keyboard navigation handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (filteredAndSortedMarkers.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < filteredAndSortedMarkers.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (
            focusedIndex >= 0 &&
            focusedIndex < filteredAndSortedMarkers.length
          ) {
            onSelectMarker(filteredAndSortedMarkers[focusedIndex].id);
          }
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          if (
            focusedIndex >= 0 &&
            focusedIndex < filteredAndSortedMarkers.length
          ) {
            onDeleteMarker(filteredAndSortedMarkers[focusedIndex].id);
          }
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(filteredAndSortedMarkers.length - 1);
          break;
      }
    },
    [filteredAndSortedMarkers, focusedIndex, onSelectMarker, onDeleteMarker]
  );

  // Focus management
  useEffect(() => {
    if (focusedIndex >= 0 && markerRefs.current[focusedIndex]) {
      markerRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Reset focus when markers change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery, sortBy, filterBy]);

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
    <div
      className="h-full bg-gray-950 flex flex-col"
      role="region"
      aria-label="Marker list"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Header with search and filters - Optimized spacing */}
      <div className="flex-shrink-0 p-2 border-b border-gray-800 bg-gray-900">
        <div className="space-y-2">
          {/* Search */}
          <div className="relative">
            <label htmlFor="marker-search" className="sr-only">
              Search markers by GEMS, imagery, or time
            </label>
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="marker-search"
              type="text"
              placeholder="Search markers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-8 bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-accent-400 focus:border-accent-400 hover:bg-gray-600 transition-colors"
              aria-describedby="search-help"
            />
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery("")}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-600 rounded-full"
                aria-label="Clear search"
              >
                ×
              </Button>
            )}
            <div id="search-help" className="sr-only">
              Search by GEMS category, imagery description, sync notes, or time
              format
            </div>
          </div>

          {/* Filters and Sort - Compact layout */}
          <div
            className="flex gap-1 sm:gap-2"
            role="group"
            aria-label="Filter and sort controls"
          >
            <Select
              value={filterBy}
              onValueChange={(value: FilterOption) => setFilterBy(value)}
            >
              <SelectTrigger
                className="flex-1 bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 focus:ring-2 focus:ring-accent-400"
                aria-label="Filter markers by GEMS category"
              >
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

            <Select
              value={sortBy}
              onValueChange={(value: SortOption) => setSortBy(value)}
            >
              <SelectTrigger
                className="flex-1 bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 focus:ring-2 focus:ring-accent-400"
                aria-label="Sort markers by criteria"
              >
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

            {/* Clear Filters Button */}
            {(filterBy !== "all" || searchQuery.trim() !== "") && (
              <Button
                onClick={() => {
                  setFilterBy("all");
                  setSearchQuery("");
                }}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-200 hover:bg-gray-700 px-2"
                title="Clear all filters"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Results count with active filter indicator */}
          <div
            className="flex items-center justify-between text-xs text-gray-400"
            role="status"
            aria-live="polite"
            aria-label={`Showing ${filteredAndSortedMarkers.length} of ${markers.length} markers`}
          >
            <span>
              {filteredAndSortedMarkers.length} of {markers.length} markers
              {(filterBy !== "all" || searchQuery.trim() !== "") && (
                <span className="text-accent-400 ml-1">(filtered)</span>
              )}
            </span>
            {searchQuery && (
              <span className="text-accent-400">
                Search: "
                {searchQuery.length > 20
                  ? searchQuery.substring(0, 20) + "..."
                  : searchQuery}
                "
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable marker list */}
      <div
        ref={listRef}
        className="flex-grow overflow-y-auto p-1 sm:p-2 md:p-3"
        role="listbox"
        aria-label="Audio markers"
        aria-multiselectable="false"
      >
        {filteredAndSortedMarkers.length === 0 ? (
          <div
            className="flex justify-center items-center h-32 text-gray-500"
            role="status"
            aria-live="polite"
          >
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
          <div className="space-y-1 sm:space-y-2 md:space-y-3">
            {filteredAndSortedMarkers.map((marker, index) => {
              const isSelected = marker.id === selectedMarkerId;
              const gemColor = marker.gems
                ? GEMS_COLORS[marker.gems]
                : "bg-gray-500 text-gray-50";

              return (
                <div
                  key={marker.id}
                  ref={(el) => (markerRefs.current[index] = el)}
                  onClick={() => onSelectMarker(marker.id)}
                  onFocus={() => setFocusedIndex(index)}
                  role="option"
                  aria-selected={isSelected}
                  aria-label={`Marker at ${formatTime(
                    marker.t_start_s
                  )} to ${formatTime(marker.t_end_s)}, ${
                    marker.gems || "No GEMS"
                  }, ${marker.imagery || "No imagery"}`}
                  tabIndex={focusedIndex === index ? 0 : -1}
                  className={`
                    group p-3 sm:p-4 rounded-xl cursor-pointer flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4
                    transition-all duration-200 ease-in-out border-2 border-transparent
                    hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                    focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-gray-950
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
                        <span title="Valence">
                          V: {marker.valence.toFixed(1)}
                        </span>
                        <span title="Arousal">
                          A: {marker.arousal.toFixed(1)}
                        </span>
                        <span title="Intensity">I: {marker.intensity}</span>
                        <span title="Confidence">
                          C: {marker.confidence.toFixed(1)}
                        </span>
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
        )}
      </div>
    </div>
  );
};

export default MarkerList;
