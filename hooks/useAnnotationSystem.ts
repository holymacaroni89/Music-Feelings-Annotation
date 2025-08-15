import { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Marker, AppState, TrackInfo, MerSuggestion, TrainingSample, Profile, GEMS, Trigger } from '../types';
import { AUTOSAVE_KEY, MARKER_DEFAULT_DURATION_S, GEMS_OPTIONS, TRIGGER_OPTIONS } from '../constants';
import * as trainingService from '../services/trainingService';
import * as mlService from '../services/mlService';
import * as geminiService from '../services/geminiService';

const MIN_TRAINING_SAMPLES = 10;

interface ModalConfig {
    type: 'ADD_PROFILE' | 'EDIT_LYRICS';
    title: string;
    submitText: string;
}

export const useAnnotationSystem = (trackInfo: TrackInfo | null) => {
    const [markers, setMarkers] = useState<Marker[]>([]);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [pendingMarkerStart, setPendingMarkerStart] = useState<number | null>(null);
    const [merSuggestions, setMerSuggestions] = useState<MerSuggestion[]>([]);
    const [lyrics, setLyrics] = useState('');

    // Profile & AI State
    const [profiles, setProfiles] = useState<Profile[]>([{ id: 'default', name: 'Default Profile' }]);
    const [activeProfileId, setActiveProfileId] = useState<string>('default');
    const [trainingDataCount, setTrainingDataCount] = useState(0);
    const [personalModel, setPersonalModel] = useState<tf.LayersModel | null>(null);
    const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'done'>('idle');

    // UI State
    const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
    const [modalInputValue, setModalInputValue] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    // --- Autosave & Initialization ---
    useEffect(() => {
        const savedStateJSON = localStorage.getItem(AUTOSAVE_KEY);
        if (savedStateJSON) {
            const savedState: AppState = JSON.parse(savedStateJSON);
            if (savedState.profiles && savedState.profiles.length > 0) {
                setProfiles(savedState.profiles);
                setActiveProfileId(savedState.activeProfileId || savedState.profiles[0].id);
            }
        }
    }, []);

    useEffect(() => {
        if (trackInfo) {
            const savedStateJSON = localStorage.getItem(AUTOSAVE_KEY);
            if (savedStateJSON) {
                const savedState: AppState = JSON.parse(savedStateJSON);
                if (savedState.currentTrackLocalId === trackInfo.localId) {
                    setMarkers(savedState.markers);
                } else {
                    // New track, reset everything
                    setMarkers([]);
                    setLyrics('');
                    setMerSuggestions([]);
                }
            }
        } else {
            setMarkers([]);
            setLyrics('');
            setMerSuggestions([]);
        }
    }, [trackInfo]);

    useEffect(() => {
        if (!isDirty) return;
        const handler = setTimeout(() => {
            if(trackInfo) {
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


    // --- AI & Training Data ---
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
            input: { valence: aiPrediction.valence, arousal: aiPrediction.arousal },
            output: { valence: userMarkerData.valence, arousal: userMarkerData.arousal },
        };
        trainingService.addTrainingSample(activeProfileId, newSample);
        setTrainingDataCount(prev => prev + 1);
    }, [activeProfileId, findClosestSuggestion]);

    useEffect(() => {
        if (activeProfileId) {
            const count = trainingService.getTrainingDataCountForProfile(activeProfileId);
            setTrainingDataCount(count);
            mlService.loadModel(activeProfileId).then(setPersonalModel);
        }
    }, [activeProfileId]);
    
    const analyzeEmotions = async (waveform: any, duration: number) => {
        const baseSuggestions = await geminiService.generateMerSuggestions(waveform, duration, lyrics);
        if (personalModel) {
            const refinedSuggestions = mlService.predict(personalModel, baseSuggestions);
            setMerSuggestions(refinedSuggestions);
        } else {
            setMerSuggestions(baseSuggestions);
        }
    };
    
    const refineProfile = async () => {
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

    // --- Marker Management ---
    const updateMarker = (updatedMarker: Marker) => {
        setMarkers(prev => prev.map(m => m.id === updatedMarker.id ? updatedMarker : m).sort((a,b) => a.t_start_s - b.t_start_s));
        setIsDirty(true);
        captureTrainingSample({ valence: updatedMarker.valence, arousal: updatedMarker.arousal }, updatedMarker.t_start_s);
    };

    const deleteMarker = (markerId: string) => {
        setMarkers(prev => prev.filter(m => m.id !== markerId));
        if (selectedMarkerId === markerId) {
            setSelectedMarkerId(null);
        }
        setIsDirty(true);
    };

    const handleMarkerCreationToggle = (currentTime: number) => {
        if (!trackInfo) return;

        if (pendingMarkerStart !== null) {
            const t_start_s = Math.min(pendingMarkerStart, currentTime);
            const t_end_s = Math.min(trackInfo.duration_s, Math.max(pendingMarkerStart, currentTime, t_start_s + MARKER_DEFAULT_DURATION_S));

            const newMarker: Marker = {
                id: crypto.randomUUID(),
                trackLocalId: trackInfo.localId,
                title: trackInfo.title,
                artist: trackInfo.artist,
                duration_s: trackInfo.duration_s,
                t_start_s,
                t_end_s,
                valence: 0,
                arousal: 0.5,
                intensity: 50,
                confidence: 0.75,
                gems: '',
                trigger: [],
                imagery: '', sync_notes: '',
            };
            const newMarkers = [...markers, newMarker].sort((a,b) => a.t_start_s - b.t_start_s);
            setMarkers(newMarkers);
            setSelectedMarkerId(newMarker.id);
            setPendingMarkerStart(null);
            setIsDirty(true);
            captureTrainingSample({ valence: newMarker.valence, arousal: newMarker.arousal }, newMarker.t_start_s);
        } else {
            setPendingMarkerStart(currentTime);
            setSelectedMarkerId(null);
        }
    };
    
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

    // --- Modal & Profile Management ---
    const openModal = (type: 'ADD_PROFILE' | 'EDIT_LYRICS') => {
        if (type === 'ADD_PROFILE') {
            setModalInputValue('');
            setModalConfig({ type, title: 'Create New Profile', submitText: 'Create' });
        } else if (type === 'EDIT_LYRICS') {
            setModalInputValue(lyrics);
            setModalConfig({ type, title: 'Add/Edit Lyrics', submitText: 'Save Lyrics' });
        }
    };
    
    const handleModalSubmit = () => {
        if (!modalConfig) return;

        if (modalConfig.type === 'ADD_PROFILE') {
            const name = modalInputValue.trim();
            if (name && !profiles.find(p => p.name === name)) {
                const newProfile: Profile = { id: crypto.randomUUID(), name };
                setProfiles(p => [...p, newProfile]);
                setActiveProfileId(newProfile.id);
                setIsDirty(true);
            }
        } else if (modalConfig.type === 'EDIT_LYRICS') {
            if (lyrics !== modalInputValue) {
                setLyrics(modalInputValue);
                setMerSuggestions([]);
            }
        }
        setModalConfig(null);
    };
    
    return {
        // State
        markers, setMarkers,
        selectedMarkerId, setSelectedMarkerId,
        pendingMarkerStart, setPendingMarkerStart,
        merSuggestions,
        lyrics, setLyrics,
        profiles,
        activeProfileId, setActiveProfileId,
        trainingDataCount,
        personalModel,
        trainingStatus,
        modalConfig, setModalConfig,
        modalInputValue, setModalInputValue,
        isDirty, setIsDirty,
        // Functions
        updateMarker,
        deleteMarker,
        handleMarkerCreationToggle,
        handleSuggestionClick,
        analyzeEmotions,
        refineProfile,
        openModal,
        handleModalSubmit,
        MIN_TRAINING_SAMPLES,
    };
};
