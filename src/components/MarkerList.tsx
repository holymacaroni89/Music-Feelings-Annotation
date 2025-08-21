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
import { useVirtualScroll } from "../hooks/useVirtualScroll";

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

const ITEM_HEIGHT = 120; // Height of each marker item in pixels

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
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [containerHeight, setContainerHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);

  // Enhanced search with suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const suggestions = new Set<string>();

    // GEMS suggestions
    Object.values(GEMS).forEach((gems) => {
      if (gems.toLowerCase().includes(query)) {
        suggestions.add(gems);
      }
    });

    // Time format suggestions
    if (query.match(/^\d{1,2}$/)) {
      suggestions.add(`${query}:00`);
      suggestions.add(`0${query}:00`);
    }

    // Common search terms
    const commonTerms = [
      "wonder",
      "transcendence",
      "tenderness",
      "nostalgia",
      "peacefulness",
      "power",
      "joy",
      "tension",
      "sadness",
    ];
    commonTerms.forEach((term) => {
      if (term.includes(query)) {
        suggestions.add(term);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }, [searchQuery]);

  // Enhanced search with debouncing and better matching
  const enhancedSearchFilter = useCallback((marker: Marker, query: string) => {
    const searchQuery = query.toLowerCase();

    // Exact matches get higher priority
    if (marker.gems?.toLowerCase() === searchQuery) return 3;
    if (marker.imagery?.toLowerCase() === searchQuery) return 3;

    // Contains matches
    if (marker.gems?.toLowerCase().includes(searchQuery)) return 2;
    if (marker.imagery?.toLowerCase().includes(searchQuery)) return 2;
    if (marker.sync_notes?.toLowerCase().includes(searchQuery)) return 2;

    // Time format matches
    const timeStr = formatTime(marker.t_start_s);
    if (timeStr.includes(searchQuery)) return 1;

    // Partial word matches
    const words = searchQuery.split(" ");
    const markerText = `${marker.gems || ""} ${marker.imagery || ""} ${
      marker.sync_notes || ""
    }`.toLowerCase();

    return words.some((word) => markerText.includes(word)) ? 1 : 0;
  }, []);

  // Filter and sort markers with enhanced search
  const filteredAndSortedMarkers = useMemo(() => {
    let filtered = markers;

    // Apply enhanced search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered
        .map((marker) => ({
          marker,
          searchScore: enhancedSearchFilter(marker, query),
        }))
        .filter((item) => item.searchScore > 0)
        .sort((a, b) => b.searchScore - a.searchScore)
        .map((item) => item.marker);
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
  }, [markers, searchQuery, sortBy, filterBy, enhancedSearchFilter]);

  // Virtualization setup for performance
  const virtualScroll = useVirtualScroll({
    itemHeight: ITEM_HEIGHT,
    containerHeight,
    itemCount: filteredAndSortedMarkers.length,
    overscan: 3,
  });

  // Measure container height for virtualization
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Search history management
  const addToSearchHistory = useCallback((query: string) => {
    if (query.trim()) {
      setSearchHistory((prev) => {
        const filtered = prev.filter((item) => item !== query);
        return [query, ...filtered].slice(0, 5);
      });
    }
  }, []);

  const handleSearchSubmit = useCallback(
    (query: string) => {
      setSearchQuery(query);
      addToSearchHistory(query);
      setShowSearchSuggestions(false);
    },
    [addToSearchHistory]
  );

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
      {/* Header with search and filters - Responsive layout */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-800 bg-gray-900">
        <div className="space-y-3 sm:space-y-4">
          {/* Enhanced Search with Autocomplete */}
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit(searchQuery);
                } else if (e.key === "Escape") {
                  setShowSearchSuggestions(false);
                }
              }}
              className="w-full pl-10 pr-8 bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-accent-400 focus:border-accent-400 hover:bg-gray-600 transition-colors h-10 sm:h-11"
              aria-describedby="search-help"
            />

            {/* Search Suggestions Dropdown */}
            {showSearchSuggestions &&
              (searchQuery.trim() || searchHistory.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                  {/* Search Suggestions */}
                  {searchSuggestions.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs text-gray-400 mb-2 px-2">
                        Suggestions
                      </div>
                      {searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleSearchSubmit(suggestion)}
                          className="w-full text-left px-2 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded transition-colors cursor-pointer"
                        >
                          <SearchIcon className="inline w-3 h-3 mr-2 text-gray-400" />
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search History */}
                  {searchHistory.length > 0 && (
                    <div className="p-2 border-t border-gray-600">
                      <div className="text-xs text-gray-400 mb-2 px-2">
                        Recent searches
                      </div>
                      {searchHistory.map((query, index) => (
                        <div
                          key={index}
                          onClick={() => handleSearchSubmit(query)}
                          className="w-full text-left px-2 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded transition-colors cursor-pointer"
                        >
                          <span className="inline w-3 h-3 mr-2 text-gray-400">
                            ⏱️
                          </span>
                          {query}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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

          {/* Smart Filter System - Modern toggle buttons and chips */}
          <div className="space-y-3">
            {/* GEMS Filter Toggle Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter by Emotion
              </label>
              <div className="flex flex-wrap gap-2">
                {/* All Markers Toggle */}
                <Button
                  variant={filterBy === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterBy("all")}
                  className={`h-8 px-3 text-xs font-medium transition-all ${
                    filterBy === "all"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                  }`}
                >
                  All
                </Button>

                {/* No GEMS Toggle */}
                <Button
                  variant={filterBy === "no-gems" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterBy("no-gems")}
                  className={`h-8 px-3 text-xs font-medium transition-all ${
                    filterBy === "no-gems"
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                  }`}
                >
                  No GEMS
                </Button>

                {/* GEMS Category Toggles */}
                {Object.values(GEMS).map((gems) => (
                  <Button
                    key={gems}
                    variant={filterBy === gems ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBy(gems)}
                    className={`h-8 px-3 text-xs font-medium transition-all ${
                      filterBy === gems
                        ? "text-white shadow-lg"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                    }`}
                    style={{
                      backgroundColor:
                        filterBy === gems ? GEMS_COLORS[gems] : undefined,
                      borderColor:
                        filterBy === gems ? GEMS_COLORS[gems] : undefined,
                    }}
                  >
                    {gems}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort Options - Modern Toggle Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort by
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "time", label: "Time", icon: "⏱️" },
                  { value: "gems", label: "GEMS", icon: "🎭" },
                  { value: "valence", label: "Valence", icon: "😊" },
                  { value: "arousal", label: "Arousal", icon: "⚡" },
                  { value: "intensity", label: "Intensity", icon: "🔥" },
                  { value: "confidence", label: "Confidence", icon: "🎯" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={sortBy === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(option.value as SortOption)}
                    className={`h-8 px-3 text-xs font-medium transition-all ${
                      sortBy === option.value
                        ? "bg-accent-600 hover:bg-accent-700 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                    }`}
                  >
                    <span className="mr-1">{option.icon}</span>
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Active Filters Display */}
            {(filterBy !== "all" || searchQuery.trim() !== "") && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-400">Active filters:</span>

                {/* Search Query Chip */}
                {searchQuery.trim() && (
                  <div className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                    <span>Search: "{searchQuery}"</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="h-4 w-4 p-0 text-white hover:bg-blue-700 rounded-full"
                    >
                      ×
                    </Button>
                  </div>
                )}

                {/* Filter Chip */}
                {filterBy !== "all" && (
                  <div
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white"
                    style={{
                      backgroundColor:
                        filterBy === "no-gems"
                          ? "#6b7280"
                          : GEMS_COLORS[filterBy as GEMS],
                    }}
                  >
                    <span>{filterBy === "no-gems" ? "No GEMS" : filterBy}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilterBy("all")}
                      className="h-4 w-4 p-0 text-white hover:bg-black/20 rounded-full"
                    >
                      ×
                    </Button>
                  </div>
                )}

                {/* Clear All Button */}
                <Button
                  onClick={() => {
                    setFilterBy("all");
                    setSearchQuery("");
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-200 hover:bg-gray-700 px-2 py-1 h-6 text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {/* Enhanced Results Count with Visual Feedback */}
          <div className="flex items-center justify-between text-sm">
            {/* Results Count with Active Filter Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-medium">
                {filteredAndSortedMarkers.length} of {markers.length} markers
              </span>

              {/* Active Filter Indicators */}
              {filterBy !== "all" && (
                <div className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full text-xs border border-blue-600/30">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Filtered
                </div>
              )}

              {searchQuery.trim() && (
                <div className="inline-flex items-center gap-1 bg-green-600/20 text-green-300 px-2 py-1 rounded-full text-xs border border-green-600/30">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Search
                </div>
              )}
            </div>

            {/* Sort Indicator */}
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-xs">Sorted by:</span>
              <span className="text-xs font-medium text-gray-300">
                {sortBy === "time" && "⏱️ Time"}
                {sortBy === "gems" && "🎭 GEMS"}
                {sortBy === "valence" && "😊 Valence"}
                {sortBy === "arousal" && "⚡ Arousal"}
                {sortBy === "intensity" && "🔥 Intensity"}
                {sortBy === "confidence" && "🎯 Confidence"}
              </span>
            </div>
          </div>

          {/* Performance Indicator for Large Datasets */}
          {markers.length > 50 && (
            <div className="text-xs text-gray-500 text-center py-1 bg-gray-800/50 rounded">
              ⚡ Showing {filteredAndSortedMarkers.length} results from{" "}
              {markers.length} total markers
            </div>
          )}
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
          <div
            style={{ height: virtualScroll.totalHeight, position: "relative" }}
          >
            <div
              style={{
                transform: `translateY(${virtualScroll.offsetY}px)`,
                position: "absolute",
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
                          {marker.imagery ||
                            "No imagery description available."}
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

export default MarkerList;
