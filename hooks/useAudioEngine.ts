import { useState, useRef, useCallback, useEffect } from 'react';
import { WaveformPoint } from '../types';

const generateSpectralWaveformData = async (audioBuffer: AudioBuffer, targetPoints: number = 2000): Promise<WaveformPoint[]> => {
    return new Promise(resolve => {
        // This can be a lengthy process, so we run it in a timeout to allow the UI to update first.
        setTimeout(() => {
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
        const spectralWaveform = await generateSpectralWaveformData(buffer, detail);
        setWaveform(spectralWaveform);
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