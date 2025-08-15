import React from 'react';
import { PlayIcon, PauseIcon, ZoomInIcon, ZoomOutIcon, MarkerIcon, VolumeIcon, UserIcon, PlusIcon, SparklesIcon, LyricsIcon, SettingsIcon } from './icons';
import { Profile, TrackInfo } from '../types';

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
    trainingStatus: 'idle' | 'training' | 'done';
    trackInfo: TrackInfo | null;
    onEditLyricsClick: () => void;
    onAnalyzeEmotions: () => void;
    isProcessing: boolean;
    isPlaying: boolean;
    onTogglePlayPause: () => void;
    pendingMarkerStart: number | null;
    onMarkerCreationToggle: () => void;
    currentTime: number;
    volume: number;
    onVolumeChange: (volume: number) => void;
    onZoom: (direction: 'in' | 'out') => void;
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
    isProcessing,
    isPlaying,
    onTogglePlayPause,
    pendingMarkerStart,
    onMarkerCreationToggle,
    currentTime,
    volume,
    onVolumeChange,
    onZoom,
}) => {
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const refineButtonText = trainingStatus === 'training' ? 'Training...' : trainingStatus === 'done' ? 'Done!' : 'Refine Profile';

    return (
        <header className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded transition-colors">Load Audio</button>
                <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".mp3,.wav,.flac" className="hidden" />
                <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
                    <UserIcon />
                    <select
                        value={activeProfileId || ''}
                        onChange={e => onActiveProfileIdChange(e.target.value)}
                        className="bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button onClick={onAddNewProfileClick} className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600" title="Add new profile">
                        <PlusIcon />
                    </button>
                     <div className="text-xs text-gray-400 ml-2 tabular-nums flex items-center gap-3" title="Number of annotations collected for training the personal AI model.">
                        <span>{trainingDataCount} training points</span>
                        {trainingDataCount >= minTrainingSamples && (
                            <button
                                onClick={onRefineProfile}
                                disabled={trainingStatus === 'training'}
                                className="px-2 py-1 text-xs rounded-md flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-wait"
                            >
                                <SparklesIcon/>
                                {refineButtonText}
                            </button>
                        )}
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    {trackInfo && <span className="text-gray-300 truncate max-w-xs">{trackInfo.name}</span>}
                    {trackInfo && (
                        <button onClick={onEditLyricsClick} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white" title="Find Lyrics & Info">
                            <LyricsIcon />
                        </button>
                    )}
                    {trackInfo && (
                        <button
                            onClick={onAnalyzeEmotions}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-wait"
                            title="Analyze emotions with AI"
                        >
                            <SparklesIcon />
                            <span>Analyze Emotions</span>
                        </button>
                    )}
                </div>
            </div>
            {trackInfo && (
                <div className="flex items-center gap-4">
                     <button onClick={onTogglePlayPause} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <button 
                        onClick={onMarkerCreationToggle} 
                        className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${pendingMarkerStart !== null ? 'bg-yellow-300 text-yellow-900 hover:bg-yellow-400' : 'bg-gray-700 hover:bg-gray-600'}`} 
                        title={pendingMarkerStart !== null ? "Set Marker End (M)" : "Set Marker Start (M)"} 
                        disabled={!trackInfo}
                    >
                        <MarkerIcon />
                    </button>
                    <div className="text-lg font-mono text-gray-200 w-32 text-center">
                       {formatTime(currentTime)} / {formatTime(trackInfo.duration_s)}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                        <VolumeIcon />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            title={`Volume: ${Math.round(volume*100)}%`}
                        />
                    </div>
                </div>
            )}
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Zoom:</span>
                 <button onClick={() => onZoom('in')} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors" title="Zoom In"><ZoomInIcon /></button>
                 <button onClick={() => onZoom('out')} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors" title="Zoom Out"><ZoomOutIcon /></button>
                 <button onClick={onOpenApiSettings} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors ml-2" title="API Key Settings">
                    <SettingsIcon />
                 </button>
            </div>
        </header>
    );
};

export default Header;