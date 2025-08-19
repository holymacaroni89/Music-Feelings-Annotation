import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  Marker,
  WaveformPoint,
  MerSuggestion,
  GEMS,
  ColorPalette,
} from "../types";
import { GEMS_COLORS } from "../constants";

interface TimelineProps {
  duration: number;
  currentTime: number;
  markers: Marker[];
  waveform: WaveformPoint[] | null;
  suggestions: MerSuggestion[];
  selectedMarkerId: string | null;
  zoom: number; // pixels per second
  pendingMarkerStart: number | null; // New prop for pending marker
  colorPalette: ColorPalette;
  onScrub: (time: number) => void;
  onMarkerSelect: (markerId: string | null) => void;
  onMarkerMove: (
    markerId: string,
    newStartTime: number,
    newEndTime: number
  ) => void;
  onSuggestionClick: (suggestion: MerSuggestion) => void;
  onZoom: (direction: "in" | "out") => void;
}

const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  markers,
  waveform,
  suggestions,
  selectedMarkerId,
  zoom,
  pendingMarkerStart,
  colorPalette,
  onScrub,
  onMarkerSelect,
  onMarkerMove,
  onSuggestionClick,
  onZoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // This is the inner, full-width div
  const scrollerRef = useRef<HTMLDivElement>(null); // This is the outer, scrolling div
  const [mouseTime, setMouseTime] = useState<number | null>(null);
  const [hoveredSuggestion, setHoveredSuggestion] =
    useState<MerSuggestion | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

  const interactionState = useRef<{
    isDragging: boolean;
    draggedMarkerId: string | null;
    draggedHandle: "start" | "end" | "body" | null;
    dragOffset: number;
    touchStartPos: { x: number; y: number; time: number } | null;
    hasMoved: boolean;
    isSwipeGesture: boolean;
    swipeStartX: number;
    longPressTimer: NodeJS.Timeout | null;
  }>({
    isDragging: false,
    draggedMarkerId: null,
    draggedHandle: null,
    dragOffset: 0,
    touchStartPos: null,
    hasMoved: false,
    isSwipeGesture: false,
    swipeStartX: 0,
    longPressTimer: null,
  });

  const getXFromTime = useCallback((time: number) => time * zoom, [zoom]);
  const getTimeFromX = useCallback((x: number) => x / zoom, [zoom]);

  // Marker navigation functions
  const navigateToMarker = useCallback(
    (direction: "prev" | "next") => {
      if (markers.length === 0) return;

      const sortedMarkers = [...markers].sort(
        (a, b) => a.t_start_s - b.t_start_s
      );
      const currentIndex = selectedMarkerId
        ? sortedMarkers.findIndex((m) => m.id === selectedMarkerId)
        : -1;

      let targetIndex: number;
      if (direction === "next") {
        targetIndex =
          currentIndex < sortedMarkers.length - 1 ? currentIndex + 1 : 0;
      } else {
        targetIndex =
          currentIndex > 0 ? currentIndex - 1 : sortedMarkers.length - 1;
      }

      const targetMarker = sortedMarkers[targetIndex];
      if (targetMarker) {
        onMarkerSelect(targetMarker.id);
        onScrub(targetMarker.t_start_s);
      }
    },
    [markers, selectedMarkerId, onMarkerSelect, onScrub]
  );

  const animationFrameRef = useRef<number | null>(null);

  // Auto-scroll logic
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !animationFrameRef.current) return; // Only auto-scroll during playback

    const playheadX = getXFromTime(currentTime);
    const scrollerWidth = scroller.clientWidth;
    const scrollLeft = scroller.scrollLeft;

    const isOutOfView =
      playheadX < scrollLeft + 20 ||
      playheadX > scrollLeft + scrollerWidth - 20;

    if (isOutOfView) {
      scroller.scrollTo({
        left: playheadX - scrollerWidth / 2,
        behavior: "smooth",
      });
    }
  }, [currentTime, getXFromTime]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const container = containerRef.current;
    if (!canvas || !ctx || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const canvasContentWidth = duration * zoom;
    if (container.style.width !== `${canvasContentWidth}px`) {
      container.style.width = `${canvasContentWidth}px`;
    }

    const { height } = rect;

    // Background
    ctx.fillStyle = "#23272d";
    ctx.fillRect(0, 0, canvasContentWidth, height);

    // Waveform
    if (waveform) {
      const centerY = height / 2;
      const step = Math.max(1, canvasContentWidth / waveform.length);

      for (let i = 0; i < waveform.length; i++) {
        const point = waveform[i];
        const barHeight = point.amp * centerY;

        let hue: number;
        let saturation = 80;
        let lightness = 60;

        // Use spectralCentroid for color mapping
        const colorValue = point.spectralCentroid;

        switch (colorPalette) {
          case "spectral":
            hue = 300 * (1 - colorValue);
            break;
          case "thermal":
            hue = 60 * colorValue;
            lightness = 40 + colorValue * 50;
            saturation = 90;
            break;
          case "grayscale":
            hue = 0;
            saturation = 0;
            lightness = 30 + colorValue * 60;
            break;
          case "vibrant":
          default:
            hue = 240 - colorValue * 200;
            break;
        }
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`;

        ctx.fillRect(i * step, centerY - barHeight, step, barHeight * 2);
      }
    }

    // Ticks
    const tickInterval = zoom > 50 ? 1 : zoom > 10 ? 5 : 10;
    ctx.font = "10px sans-serif";
    for (let i = 0; i <= duration; i += tickInterval) {
      const x = getXFromTime(i);
      ctx.fillStyle = "#484f58";
      ctx.fillRect(x, height - 10, 1, 10);
      if (zoom > 20) {
        ctx.fillStyle = "#909dab";
        ctx.fillText(String(i), x + 2, height - 12);
      }
    }

    // MER Suggestions are now rendered as HTML elements above the canvas

    // Markers
    markers.forEach((marker) => {
      const startX = getXFromTime(marker.t_start_s);
      const endX = getXFromTime(marker.t_end_s);
      const isSelected = marker.id === selectedMarkerId;
      const isHovered = marker.id === hoveredMarkerId;

      let fillOpacity = 0.2;
      if (isHovered) fillOpacity = 0.3;
      if (isSelected) fillOpacity = 0.4;

      ctx.fillStyle = `rgba(47, 129, 247, ${fillOpacity})`;
      ctx.fillRect(startX, 0, endX - startX, height);

      ctx.fillStyle = isSelected ? "#2f81f7" : "#388bfd";
      ctx.fillRect(startX - 1, 0, 2, height);
      ctx.fillRect(endX - 1, 0, 2, height);
    });

    // Draw pending marker visualization
    if (pendingMarkerStart !== null) {
      const startX = getXFromTime(pendingMarkerStart);
      ctx.fillStyle = "rgba(210, 153, 34, 0.7)";
      ctx.fillRect(startX, 0, 2, height);

      if (mouseTime !== null) {
        const endX = getXFromTime(mouseTime);
        ctx.fillStyle = "rgba(210, 153, 34, 0.3)";
        ctx.fillRect(
          Math.min(startX, endX),
          0,
          Math.abs(endX - startX),
          height
        );
      }
    }

    // Playhead
    const playheadX = getXFromTime(currentTime);
    ctx.fillStyle = "#d83c3e";
    ctx.fillRect(playheadX, 0, 2, height);
  }, [
    duration,
    currentTime,
    markers,
    selectedMarkerId,
    zoom,
    getXFromTime,
    pendingMarkerStart,
    mouseTime,
    waveform,
    colorPalette,
    hoveredMarkerId,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getMouseEventTime = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return getTimeFromX(x);
  };

  const getTouchEventTime = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    const x = touch.clientX - rect.left;
    return getTimeFromX(x);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const time = getMouseEventTime(e);

    // Use hovered suggestion if available, for better click accuracy
    if (hoveredSuggestion) {
      onSuggestionClick(hoveredSuggestion);
      return;
    }

    if (pendingMarkerStart !== null) return;

    let clickedOnMarker = false;
    for (const marker of [...markers].reverse()) {
      const startX = getXFromTime(marker.t_start_s);
      const endX = getXFromTime(marker.t_end_s);
      const x = getXFromTime(time);
      const handleHitboxWidth = 16; // Larger hitbox

      if (
        x >= startX - handleHitboxWidth / 2 &&
        x <= startX + handleHitboxWidth / 2
      ) {
        interactionState.current = {
          isDragging: true,
          draggedMarkerId: marker.id,
          draggedHandle: "start",
          dragOffset: time - marker.t_start_s,
        };
        clickedOnMarker = true;
      } else if (
        x >= endX - handleHitboxWidth / 2 &&
        x <= endX + handleHitboxWidth / 2
      ) {
        interactionState.current = {
          isDragging: true,
          draggedMarkerId: marker.id,
          draggedHandle: "end",
          dragOffset: time - marker.t_end_s,
        };
        clickedOnMarker = true;
      } else if (x > startX && x < endX) {
        interactionState.current = {
          isDragging: true,
          draggedMarkerId: marker.id,
          draggedHandle: "body",
          dragOffset: time - marker.t_start_s,
        };
        clickedOnMarker = true;
      }

      if (clickedOnMarker) {
        if (marker.id !== selectedMarkerId) {
          onMarkerSelect(marker.id);
        }
        break;
      }
    }

    if (!clickedOnMarker) {
      onMarkerSelect(null);
      onScrub(time);
      interactionState.current = {
        isDragging: true,
        draggedMarkerId: null,
        draggedHandle: null,
        dragOffset: 0,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !scrollerRef.current) return;
    const time = Math.max(0, Math.min(duration, getMouseEventTime(e)));
    setMouseTime(time);

    const currentX = getXFromTime(time);

    // Tooltip & Suggestion Hover Logic
    // BUGFIX: Find the CLOSEST suggestion, not the first one in range.
    const suggestionHitRadius = 10;
    let closestSuggestion: MerSuggestion | null = null;
    let minDistance = Infinity;

    for (const suggestion of suggestions) {
      const suggestionX = getXFromTime(suggestion.time);
      const distance = Math.abs(currentX - suggestionX);
      if (distance < minDistance && distance < suggestionHitRadius) {
        minDistance = distance;
        closestSuggestion = suggestion;
      }
    }
    setHoveredSuggestion(closestSuggestion);

    // Cursor and Marker Hover Logic
    let newHoveredMarkerId = null;
    let cursor = "default";
    if (closestSuggestion) {
      cursor = "pointer";
    }

    const handleHitboxWidth = 16;
    for (const marker of markers) {
      const startX = getXFromTime(marker.t_start_s);
      const endX = getXFromTime(marker.t_end_s);
      if (
        currentX > startX + handleHitboxWidth / 2 &&
        currentX < endX - handleHitboxWidth / 2
      ) {
        newHoveredMarkerId = marker.id;
        cursor = interactionState.current.isDragging ? "grabbing" : "grab";
        break;
      }
      if (
        Math.abs(currentX - startX) < handleHitboxWidth / 2 ||
        Math.abs(currentX - endX) < handleHitboxWidth / 2
      ) {
        newHoveredMarkerId = marker.id;
        cursor = "ew-resize";
        break;
      }
    }
    e.currentTarget.style.cursor = cursor;
    if (newHoveredMarkerId !== hoveredMarkerId) {
      setHoveredMarkerId(newHoveredMarkerId);
    }

    // Dragging Logic
    if (!interactionState.current.isDragging) return;

    const { draggedMarkerId, draggedHandle, dragOffset } =
      interactionState.current;
    if (draggedMarkerId && draggedHandle) {
      const marker = markers.find((m) => m.id === draggedMarkerId);
      if (!marker) return;

      if (draggedHandle === "start") {
        const newStartTime = Math.max(0, time);
        onMarkerMove(
          draggedMarkerId,
          newStartTime,
          Math.max(newStartTime + 0.1, marker.t_end_s)
        );
      } else if (draggedHandle === "end") {
        const newEndTime = Math.min(duration, time);
        onMarkerMove(
          draggedMarkerId,
          Math.min(newEndTime - 0.1, marker.t_start_s),
          newEndTime
        );
      } else if (draggedHandle === "body") {
        const newStartTime = time - dragOffset;
        const markerDuration = marker.t_end_s - marker.t_start_s;
        const newEndTime = newStartTime + markerDuration;
        if (newStartTime >= 0 && newEndTime <= duration) {
          onMarkerMove(draggedMarkerId, newStartTime, newEndTime);
        }
      }
    } else {
      onScrub(time);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    interactionState.current.isDragging = false;
    if (containerRef.current) {
      handleMouseMove(e); // To reset cursor to 'grab' if still over a body
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMouseUp(e);
    setMouseTime(null);
    setHoveredSuggestion(null);
    setHoveredMarkerId(null);
    if (e.currentTarget) {
      e.currentTarget.style.cursor = "default";
    }
  };

  // Touch support (basic single-touch for scrub/drag)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const time = getTouchEventTime(e);
    const touch = e.touches[0];

    // Store touch start position for drag/swipe detection
    interactionState.current.touchStartPos = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    interactionState.current.hasMoved = false;
    interactionState.current.isSwipeGesture = false;
    interactionState.current.swipeStartX = touch.clientX;

    // Start long press timer
    interactionState.current.longPressTimer = setTimeout(() => {
      if (
        !interactionState.current.hasMoved &&
        interactionState.current.draggedMarkerId
      ) {
        // Long press detected on a marker - could trigger context menu
        // For now, just select the marker (could be extended with context menu)
        const markerId = interactionState.current.draggedMarkerId;
        if (markerId !== selectedMarkerId) {
          onMarkerSelect(markerId);
        }
        // Add haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 500); // 500ms for long press

    // Handle suggestions immediately
    if (hoveredSuggestion) {
      onSuggestionClick(hoveredSuggestion);
      return;
    }
    if (pendingMarkerStart !== null) return;

    let clickedOnMarker = false;
    const x = getXFromTime(time);
    const handleHitboxWidth = 24; // optimized for touch (44px Apple guideline)

    for (const marker of [...markers].reverse()) {
      const startX = getXFromTime(marker.t_start_s);
      const endX = getXFromTime(marker.t_end_s);
      if (
        x >= startX - handleHitboxWidth / 2 &&
        x <= startX + handleHitboxWidth / 2
      ) {
        interactionState.current = {
          ...interactionState.current,
          isDragging: false, // Don't set dragging yet
          draggedMarkerId: marker.id,
          draggedHandle: "start",
          dragOffset: time - marker.t_start_s,
        };
        clickedOnMarker = true;
      } else if (
        x >= endX - handleHitboxWidth / 2 &&
        x <= endX + handleHitboxWidth / 2
      ) {
        interactionState.current = {
          ...interactionState.current,
          isDragging: false, // Don't set dragging yet
          draggedMarkerId: marker.id,
          draggedHandle: "end",
          dragOffset: time - marker.t_end_s,
        };
        clickedOnMarker = true;
      } else if (x > startX && x < endX) {
        interactionState.current = {
          ...interactionState.current,
          isDragging: false, // Don't set dragging yet
          draggedMarkerId: marker.id,
          draggedHandle: "body",
          dragOffset: time - marker.t_start_s,
        };
        clickedOnMarker = true;
      }
      if (clickedOnMarker) {
        // Don't select marker immediately - wait for drag detection
        break;
      }
    }
    if (!clickedOnMarker) {
      onMarkerSelect(null);
      onScrub(time);
      interactionState.current = {
        ...interactionState.current,
        isDragging: false, // Don't set dragging yet
        draggedMarkerId: null,
        draggedHandle: null,
        dragOffset: 0,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const time = Math.max(0, Math.min(duration, getTouchEventTime(e)));
    const touch = e.touches[0];

    setMouseTime(time);

    // Check if this is the start of a drag or swipe gesture
    if (
      interactionState.current.touchStartPos &&
      !interactionState.current.hasMoved
    ) {
      const deltaX = touch.clientX - interactionState.current.touchStartPos.x;
      const deltaY = Math.abs(
        touch.clientY - interactionState.current.touchStartPos.y
      );
      const swipeThreshold = 50; // pixels for swipe
      const dragThreshold = 8; // pixels for drag

      // Check for horizontal swipe gesture (for marker navigation)
      if (Math.abs(deltaX) > swipeThreshold && deltaY < 30) {
        interactionState.current.hasMoved = true;
        interactionState.current.isSwipeGesture = true;
        // Clear long press timer on movement
        if (interactionState.current.longPressTimer) {
          clearTimeout(interactionState.current.longPressTimer);
          interactionState.current.longPressTimer = null;
        }
        // Don't set isDragging for swipe gestures
      } else if (Math.abs(deltaX) > dragThreshold || deltaY > dragThreshold) {
        interactionState.current.hasMoved = true;
        interactionState.current.isDragging = true;
        // Clear long press timer on movement
        if (interactionState.current.longPressTimer) {
          clearTimeout(interactionState.current.longPressTimer);
          interactionState.current.longPressTimer = null;
        }
      }
    }

    if (!interactionState.current.isDragging) return;
    const { draggedMarkerId, draggedHandle, dragOffset } =
      interactionState.current;
    if (draggedMarkerId && draggedHandle) {
      const marker = markers.find((m) => m.id === draggedMarkerId);
      if (!marker) return;
      if (draggedHandle === "start") {
        const newStartTime = Math.max(0, time);
        onMarkerMove(
          draggedMarkerId,
          newStartTime,
          Math.max(newStartTime + 0.1, marker.t_end_s)
        );
      } else if (draggedHandle === "end") {
        const newEndTime = Math.min(duration, time);
        onMarkerMove(
          draggedMarkerId,
          Math.min(newEndTime - 0.1, marker.t_start_s),
          newEndTime
        );
      } else if (draggedHandle === "body") {
        const newStartTime = time - dragOffset;
        const markerDuration = marker.t_end_s - marker.t_start_s;
        const newEndTime = newStartTime + markerDuration;
        if (newStartTime >= 0 && newEndTime <= duration) {
          onMarkerMove(draggedMarkerId, newStartTime, newEndTime);
        }
      }
    } else {
      onScrub(time);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Handle swipe gestures for marker navigation
    if (
      interactionState.current.isSwipeGesture &&
      interactionState.current.touchStartPos
    ) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - interactionState.current.swipeStartX;
      const swipeThreshold = 50;

      if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
          // Swipe right - go to previous marker
          navigateToMarker("prev");
        } else {
          // Swipe left - go to next marker
          navigateToMarker("next");
        }
      }
    }
    // If this was a tap (not a drag or swipe), handle marker selection
    else if (
      interactionState.current.draggedMarkerId &&
      !interactionState.current.hasMoved
    ) {
      const markerId = interactionState.current.draggedMarkerId;
      if (markerId !== selectedMarkerId) {
        onMarkerSelect(markerId);
      }
    }

    // Clear long press timer
    if (interactionState.current.longPressTimer) {
      clearTimeout(interactionState.current.longPressTimer);
      interactionState.current.longPressTimer = null;
    }

    // Reset interaction state
    interactionState.current.isDragging = false;
    interactionState.current.touchStartPos = null;
    interactionState.current.hasMoved = false;
    interactionState.current.isSwipeGesture = false;
    interactionState.current.swipeStartX = 0;
    interactionState.current.draggedMarkerId = null;
    interactionState.current.draggedHandle = null;
    interactionState.current.dragOffset = 0;

    setHoveredMarkerId(null);
    setHoveredSuggestion(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    onZoom(e.deltaY < 0 ? "in" : "out");
  };

  return (
    <div
      ref={scrollerRef}
      className="w-full h-full cursor-default overflow-x-auto bg-gray-900 relative touch-pan-y"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={containerRef}
        className="relative h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
          }}
        />

        {/* Interactive Suggestion Elements */}
        {suggestions.map((suggestion, index) => {
          const x = getXFromTime(suggestion.time);
          const y = 8; // near the top

          return (
            <div
              key={`suggestion-${suggestion.time}-${index}`}
              className="absolute w-3 h-3 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${x}px`,
                top: `${y}px`,
              }}
              onMouseEnter={() => setHoveredSuggestion(suggestion)}
              onMouseLeave={() => setHoveredSuggestion(null)}
              onClick={() => onSuggestionClick(suggestion)}
            >
              {/* Diamond shape using CSS */}
              <div
                className="w-3 h-3 bg-yellow-300 border border-yellow-900 transform rotate-45"
                style={{
                  boxShadow: "0 0 4px rgba(210, 153, 34, 0.5)",
                }}
              />
            </div>
          );
        })}

        {/* Fixed Position Tooltip - No Layout Shifts */}
        {hoveredSuggestion && (
          <div
            className="absolute z-50 p-3 text-xs text-white bg-gray-800 border border-gray-600 rounded-lg shadow-xl pointer-events-none max-w-[280px]"
            style={{
              left: `${getXFromTime(hoveredSuggestion.time)}px`,
              top: "24px", // Position below the diamond
              transform: "translateX(-50%)", // Center on the diamond
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  hoveredSuggestion.gems
                    ? GEMS_COLORS[hoveredSuggestion.gems]
                    : "bg-gray-500"
                }`}
              ></div>
              <span className="font-bold text-gray-100">
                {hoveredSuggestion.gems || "Suggestion"}
              </span>
              <span className="text-gray-400 font-mono ml-auto">
                @{hoveredSuggestion.time.toFixed(1)}s
              </span>
            </div>
            <div className="space-y-2 text-gray-300">
              {hoveredSuggestion.sync_notes && (
                <div>
                  <span className="font-semibold text-gray-400 mr-1">
                    Sync:
                  </span>
                  <span className="text-sm">
                    {hoveredSuggestion.sync_notes}
                  </span>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-400 mr-1">Audio:</span>
                <span className="text-sm">{hoveredSuggestion.reason}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
