import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Marker } from '../types';

interface TimelineProps {
    duration: number;
    currentTime: number;
    markers: Marker[];
    selectedMarkerId: string | null;
    zoom: number; // pixels per second
    pendingMarkerStart: number | null; // New prop for pending marker
    onScrub: (time: number) => void;
    onMarkerSelect: (markerId: string | null) => void;
    onMarkerMove: (markerId: string, newStartTime: number, newEndTime: number) => void;
    onZoom: (direction: 'in' | 'out') => void;
}

const Timeline: React.FC<TimelineProps> = ({
    duration,
    currentTime,
    markers,
    selectedMarkerId,
    zoom,
    pendingMarkerStart,
    onScrub,
    onMarkerSelect,
    onMarkerMove,
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

        ctx.fillStyle = '#23272d';
        ctx.fillRect(0, 0, canvasContentWidth, height);

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

        const playheadX = getXFromTime(currentTime);
        ctx.fillStyle = '#d83c3e';
        ctx.fillRect(playheadX, 0, 2, height);

    }, [duration, currentTime, markers, selectedMarkerId, zoom, getXFromTime, pendingMarkerStart, mouseTime]);

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
        // Prevent scrubbing while placing a marker
        if (pendingMarkerStart !== null) return;

        const time = getMouseEventTime(e);
        const x = getXFromTime(time);

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