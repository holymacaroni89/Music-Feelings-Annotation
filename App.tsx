import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { PlayIcon, PauseIcon, ZoomInIcon, ZoomOutIcon, MarkerIcon, VolumeIcon, SettingsIcon, UserIcon, PlusIcon, SparklesIcon, LyricsIcon, XIcon } from './components/icons';
import Timeline from './components/Timeline';
import LabelPanel from './components/LabelPanel';
import MarkerList from './components/MarkerList';
import Modal from './components/Modal';
import { Marker, AppState, TrackInfo, WaveformPoint, ColorPalette, Profile, MerSuggestion, TrainingSample, GEMS, Trigger } from './types';
import { AUTOSAVE_KEY, GEMS_OPTIONS, TRIGGER_OPTIONS } from './constants';
import { exportToCsv, importFromCsv } from './services/csvService';
import * as trainingService from './services/trainingService';
import * as mlService from './services/mlService';
import * as geminiService from './services/geminiService';


const MIN_TRAINING_SAMPLES = 10;

// --- Helper Functions ---
const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const stringToHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return hash.toString();
};

const generateSpectralWaveformData = async (audioBuffer: AudioBuffer, targetPoints: number = 2000): Promise<WaveformPoint[]> => {
    return new Promise(resolve => {
        const rawData = audioBuffer.getChannelData(0);
        const totalSamples = rawData.length;
        const samplesPerPoint = Math.floor(totalSamples / targetPoints);
        const waveformData: { amp: number; zcr: number }[] = [];
        let maxZcr = 0;

        for (let i = 0; i < targetPoints; i++) {
            const startIndex = i * samplesPerPoint;
            const endIndex = Math.min(startIndex + samplesPerPoint, totalSamples);
            let peak = 0;
            let zeroCrossings = 0;

            for (let j = startIndex; j < endIndex; j++) {
                const sample = rawData[j];
                if (Math.abs(sample) > peak) {
                    peak = Math.abs(sample);
                }
                if (j > startIndex) {
                    if (Math.sign(rawData[j]) !== Math.sign(rawData[j - 1])) {
                        zeroCrossings++;
                    }
                }
            }
            
            const zcr = samplesPerPoint > 0 ? zeroCrossings / samplesPerPoint : 0;
            waveformData.push({ amp: peak, zcr });

            if (zcr > maxZcr) {
                maxZcr = zcr;
            }
        }
        
        const finalWaveform: WaveformPoint[] = waveformData.map(data => ({
            amp: data.amp,
            colorValue: maxZcr > 0 ? data.zcr / maxZcr : 0,
        }));
        
        resolve(finalWaveform);
    });
};

interface ModalConfig {
    type: 'ADD_PROFILE' | 'EDIT_LYRICS';
    title: string;
    submitText: string;
}


// --- Main App Component ---
const App: React.FC = () => {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
    const [lyrics, setLyrics] = useState('');
    
    const [markers, setMarkers] = useState<Marker[]>([]);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [pendingMarkerStart, setPendingMarkerStart] = useState<number | null>(null);
    const [waveform, setWaveform] = useState<WaveformPoint[] | null>(null);
    const [merSuggestions, setMerSuggestions] = useState<MerSuggestion[]>([]);

    // Profile State
    const [profiles, setProfiles] = useState<Profile[]>([{ id: 'default', name: 'Default Profile' }]);
    const [activeProfileId, setActiveProfileId] = useState<string>('default');
    const [trainingDataCount, setTrainingDataCount] = useState(0);
    
    // AI Model State
    const [personalModel, setPersonalModel] = useState<tf.LayersModel | null>(null);
    const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'done'>('idle');
    
    // Modal State
    const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
    const [modalInputValue, setModalInputValue] = useState('');

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [zoom, setZoom] = useState(20);
    const [volume, setVolume] = useState(1);
    
    // Visualization Settings
    const [showSettings, setShowSettings] = useState(false);
    const [waveformDetail, setWaveformDetail] = useState(2000);
    const [colorPalette, setColorPalette] = useState<ColorPalette>('vibrant');

    const [isDirty, setIsDirty] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [warnings, setWarnings] = useState<string[]>([]);

    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const playbackStartTimeRef = useRef(0);
    const playbackOffsetRef = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    
    // --- AI Training Data Collection ---
    const findClosestSuggestion = useCallback((time: number): MerSuggestion | null => {
        if (merSuggestions.length === 0) return null;
        return merSuggestions.reduce((closest, current) => {
            const closestDiff = Math.abs(closest.time - time);
            const currentDiff = Math.abs(current.time - time);
            return currentDiff < closestDiff ? current : closest;
        }, merSuggestions[0]);
    }, [merSuggestions]);

    const captureTrainingSample = useCallback((userMarkerData: { valence: number; arousal: number }, time: number) => {
        if (!activeProfileId) return;

        const aiPrediction = findClosestSuggestion(time);
        if (!aiPrediction) return;

        const newSample: TrainingSample = {
            input: {
                valence: aiPrediction.valence,
                arousal: aiPrediction.arousal,
            },
            output: {
                valence: userMarkerData.valence,
                arousal: userMarkerData.arousal,
            },
        };

        trainingService.addTrainingSample(activeProfileId, newSample);
        setTrainingDataCount(prev => prev + 1);
    }, [activeProfileId, findClosestSuggestion]);
    
    useEffect(() => {
        if (activeProfileId) {
            const count = trainingService.getTrainingDataCountForProfile(activeProfileId);
            setTrainingDataCount(count);
            // Attempt to load a personal model for the new active profile
            mlService.loadModel(activeProfileId).then(setPersonalModel);
        }
    }, [activeProfileId]);


    // --- Audio Handling ---
    const stopPlayback = useCallback(() => {
        if (audioSourceRef.current) {
            audioSourceRef.current.onended = null; // Prevent onended from firing on manual stop
            try {
                audioSourceRef.current.stop();
            } catch (e) {
                // Some browsers throw an error if stop is called on an already stopped source.
            }
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const startPlayback = useCallback((startTime: number) => {
        if (!audioContext || !audioBuffer || !gainNodeRef.current || audioSourceRef.current) return;
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gainNodeRef.current);
        
        const offset = Math.max(0, startTime >= audioBuffer.duration ? 0 : startTime);
        playbackStartTimeRef.current = audioContext.currentTime;
        playbackOffsetRef.current = offset;
        setCurrentTime(offset);

        source.start(0, offset);
        audioSourceRef.current = source;
        setIsPlaying(true);
        
        source.onended = () => {
             if (audioSourceRef.current === source) {
                stopPlayback();
                setCurrentTime(audioBuffer.duration);
             }
        };
    }, [audioContext, audioBuffer, stopPlayback]);

    const updateTime = useCallback(() => {
        if (!isPlaying || !audioContext) return;
        const newTime = playbackOffsetRef.current + (audioContext.currentTime - playbackStartTimeRef.current);
        setCurrentTime(newTime);
        animationFrameRef.current = requestAnimationFrame(updateTime);
    }, [audioContext, isPlaying]);

    useEffect(() => {
        if (isPlaying) {
            animationFrameRef.current = requestAnimationFrame(updateTime);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, updateTime]);
    
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = volume;
        }
    }, [volume]);

    const loadAudioFile = useCallback(async (file: File) => {
        let context = audioContext;
        if (!context) {
            context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const gainNode = context.createGain();
            gainNode.connect(context.destination);
            gainNodeRef.current = gainNode;
            setAudioContext(context);
        }
        if (context.state === 'suspended') {
            await context.resume();
        }
        
        setIsProcessing(true);
        setProcessingMessage('Decoding audio file...');
        setMerSuggestions([]);
        setLyrics(''); // Reset lyrics on new file load
        const reader = new FileReader();
        reader.onload = async (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            if (context) {
                try {
                    const buffer = await context.decodeAudioData(arrayBuffer);
                    const localId = `${stringToHash(file.name)}-${file.size}`;
                    const newTrackInfo: TrackInfo = {
                        localId,
                        name: file.name,
                        duration_s: buffer.duration,
                        title: file.name.split('.').slice(0, -1).join('.'),
                        artist: 'Unknown Artist',
                    };
                    
                    if (isPlaying) stopPlayback();

                    setAudioBuffer(buffer);
                    setTrackInfo(newTrackInfo);
                    setCurrentTime(0);
                    playbackOffsetRef.current = 0;
                    setMarkers([]);
                    setSelectedMarkerId(null);
                    setPendingMarkerStart(null);
                    setWaveform(null);

                } catch (err) {
                    setIsProcessing(false);
                    setProcessingMessage('');
                    alert(`Error decoding audio data: ${err instanceof Error ? err.message : String(err)}`);
                }
            }
        };
        reader.readAsArrayBuffer(file);
    }, [audioContext, isPlaying, stopPlayback]);
    
    useEffect(() => {
        if (audioBuffer) {
            setIsProcessing(true);
            setProcessingMessage('Generating audio waveform...');
            generateSpectralWaveformData(audioBuffer, waveformDetail).then(spectralWaveform => {
                setWaveform(spectralWaveform);
                setIsProcessing(false);
                setProcessingMessage('');
            });
        }
    }, [audioBuffer, waveformDetail]);

    const handleAnalyzeEmotions = async () => {
        if (!waveform || !trackInfo) return;

        setIsProcessing(true);
        setProcessingMessage('Analyzing emotions with AI...');
        try {
            const baseSuggestions = await geminiService.generateMerSuggestions(waveform, trackInfo.duration_s, lyrics);
            if (personalModel) {
                console.log("Applying personal model to Gemini suggestions...");
                const refinedSuggestions = mlService.predict(personalModel, baseSuggestions);
                setMerSuggestions(refinedSuggestions);
            } else {
                setMerSuggestions(baseSuggestions);
            }
        } catch (error) {
            console.error("AI analysis failed:", error);
            alert("Could not get emotion analysis from the AI. Please check your API key and network connection.");
            setMerSuggestions([]); // Clear suggestions on error
        } finally {
            setIsProcessing(false);
            setProcessingMessage('');
        }
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            loadAudioFile(file);
        }
        e.target.value = ''; // Reset file input
    };
    
    const togglePlayPause = useCallback(() => {
        if (!audioContext || !audioBuffer) return;
        if(audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        if (isPlaying) {
            stopPlayback();
        } else {
            const time = currentTime >= audioBuffer.duration ? 0 : currentTime;
            startPlayback(time);
        }
    }, [audioContext, audioBuffer, isPlaying, startPlayback, stopPlayback, currentTime]);

    const handleScrub = useCallback((time: number) => {
        if (!audioBuffer) return;
        const wasPlaying = isPlaying;
        if (wasPlaying) {
            stopPlayback();
        }
        const newTime = Math.max(0, Math.min(time, audioBuffer.duration));
        setCurrentTime(newTime);
        playbackOffsetRef.current = newTime;
        if (wasPlaying) {
            startPlayback(newTime);
        }
    }, [audioBuffer, isPlaying, startPlayback, stopPlayback]);

    // --- Marker Handling ---
    const handleSuggestionClick = (suggestion: MerSuggestion) => {
        if (!trackInfo) return;

        const newMarker: Marker = {
            id: crypto.randomUUID(),
            trackLocalId: trackInfo.localId,
            title: trackInfo.title,
            artist: trackInfo.artist,
            duration_s: trackInfo.duration_s,
            t_start_s: suggestion.time,
            t_end_s: Math.min(suggestion.time + 10.0, trackInfo.duration_s),
            valence: parseFloat(suggestion.valence.toFixed(2)),
            arousal: parseFloat(suggestion.arousal.toFixed(2)),
            intensity: suggestion.intensity,
            confidence: parseFloat(suggestion.confidence.toFixed(2)),
            gems: suggestion.gems,
            trigger: suggestion.trigger,
            imagery: suggestion.reason, 
            sync_notes: suggestion.sync_notes,
        };

        const newMarkers = [...markers, newMarker].sort((a,b) => a.t_start_s - b.t_start_s);
        setMarkers(newMarkers);
        setSelectedMarkerId(newMarker.id);
        setIsDirty(true);
        captureTrainingSample({ valence: newMarker.valence, arousal: newMarker.arousal }, newMarker.t_start_s);
    };

    const handleMarkerCreationToggle = useCallback(() => {
        if (!trackInfo) return;

        if (pendingMarkerStart !== null) {
            // This is the second click: finalize the marker
            const t1 = pendingMarkerStart;
            const t2 = currentTime;

            let t_start_s = Math.min(t1, t2);
            let t_end_s = Math.max(t1, t2);

            // Enforce minimum duration of 1 second
            if (t_end_s - t_start_s < 1.0) {
                t_end_s = t_start_s + 1.0;
            }
            
            // Clamp to track duration
            t_end_s = Math.min(trackInfo.duration_s, t_end_s);

            const randomTriggerIndex = Math.floor(Math.random() * TRIGGER_OPTIONS.length);
            const newMarker: Marker = {
                id: crypto.randomUUID(),
                trackLocalId: trackInfo.localId,
                title: trackInfo.title,
                artist: trackInfo.artist,
                duration_s: trackInfo.duration_s,
                t_start_s,
                t_end_s,
                valence: parseFloat((Math.random() * 2 - 1).toFixed(2)),
                arousal: parseFloat(Math.random().toFixed(2)),
                intensity: Math.floor(Math.random() * 101),
                confidence: parseFloat((0.75 + Math.random() * 0.25).toFixed(2)),
                gems: GEMS_OPTIONS[Math.floor(Math.random() * GEMS_OPTIONS.length)],
                trigger: [TRIGGER_OPTIONS[randomTriggerIndex]],
                imagery: '', sync_notes: '',
            };
            const newMarkers = [...markers, newMarker].sort((a,b) => a.t_start_s - b.t_start_s);
            setMarkers(newMarkers);
            setSelectedMarkerId(newMarker.id);
            setPendingMarkerStart(null);
            setIsDirty(true);
            captureTrainingSample({ valence: newMarker.valence, arousal: newMarker.arousal }, newMarker.t_start_s);
        } else {
            // This is the first click: set the start point
            setPendingMarkerStart(currentTime);
            setSelectedMarkerId(null);
        }
    }, [trackInfo, currentTime, pendingMarkerStart, markers, captureTrainingSample]);

    const updateMarker = (updatedMarker: Marker) => {
        setMarkers(prev => prev.map(m => m.id === updatedMarker.id ? updatedMarker : m).sort((a,b) => a.t_start_s - b.t_start_s));
        setIsDirty(true);
        captureTrainingSample({ valence: updatedMarker.valence, arousal: updatedMarker.arousal }, updatedMarker.t_start_s);
    };

    const deleteMarker = useCallback((markerId: string) => {
        setMarkers(prev => prev.filter(m => m.id !== markerId));
        if (selectedMarkerId === markerId) {
            setSelectedMarkerId(null);
        }
        setIsDirty(true);
    }, [selectedMarkerId]);
    
    const handleMarkerMove = (markerId: string, newStartTime: number, newEndTime: number) => {
        if(!trackInfo) return;
        const marker = markers.find(m => m.id === markerId);
        if(!marker) return;

        const clampedStartTime = Math.max(0, Math.min(newStartTime, trackInfo.duration_s));
        const clampedEndTime = Math.max(clampedStartTime, Math.min(newEndTime, trackInfo.duration_s));
        
        updateMarker({ ...marker, t_start_s: clampedStartTime, t_end_s: clampedEndTime });
    };

    const handleSelectMarkerAndSeek = useCallback((markerId: string | null) => {
        setSelectedMarkerId(markerId);
        if (markerId) {
            const marker = markers.find(m => m.id === markerId);
            if (marker) {
                handleScrub(marker.t_start_s);
            }
        }
    }, [markers, handleScrub]);

    // --- Profile, Lyrics & Modal Handling ---
    const handleAddNewProfileClick = () => {
        setModalInputValue('');
        setModalConfig({
            type: 'ADD_PROFILE',
            title: 'Create New Profile',
            submitText: 'Create',
        });
    };
    
    const handleEditLyricsClick = () => {
        setModalInputValue(lyrics);
        setModalConfig({
            type: 'EDIT_LYRICS',
            title: 'Add/Edit Lyrics',
            submitText: 'Save Lyrics',
        });
    };

    const handleModalClose = () => {
        setModalConfig(null);
        setModalInputValue('');
    };

    const handleModalSubmit = () => {
        if (!modalConfig) return;

        if (modalConfig.type === 'ADD_PROFILE') {
            const name = modalInputValue.trim();
            if (name && !profiles.find(p => p.name === name)) {
                const newProfile: Profile = { id: crypto.randomUUID(), name };
                const newProfiles = [...profiles, newProfile];
                setProfiles(newProfiles);
                setActiveProfileId(newProfile.id);
                setIsDirty(true);
            } else if (name) {
                alert("A profile with this name already exists.");
            }
        } else if (modalConfig.type === 'EDIT_LYRICS') {
            if (lyrics !== modalInputValue) {
                setLyrics(modalInputValue);
                setMerSuggestions([]); // Clear old suggestions as context has changed
            }
        }
        handleModalClose();
    };

    const handleRefineProfile = async () => {
        if (!activeProfileId || trainingDataCount < MIN_TRAINING_SAMPLES) return;

        setTrainingStatus('training');
        const trainingData = trainingService.loadTrainingDataForProfile(activeProfileId);
        const model = mlService.createModel();
        
        await mlService.trainModel(model, trainingData);
        await mlService.saveModel(model, activeProfileId);
        
        setPersonalModel(model);
        setTrainingStatus('done');
        setTimeout(() => setTrainingStatus('idle'), 2000);
    };


    // --- Autosave & Shortcuts ---
    useEffect(() => {
        try {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const gainNode = context.createGain();
          gainNode.connect(context.destination);
          gainNodeRef.current = gainNode;
          setAudioContext(context);
        } catch(e) {
          alert('Web Audio API is not supported in this browser.');
        }
    }, []);

    useEffect(() => {
        const savedStateJSON = localStorage.getItem(AUTOSAVE_KEY);
        if (savedStateJSON) {
            const savedState: AppState = JSON.parse(savedStateJSON);
            
            if (savedState.profiles && savedState.profiles.length > 0) {
                setProfiles(savedState.profiles);
                 setActiveProfileId(savedState.activeProfileId || savedState.profiles[0].id);
            }

            const handleInteraction = () => {
                if(trackInfo && savedState.currentTrackLocalId === trackInfo.localId) {
                    setMarkers(savedState.markers.filter(m => m.trackLocalId === trackInfo.localId));
                }
                 window.removeEventListener('click', handleInteraction);
                 window.removeEventListener('keydown', handleInteraction);
            }
            // Autosave only applies to the same track
            if (trackInfo && savedState.currentTrackLocalId === trackInfo.localId) {
                // Restore logic moved to an interaction handler to comply with browser autoplay policies
                window.addEventListener('click', handleInteraction, { once: true });
                window.addEventListener('keydown', handleInteraction, { once: true });
            }
        }
    }, [trackInfo]);


    useEffect(() => {
        if (!isDirty) return;
        const handler = setTimeout(() => {
            if(trackInfo && markers) {
                const stateToSave: AppState = {
                    currentTrackLocalId: trackInfo.localId,
                    trackMetadata: { [trackInfo.localId]: { name: trackInfo.name, title: trackInfo.title, artist: trackInfo.artist, duration_s: trackInfo.duration_s } },
                    markers: markers,
                    profiles: profiles,
                    activeProfileId: activeProfileId,
                };
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(stateToSave));
                setIsDirty(false);
            }
        }, 1000);
        return () => clearTimeout(handler);
    }, [isDirty, markers, trackInfo, profiles, activeProfileId]);

    const handleKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
        if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/) || !!modalConfig) return;
        
        switch(e.code) {
            case 'Space': e.preventDefault(); togglePlayPause(); break;
            case 'KeyM': e.preventDefault(); handleMarkerCreationToggle(); break;
            case 'Escape': e.preventDefault(); if (pendingMarkerStart !== null) setPendingMarkerStart(null); break;
            case 'Delete':
            case 'Backspace': 
                e.preventDefault(); 
                if(selectedMarkerId) deleteMarker(selectedMarkerId); 
                break;
            case 'ArrowRight': e.preventDefault(); handleScrub(currentTime + (e.shiftKey ? 1 : 5)); break;
            case 'ArrowLeft': e.preventDefault(); handleScrub(currentTime - (e.shiftKey ? 1 : 5)); break;
        }
    }, [togglePlayPause, handleMarkerCreationToggle, selectedMarkerId, deleteMarker, handleScrub, currentTime, pendingMarkerStart, modalConfig]);
    
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
        e.target.value = '';
    };

    const selectedMarker = markers.find(m => m.id === selectedMarkerId) || null;
    
    const refineButtonText = trainingStatus === 'training' ? 'Training...' : trainingStatus === 'done' ? 'Done!' : 'Refine Profile';

    return (
        <div className="h-screen w-screen bg-gray-900 flex flex-col font-sans">
            <header className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded transition-colors">Load Audio</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".mp3,.wav,.flac" className="hidden" />
                    <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
                        <UserIcon />
                        <select
                            value={activeProfileId || ''}
                            onChange={e => setActiveProfileId(e.target.value)}
                            className="bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button onClick={handleAddNewProfileClick} className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600" title="Add new profile">
                            <PlusIcon />
                        </button>
                         <div className="text-xs text-gray-400 ml-2 tabular-nums flex items-center gap-3" title="Number of annotations collected for training the personal AI model.">
                            <span>{trainingDataCount} training points</span>
                            {trainingDataCount >= MIN_TRAINING_SAMPLES && (
                                <button
                                    onClick={handleRefineProfile}
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
                            <button onClick={handleEditLyricsClick} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white" title="Add/Edit Lyrics">
                                <LyricsIcon />
                            </button>
                        )}
                        {trackInfo && (
                            <button
                                onClick={handleAnalyzeEmotions}
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
                         <button onClick={togglePlayPause} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button 
                            onClick={handleMarkerCreationToggle} 
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
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                title={`Volume: ${Math.round(volume*100)}%`}
                            />
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Zoom:</span>
                     <button onClick={() => setZoom(z => Math.min(z * 1.5, 500))} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"><ZoomInIcon /></button>
                     <button onClick={() => setZoom(z => Math.max(z / 1.5, 5))} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"><ZoomOutIcon /></button>
                </div>
            </header>

            <main className="flex flex-grow overflow-hidden">
                <div className="flex flex-col flex-grow min-w-0">
                    <div className="p-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
                        <div className="flex justify-end">
                            <button 
                                onClick={() => setShowSettings(!showSettings)} 
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
                                        onChange={(e) => setWaveformDetail(parseInt(e.target.value, 10))}
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
                                        onChange={e => setColorPalette(e.target.value as ColorPalette)}
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
                                onScrub={handleScrub}
                                onMarkerSelect={handleSelectMarkerAndSeek}
                                onMarkerMove={handleMarkerMove}
                                onSuggestionClick={handleSuggestionClick}
                                onZoom={(dir) => setZoom(z => dir === 'in' ? Math.min(z * 1.5, 500) : Math.max(z / 1.5, 5))}
                            />
                        ) : (
                            !isProcessing && <div className="w-full h-full flex justify-center items-center text-gray-500">Please load an audio file to begin.</div>
                        )}
                    </div>
                     {warnings.length > 0 && (
                        <div className="p-2 bg-yellow-900 bg-opacity-50 border-t border-b border-yellow-700 text-yellow-300 text-xs flex-shrink-0">
                           <div className="flex justify-between items-center">
                                <span>Import Warnings:</span>
                                <button onClick={() => setWarnings([])} className="font-bold">✕</button>
                           </div>
                           <ul className="list-disc list-inside mt-1 max-h-24 overflow-y-auto">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                        </div>
                    )}
                    <MarkerList
                        markers={markers}
                        selectedMarkerId={selectedMarkerId}
                        onSelectMarker={handleSelectMarkerAndSeek}
                        onDeleteMarker={deleteMarker}
                    />
                </div>
                
                <LabelPanel selectedMarker={selectedMarker} onUpdateMarker={updateMarker} onDeleteMarker={deleteMarker}/>
            </main>

            <footer className="flex items-center justify-between p-2 bg-gray-800 border-t border-gray-700 flex-shrink-0">
                <span className={`text-sm text-gray-500 transition-opacity duration-500 ${isDirty ? 'opacity-100' : 'opacity-0'}`}>Saving changes...</span>
                <div className="flex items-center gap-4">
                    <button onClick={() => importInputRef.current?.click()} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors">Import CSV</button>
                    <input type="file" ref={importInputRef} onChange={handleImport} accept=".csv,text/csv" className="hidden" />
                    <button onClick={handleExport} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors" disabled={markers.length === 0}>Export CSV</button>
                </div>
            </footer>
            
            {modalConfig && (
                <Modal onClose={handleModalClose}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="text-xl font-bold text-gray-100">{modalConfig.title}</h3>
                           <button onClick={handleModalClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                               <XIcon />
                           </button>
                        </div>
                        
                        {modalConfig.type === 'ADD_PROFILE' ? (
                            <input
                                type="text"
                                value={modalInputValue}
                                onChange={(e) => setModalInputValue(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter profile name..."
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()}
                            />
                        ) : (
                            <textarea
                                value={modalInputValue}
                                onChange={(e) => setModalInputValue(e.target.value)}
                                rows={15}
                                className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                placeholder="Paste lyrics here..."
                                autoFocus
                            />
                        )}
                    </div>
                    <div className="bg-gray-700 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                        <button onClick={handleModalClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleModalSubmit} className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded transition-colors">
                            {modalConfig.submitText}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default App;