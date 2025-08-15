import { useState, useRef, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { WaveformPoint } from '../types';

const generateAdvancedWaveformData = async (audioBuffer: AudioBuffer, targetPoints: number = 2000): Promise<WaveformPoint[]> => {
    return new Promise(resolve => {
        setTimeout(async () => {
            const rawData = audioBuffer.getChannelData(0);
            const totalSamples = rawData.length;
            const sampleRate = audioBuffer.sampleRate;

            const fftSize = 2048;
            const hopLength = 512;
            const numFrames = Math.floor((totalSamples - fftSize) / hopLength) + 1;

            const waveformData: WaveformPoint[] = [];

            await tf.tidy(() => {
                const audioTensor = tf.tensor1d(rawData);
                const stft = tf.signal.stft(audioTensor, fftSize, hopLength);
                const mags = tf.abs(stft);

                // Calculate Spectral Centroid
                const freqs = tf.linspace(0, sampleRate / 2, mags.shape[1]);
                const weightedFreqs = mags.mul(freqs);
                const sumWeightedFreqs = weightedFreqs.sum(1);
                const sumMags = mags.sum(1).add(1e-6); // add epsilon to avoid div by zero
                const centroids = sumWeightedFreqs.div(sumMags);
                const normalizedCentroids = centroids.div(sampleRate / 2);

                // Calculate Spectral Flux
                const magsPadded = tf.pad(mags, [[1, 0], [0, 0]]); // Pad start with zeros for first frame
                const magsDiff = mags.sub(magsPadded.slice([0, 0], [mags.shape[0], mags.shape[1]]));
                const flux = tf.sqrt(tf.sum(tf.square(tf.relu(magsDiff)), 1));
                
                // Get JS arrays from tensors
                const centroidsArray = Array.from(normalizedCentroids.dataSync());
                const fluxArray = Array.from(flux.dataSync());
                
                // Normalize flux
                const maxFlux = Math.max(...fluxArray);
                const normalizedFluxArray = maxFlux > 0 ? fluxArray.map(f => f / maxFlux) : fluxArray;

                // Create waveform points, including amplitude
                for (let i = 0; i < numFrames; i++) {
                    const startIndex = i * hopLength;
                    const endIndex = startIndex + hopLength;
                    let peak = 0;
                    for (let j = startIndex; j < endIndex; j++) {
                        peak = Math.max(peak, Math.abs(rawData[j]));
                    }
                    waveformData.push({
                        amp: peak,
                        spectralCentroid: centroidsArray[i],
                        spectralFlux: normalizedFluxArray[i],
                    });
                }

                // Downsample to targetPoints if necessary
                if (waveformData.length > targetPoints) {
                    const finalWaveform: WaveformPoint[] = [];
                    const step = waveformData.length / targetPoints;
                    for (let i = 0; i < targetPoints; i++) {
                        const index = Math.floor(i * step);
                        finalWaveform.push(waveformData[index]);
                    }
                    resolve(finalWaveform);
                } else {
                    resolve(waveformData);
                }
            });
        }, 50);
    });
};


export const useAudioEngine = () => {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [waveform, setWaveform] = useState<WaveformPoint[] | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);

    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const playbackStartTimeRef = useRef(0);
    const playbackOffsetRef = useRef(0);

    const stopPlayback = useCallback((isManualStop = true) => {
        if (audioSourceRef.current) {
            if (isManualStop) {
                audioSourceRef.current.onended = null;
            }
            try {
                audioSourceRef.current.stop();
            } catch (e) {
                // Ignore errors from stopping an already stopped source
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
                stopPlayback(false); // Not a manual stop, let it fire
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

    const resetAudio = () => {
        if (isPlaying) stopPlayback();
        setAudioBuffer(null);
        setWaveform(null);
        setCurrentTime(0);
        playbackOffsetRef.current = 0;
    };
    
    const initializeAudio = async (decodedBuffer: AudioBuffer) => {
        resetAudio();
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        setAudioBuffer(decodedBuffer);
    };

    const generateWaveform = useCallback(async (buffer: AudioBuffer, detail: number) => {
        const advancedWaveform = await generateAdvancedWaveformData(buffer, detail);
        setWaveform(advancedWaveform);
    }, []);
    
    const scrub = useCallback((time: number) => {
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

    return {
        audioContext,
        audioBuffer,
        waveform,
        isPlaying,
        currentTime,
        volume,
        setVolume,
        initializeAudio,
        generateWaveform,
        resetAudio,
        scrub,
        togglePlayPause
    };
};