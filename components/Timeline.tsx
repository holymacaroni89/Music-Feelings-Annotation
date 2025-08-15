import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Marker, WaveformPoint, ColorPalette, MerSuggestion } from '../types';

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
    onMarkerMove: (markerId: string, newStartTime: number, newEndTime: number) => void;
    onSuggestionClick: (suggestion: MerSuggestion) => void;
    onZoom: (direction: 'in' | 'out') => void;
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
    onZoom
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mouseTime, setMouseTime] = useState<number | null>(null);
    const interactionState = useRef<{
        isDragging: boolean;
        draggedMarkerId: string | null;
        draggedHandle: 'start' | 'end' | 'body' | null;
        dragOffset: number;
    }>({ isDragging: false, draggedMarkerId: null, draggedHandle: null, dragOffset: 0 });

    const getXFromTime = useCallback((time: number) => time * zoom, [zoom]);
    const getTimeFromX = useCallback((x: number) => x / zoom, [zoom]);

    useEffect(() => {
        const scroller = containerRef.current?.parentElement;
        if (!scroller) return;

        const playheadX = getXFromTime(currentTime);
        const scrollerWidth = scroller.clientWidth;
        const scrollLeft = scroller.scrollLeft;

        const isOutOfView = playheadX < scrollLeft || playheadX > scrollLeft + scrollerWidth;

        if (isOutOfView) {
            scroller.scrollTo({
                left: playheadX - scrollerWidth / 2,
                behavior: 'smooth'
            });
        }
    }, [currentTime, getXFromTime]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
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
        ctx.fillStyle = '#23272d';
        ctx.fillRect(0, 0, canvasContentWidth, height);
        
        // Waveform
        if (waveform) {
            const centerY = height / 2;
            const step = Math.max(1, canvasContentWidth / waveform.length);
            
            for(let i = 0; i < waveform.length; i++) {
                const point = waveform[i];
                const barHeight = point.amp * centerY;
                
                let hue: number;
                let saturation = 80;
                let lightness = 60;

                switch (colorPalette) {
                    case 'spectral':
                        // 300 (violet) -> 0 (red)
                        hue = 300 * (1 - point.colorValue);
                        break;
                    case 'thermal':
                        // 0 (red) -> 60 (yellow)
                        hue = 60 * point.colorValue;
                        lightness = 40 + point.colorValue * 50;
                        saturation = 90;
                        break;
                    case 'grayscale':
                        hue = 0;
                        saturation = 0;
                        lightness = 30 + point.colorValue * 60;
                        break;
                    case 'vibrant':
                    default:
                        // 240 (blue) -> 40 (orange)
                        hue = 240 - (point.colorValue * 200);
                        break;
                }
                ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`;

                ctx.fillRect(i * step, centerY - barHeight, step, barHeight * 2);
            }
        }

        // Ticks
        const tickInterval = zoom > 50 ? 1 : (zoom > 10 ? 5 : 10);
        ctx.font = '10px sans-serif';
        for (let i = 0; i <= duration; i += tickInterval) {
            const x = getXFromTime(i);
            ctx.fillStyle = '#484f58';
            ctx.fillRect(x, height - 10, 1, 10);
            if (zoom > 20) {
                 ctx.fillStyle = '#909dab';
                 ctx.fillText(String(i), x + 2, height - 12);
            }
        }

        // MER Suggestions (Diamonds)
        ctx.fillStyle = 'rgba(210, 153, 34, 0.9)'; // yellow-300
        ctx.strokeStyle = '#34290f'; // yellow-900
        ctx.lineWidth = 1;
        suggestions.forEach(suggestion => {
            const x = getXFromTime(suggestion.time);
            const y = 8; // near the top
            const size = 5;
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(size, 0);
            ctx.lineTo(0, size);
            ctx.lineTo(-size, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });

        // Markers
        markers.forEach(marker => {
            const startX = getXFromTime(marker.t_start_s);
            const endX = getXFromTime(marker.t_end_s);
            const isSelected = marker.id === selectedMarkerId;
            
            ctx.fillStyle = isSelected ? 'rgba(47, 129, 247, 0.4)' : 'rgba(56, 139, 253, 0.2)';
            ctx.fillRect(startX, 0, endX - startX, height);

            ctx.fillStyle = isSelected ? '#2f81f7' : '#388bfd';
            ctx.fillRect(startX - 1, 0, 2, height);
            ctx.fillRect(endX - 1, 0, 2, height);
        });
        
        // Draw pending marker visualization
        if (pendingMarkerStart !== null) {
            const startX = getXFromTime(pendingMarkerStart);
            ctx.fillStyle = 'rgba(210, 153, 34, 0.7)';
            ctx.fillRect(startX, 0, 2, height);

            if(mouseTime !== null) {
                const endX = getXFromTime(mouseTime);
                ctx.fillStyle = 'rgba(210, 153, 34, 0.3)';
                ctx.fillRect(Math.min(startX, endX), 0, Math.abs(endX - startX), height);
            }
        }

        // Playhead
        const playheadX = getXFromTime(currentTime);
        ctx.fillStyle = '#d83c3e';
        ctx.fillRect(playheadX, 0, 2, height);

    }, [duration, currentTime, markers, selectedMarkerId, zoom, getXFromTime, pendingMarkerStart, mouseTime, waveform, colorPalette, suggestions]);

    useEffect(() => {
        draw();
    }, [draw]);

    const getMouseEventTime = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const scrollOffset = e.currentTarget.parentElement?.scrollLeft || 0;
        const x = e.clientX - rect.left + scrollOffset;
        return getTimeFromX(x);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const time = getMouseEventTime(e);
        const x = getXFromTime(time);

        // Check for suggestion click first
        const suggestionHitRadius = 8; // pixels
        for (const suggestion of suggestions) {
            const suggestionX = getXFromTime(suggestion.time);
            const suggestionY = 8;
            const distance = Math.sqrt(Math.pow(x - suggestionX, 2) + Math.pow(e.nativeEvent.offsetY - suggestionY, 2));
            if (distance < suggestionHitRadius) {
                onSuggestionClick(suggestion);
                return;
            }
        }

        // Prevent scrubbing while placing a marker
        if (pendingMarkerStart !== null) return;

        let clickedOnMarker = false;
        for (const marker of [...markers].reverse()) {
            const startX = getXFromTime(marker.t_start_s);
            const endX = getXFromTime(marker.t_end_s);
            const handleWidth = 8;

            if (x >= startX - handleWidth/2 && x <= startX + handleWidth/2) {
                interactionState.current = { isDragging: true, draggedMarkerId: marker.id, draggedHandle: 'start', dragOffset: time - marker.t_start_s };
                clickedOnMarker = true;
            } else if (x >= endX - handleWidth/2 && x <= endX + handleWidth/2) {
                interactionState.current = { isDragging: true, draggedMarkerId: marker.id, draggedHandle: 'end', dragOffset: time - marker.t_end_s };
                clickedOnMarker = true;
            } else if (x > startX && x < endX) {
                interactionState.current = { isDragging: true, draggedMarkerId: marker.id, draggedHandle: 'body', dragOffset: time - marker.t_start_s };
                clickedOnMarker = true;
            }
            
            if(clickedOnMarker) {
                onMarkerSelect(marker.id);
                break;
            }
        }

        if (!clickedOnMarker) {
            onMarkerSelect(null);
            onScrub(time);
            interactionState.current = { isDragging: true, draggedMarkerId: null, draggedHandle: null, dragOffset: 0 };
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const time = Math.max(0, Math.min(duration, getMouseEventTime(e)));
        setMouseTime(time);

        if (!interactionState.current.isDragging) return;
        
        const { draggedMarkerId, draggedHandle, dragOffset } = interactionState.current;
        if (draggedMarkerId && draggedHandle) {
             const marker = markers.find(m => m.id === draggedMarkerId);
             if (!marker) return;

             if (draggedHandle === 'start') {
                 const newStartTime = time;
                 onMarkerMove(draggedMarkerId, newStartTime, Math.max(newStartTime, marker.t_end_s));
             } else if (draggedHandle === 'end') {
                 const newEndTime = time;
                 onMarkerMove(draggedMarkerId, Math.min(newEndTime, marker.t_start_s), newEndTime);
             } else if (draggedHandle === 'body') {
                 const newStartTime = time - dragOffset;
                 const markerDuration = marker.t_end_s - marker.t_start_s;
                 const newEndTime = newStartTime + markerDuration;
                 if(newStartTime >= 0 && newEndTime <= duration) {
                    onMarkerMove(draggedMarkerId, newStartTime, newEndTime);
                 }
             }
        } else {
            onScrub(time);
        }
    };

    const handleMouseUp = () => {
        interactionState.current.isDragging = false;
    };
    
    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        handleMouseUp();
        setMouseTime(null);
    }

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        onZoom(e.deltaY < 0 ? 'in' : 'out');
    };

    return (
        <div 
            className="w-full h-full cursor-pointer overflow-x-auto bg-gray-900"
            onWheel={handleWheel}
        >
            <div
                ref={containerRef}
                className="relative h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                <canvas ref={canvasRef} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }} />
            </div>
        </div>
    );
};

export default Timeline;