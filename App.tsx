import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XIcon, SearchIcon, SpinnerIcon } from './components/icons';
import Header from './components/Header';
import Workspace from './components/Workspace';
import Footer from './components/Footer';
import LabelPanel from './components/LabelPanel';
import Modal from './components/Modal';
import { Marker, TrackInfo, ColorPalette, GeniusSong } from './types';
import { exportToCsv, importFromCsv } from './services/csvService';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useAnnotationSystem, GeniusSearchState } from './hooks/useAnnotationSystem';

// --- Helper Functions ---
const stringToHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return hash.toString();
};


// --- Genius Search Modal Component ---
interface GeniusSearchModalProps {
    trackInfo: TrackInfo;
    geniusSearchState: GeniusSearchState;
    searchGenius: (query: string) => void;
    fetchLyricsAndMetadata: (song: GeniusSong) => Promise<{ lyrics: string; metadata: { title: string; artist: string; } } | null>;
    onLyricsUpdate: (lyrics: string) => void;
    onTrackInfoUpdate: (metadata: { title: string; artist: string; }) => void;
    onSwitchToManual: () => void;
    onClose: () => void;
}

const GeniusSearchModal: React.FC<GeniusSearchModalProps> = ({
    trackInfo, geniusSearchState, searchGenius, fetchLyricsAndMetadata, 
    onLyricsUpdate, onTrackInfoUpdate, onSwitchToManual, onClose
}) => {
    const [query, setQuery] = useState(`${trackInfo.title} ${trackInfo.artist}`);
    
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchGenius(query);
    };

    const handleSelectSong = async (song: GeniusSong) => {
        const result = await fetchLyricsAndMetadata(song);
        if (result) {
            onLyricsUpdate(result.lyrics);
            onTrackInfoUpdate(result.metadata);
            onClose();
        }
    };

    return (
        <>
            <div className="p-6">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-100">Find Lyrics on Genius</h3>
                        <p className="text-sm text-gray-400">Accurate lyrics provide crucial context for the AI analysis.</p>
                    </div>
                   <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                       <XIcon />
                   </button>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-grow bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter song title and artist..."
                        autoFocus
                    />
                    <button type="submit" className="bg-blue-500 hover:bg-blue-400 text-white font-bold p-2 rounded transition-colors flex items-center justify-center w-12" disabled={geniusSearchState.status === 'searching'}>
                        {geniusSearchState.status === 'searching' ? <SpinnerIcon /> : <SearchIcon />}
                    </button>
                </form>

                <div className="h-64 overflow-y-auto pr-2">
                    {geniusSearchState.status === 'results' && geniusSearchState.results.length === 0 && (
                         <div className="text-center text-gray-500 pt-8">No results found. Try a different search query.</div>
                    )}
                     {geniusSearchState.status === 'error' && (
                         <div className="text-center text-red-400 pt-8">{geniusSearchState.error}</div>
                    )}
                    {(geniusSearchState.status === 'searching' || geniusSearchState.status === 'fetching') && (
                        <div className="flex justify-center items-center h-full">
                            <SpinnerIcon />
                        </div>
                    )}
                    {geniusSearchState.status === 'results' && geniusSearchState.results.length > 0 && (
                        <ul className="space-y-2">
                            {geniusSearchState.results.map(song => (
                                <li key={song.id} onClick={() => handleSelectSong(song)} className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors">
                                    <img src={song.thumbnailUrl} alt="Album art" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-white font-semibold truncate">{song.title}</p>
                                        <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <div className="bg-gray-700 px-6 py-4 flex justify-between items-center rounded-b-lg">
                <button onClick={onSwitchToManual} className="text-sm text-blue-400 hover:underline">
                    Enter Lyrics Manually
                </button>
                <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors">
                    Cancel
                </button>
            </div>
        </>
    )
};


// --- Main App Component ---
const App: React.FC = () => {
    const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
    const [zoom, setZoom] = useState(20);
    const [warnings, setWarnings] = useState<string[]>([]);

    // Visualization Settings
    const [showSettings, setShowSettings] = useState(false);
    const [waveformDetail, setWaveformDetail] = useState(2000);
    const [colorPalette, setColorPalette] = useState<ColorPalette>('vibrant');

    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    const {
        audioContext, audioBuffer, waveform, isPlaying, currentTime, volume,
        setVolume, initializeAudio, generateWaveform, resetAudio, scrub, togglePlayPause
    } = useAudioEngine();

    const {
        markers, setMarkers, selectedMarkerId, setSelectedMarkerId, pendingMarkerStart,
        setPendingMarkerStart, merSuggestions, setLyrics, profiles, activeProfileId, setActiveProfileId,
        trainingDataCount, trainingStatus, modalConfig, setModalConfig, modalInputValue, setModalInputValue, setIsDirty,
        updateMarker, deleteMarker, handleMarkerCreationToggle, handleSuggestionClick, analyzeEmotions,
        refineProfile, openModal, openManualLyricsModal, handleModalSubmit, MIN_TRAINING_SAMPLES, geniusSearchState, searchGenius, fetchLyricsAndMetadata
    } = useAnnotationSystem(trackInfo);
    
    // Effect to generate waveform when audio buffer is ready or detail level changes
    useEffect(() => {
        if (audioBuffer) {
            setIsProcessing(true);
            setProcessingMessage('Generating audio waveform...');
            generateWaveform(audioBuffer, waveformDetail).then(() => {
                 setIsProcessing(false);
                 setProcessingMessage('');
            });
        }
    }, [audioBuffer, waveformDetail, generateWaveform]);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !audioContext) {
            if (e.target) e.target.value = '';
            return;
        }

        setIsProcessing(true);
        setProcessingMessage('Decoding audio file...');
        
        resetAudio();
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            const localId = `${stringToHash(file.name)}-${file.size}`;
            const newTrackInfo: TrackInfo = {
                localId,
                name: file.name,
                duration_s: decodedBuffer.duration,
                title: file.name.split('.').slice(0, -1).join('.'),
                artist: 'Unknown Artist',
            };

            setTrackInfo(newTrackInfo);
            initializeAudio(decodedBuffer);

        } catch (err) {
            alert(`Error decoding audio data: ${err instanceof Error ? err.message : String(err)}`);
            setTrackInfo(null);
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
            if (e.target) e.target.value = '';
        }
    }, [audioContext, initializeAudio, resetAudio]);


    const handleAnalyzeEmotions = async () => {
        if (!waveform || !trackInfo) return;

        setIsProcessing(true);
        setProcessingMessage('Analyzing emotions with AI...');
        try {
            await analyzeEmotions(waveform, trackInfo.duration_s);
        } catch (error) {
            console.error("AI analysis failed:", error);
            alert("Could not get emotion analysis from the AI. Please check your API key and network connection.");
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };

    const handleSelectMarkerAndSeek = useCallback((markerId: string | null) => {
        setSelectedMarkerId(markerId);
        if (markerId) {
            const marker = markers.find(m => m.id === markerId);
            if (marker) {
                scrub(marker.t_start_s);
            }
        }
    }, [markers, scrub, setSelectedMarkerId]);
    
    const handleMarkerMove = (markerId: string, newStartTime: number, newEndTime: number) => {
        if(!trackInfo) return;
        const marker = markers.find(m => m.id === markerId);
        if(!marker) return;

        const clampedStartTime = Math.max(0, Math.min(newStartTime, trackInfo.duration_s));
        const clampedEndTime = Math.max(clampedStartTime, Math.min(newEndTime, trackInfo.duration_s));
        
        updateMarker({ ...marker, t_start_s: clampedStartTime, t_end_s: clampedEndTime });
    };

    // --- Keyboard Shortcuts ---
    const handleKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
        if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/) || !!modalConfig) return;
        
        switch(e.code) {
            case 'Space': e.preventDefault(); togglePlayPause(); break;
            case 'KeyM': e.preventDefault(); handleMarkerCreationToggle(currentTime); break;
            case 'Escape': e.preventDefault(); if (pendingMarkerStart !== null) setPendingMarkerStart(null); break;
            case 'Delete':
            case 'Backspace': 
                e.preventDefault(); 
                if(selectedMarkerId) deleteMarker(selectedMarkerId); 
                break;
            case 'ArrowRight': e.preventDefault(); scrub(currentTime + (e.shiftKey ? 1 : 5)); break;
            case 'ArrowLeft': e.preventDefault(); scrub(currentTime - (e.shiftKey ? 1 : 5)); break;
        }
    }, [togglePlayPause, handleMarkerCreationToggle, selectedMarkerId, deleteMarker, scrub, currentTime, pendingMarkerStart, modalConfig]);
    
    useEffect(() => {
        window.addEventListener('keydown', handleKeyboardShortcuts);
        return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
    }, [handleKeyboardShortcuts]);

    // --- Import/Export ---
    const handleExport = () => {
        if (markers.length === 0) { alert("No markers to export."); return; }
        const csvString = exportToCsv(markers);
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${trackInfo?.title || 'markers'}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!trackInfo) { alert("Please load an audio track before importing markers."); return; }
        if (!confirm("This will replace all current markers. Are you sure?")) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const { markers: importedMarkers, warnings: importWarnings } = importFromCsv(event.target?.result as string);
            if (importedMarkers.length > 0 && importedMarkers[0].trackLocalId !== trackInfo.localId) {
                importWarnings.unshift("Warning: Imported markers seem to be for a different file.");
            }
            setMarkers(importedMarkers.sort((a,b) => a.t_start_s - b.t_start_s));
            setSelectedMarkerId(null);
            setIsDirty(true);
            setWarnings(importWarnings);
        };
        reader.readAsText(file);
        if (e.target) e.target.value = '';
    };

    const selectedMarker = markers.find(m => m.id === selectedMarkerId) || null;
    
    return (
        <div className="h-screen w-screen bg-gray-900 flex flex-col font-sans">
            <Header
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
                profiles={profiles}
                activeProfileId={activeProfileId}
                onActiveProfileIdChange={setActiveProfileId}
                onAddNewProfileClick={() => openModal('ADD_PROFILE')}
                onOpenApiSettings={() => openModal('API_KEYS')}
                trainingDataCount={trainingDataCount}
                minTrainingSamples={MIN_TRAINING_SAMPLES}
                onRefineProfile={refineProfile}
                trainingStatus={trainingStatus}
                trackInfo={trackInfo}
                onEditLyricsClick={() => openModal('SEARCH_GENIUS')}
                onAnalyzeEmotions={handleAnalyzeEmotions}
                isProcessing={isProcessing}
                isPlaying={isPlaying}
                onTogglePlayPause={togglePlayPause}
                pendingMarkerStart={pendingMarkerStart}
                onMarkerCreationToggle={() => handleMarkerCreationToggle(currentTime)}
                currentTime={currentTime}
                volume={volume}
                onVolumeChange={setVolume}
                onZoom={(dir) => setZoom(z => dir === 'in' ? Math.min(z * 1.5, 500) : Math.max(z / 1.5, 5))}
            />

            <main className="flex flex-grow overflow-hidden">
                <Workspace
                     showSettings={showSettings}
                     onToggleSettings={() => setShowSettings(!showSettings)}
                     waveformDetail={waveformDetail}
                     onWaveformDetailChange={setWaveformDetail}
                     audioBuffer={audioBuffer}
                     colorPalette={colorPalette}
                     onColorPaletteChange={setColorPalette}
                     isProcessing={isProcessing}
                     processingMessage={processingMessage}
                     trackInfo={trackInfo}
                     currentTime={currentTime}
                     markers={markers}
                     waveform={waveform}
                     merSuggestions={merSuggestions}
                     selectedMarkerId={selectedMarkerId}
                     zoom={zoom}
                     pendingMarkerStart={pendingMarkerStart}
                     onScrub={scrub}
                     onMarkerSelect={handleSelectMarkerAndSeek}
                     onMarkerMove={handleMarkerMove}
                     onSuggestionClick={handleSuggestionClick}
                     onZoom={(dir) => setZoom(z => dir === 'in' ? Math.min(z * 1.5, 500) : Math.max(z / 1.5, 5))}
                     warnings={warnings}
                     onClearWarnings={() => setWarnings([])}
                     onDeleteMarker={deleteMarker}
                />
                
                <LabelPanel selectedMarker={selectedMarker} onUpdateMarker={updateMarker} onDeleteMarker={deleteMarker}/>
            </main>

            <Footer
                isDirty={false}
                importInputRef={importInputRef}
                onImport={handleImport}
                onExport={handleExport}
                markers={markers}
            />
            
            {modalConfig && (
                <Modal onClose={() => setModalConfig(null)}>
                     {modalConfig.type === 'SEARCH_GENIUS' && trackInfo ? (
                        <GeniusSearchModal 
                            trackInfo={trackInfo}
                            geniusSearchState={geniusSearchState}
                            searchGenius={searchGenius}
                            fetchLyricsAndMetadata={fetchLyricsAndMetadata}
                            onLyricsUpdate={setLyrics}
                            onTrackInfoUpdate={(meta) => setTrackInfo(ti => ti ? { ...ti, ...meta } : null)}
                            onSwitchToManual={openManualLyricsModal}
                            onClose={() => setModalConfig(null)}
                        />
                     ) : (
                        <>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                   <h3 className="text-xl font-bold text-gray-100">{modalConfig.title}</h3>
                                   <button onClick={() => setModalConfig(null)} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                                       <XIcon />
                                   </button>
                                </div>
                                
                                {modalConfig.type === 'ADD_PROFILE' && (
                                    <input
                                        type="text"
                                        value={modalInputValue}
                                        onChange={(e) => setModalInputValue(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter profile name..."
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()}
                                    />
                                )}
                                {modalConfig.type === 'MANUAL_LYRICS' && (
                                    <textarea
                                        value={modalInputValue}
                                        onChange={(e) => setModalInputValue(e.target.value)}
                                        rows={15}
                                        className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                        placeholder="Paste lyrics here..."
                                        autoFocus
                                    />
                                )}
                                {modalConfig.type === 'API_KEYS' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="genius-api-key" className="block text-sm font-medium text-gray-300 mb-1">Genius API Key (Client Access Token)</label>
                                            <input
                                                id="genius-api-key"
                                                type="password"
                                                value={modalInputValue}
                                                onChange={(e) => setModalInputValue(e.target.value)}
                                                className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Paste your key here"
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Your key is stored securely in your browser's local storage.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="bg-gray-700 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                                <button onClick={() => setModalConfig(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleModalSubmit} className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded transition-colors">
                                    {modalConfig.submitText}
                                </button>
                            </div>
                        </>
                    )}
                </Modal>
            )}
        </div>
    );
};

export default App;