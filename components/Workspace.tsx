import React from 'react';
import { SettingsIcon } from './icons';
import Timeline from './Timeline';
import MarkerList from './MarkerList';
import { Marker, WaveformPoint, ColorPalette, TrackInfo, MerSuggestion } from '../types';

interface WorkspaceProps {
    showSettings: boolean;
    onToggleSettings: () => void;
    waveformDetail: number;
    onWaveformDetailChange: (detail: number) => void;
    audioBuffer: AudioBuffer | null;
    colorPalette: ColorPalette;
    onColorPaletteChange: (palette: ColorPalette) => void;
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
    onScrub: (time: number) => void;
    onMarkerSelect: (markerId: string | null) => void;
    onMarkerMove: (markerId: string, start: number, end: number) => void;
    onSuggestionClick: (suggestion: MerSuggestion) => void;
    onZoom: (direction: 'in' | 'out') => void;
    warnings: string[];
    onClearWarnings: () => void;
    onDeleteMarker: (markerId: string) => void;
}

const Workspace: React.FC<WorkspaceProps> = ({
    showSettings,
    onToggleSettings,
    waveformDetail,
    onWaveformDetailChange,
    audioBuffer,
    colorPalette,
    onColorPaletteChange,
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
        <div className="flex flex-col flex-grow min-w-0">
            <div className="p-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
                <div className="flex justify-end">
                    <button 
                        onClick={onToggleSettings} 
                        className={`p-1.5 rounded-md transition-colors ${showSettings ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                        title="Visualization Settings"
                    >
                        <SettingsIcon />
                    </button>
                </div>
                {showSettings && (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 p-4 pt-2">
                        <div>
                            <label className="flex justify-between text-sm font-medium text-gray-300">
                                <span>Waveform Detail</span>
                                <span className="text-gray-400">{waveformDetail} points</span>
                            </label>
                             <input
                                type="range"
                                min="500"
                                max="8000"
                                step="100"
                                value={waveformDetail}
                                onChange={(e) => onWaveformDetailChange(parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                disabled={!audioBuffer}
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Low</span>
                                <span>High</span>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="color-palette" className="block text-sm font-medium text-gray-300 mb-1">Color Palette</label>
                            <select
                                id="color-palette"
                                value={colorPalette}
                                onChange={e => onColorPaletteChange(e.target.value as ColorPalette)}
                                className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="vibrant">Vibrant</option>
                                <option value="spectral">Spectral</option>
                                <option value="thermal">Thermal</option>
                                <option value="grayscale">Grayscale</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
            <div className="h-48 flex-shrink-0 border-b border-gray-700">
                {isProcessing && (
                    <div className="w-full h-full flex justify-center items-center text-gray-400">
                        {processingMessage || 'Processing...'}
                    </div>
                )}
                {!isProcessing && audioBuffer && trackInfo ? (
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
                    !isProcessing && <div className="w-full h-full flex justify-center items-center text-gray-500">Please load an audio file to begin.</div>
                )}
            </div>
             {warnings.length > 0 && (
                <div className="p-2 bg-yellow-900 bg-opacity-50 border-t border-b border-yellow-700 text-yellow-300 text-xs flex-shrink-0">
                   <div className="flex justify-between items-center">
                        <span>Import Warnings:</span>
                        <button onClick={onClearWarnings} className="font-bold">✕</button>
                   </div>
                   <ul className="list-disc list-inside mt-1 max-h-24 overflow-y-auto">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
            )}
            <MarkerList
                markers={markers}
                selectedMarkerId={selectedMarkerId}
                onSelectMarker={onMarkerSelect}
                onDeleteMarker={onDeleteMarker}
            />
        </div>
    );
};

export default Workspace;
