import { useState, useRef, useCallback, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import { WaveformPoint } from "../types";

// Enhanced audio analysis utilities
const calculateTempo = (onsetTimes: number[], sampleRate: number): number => {
  if (onsetTimes.length < 2) return 120; // Default BPM

  const intervals = [];
  for (let i = 1; i < onsetTimes.length; i++) {
    intervals.push(onsetTimes[i] - onsetTimes[i - 1]);
  }

  // Find most common interval (mode)
  const intervalCounts = new Map<number, number>();
  intervals.forEach((interval) => {
    const rounded = Math.round(interval * 10) / 10; // Round to 0.1s precision
    intervalCounts.set(rounded, (intervalCounts.get(rounded) || 0) + 1);
  });

  let mostCommonInterval = 0.5; // Default to 120 BPM
  let maxCount = 0;
  intervalCounts.forEach((count, interval) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonInterval = interval;
    }
  });

  // Convert interval to BPM
  const bpm = 60 / mostCommonInterval;
  return Math.max(60, Math.min(200, bpm)); // Clamp to reasonable range
};

const calculateHarmonicRatio = (magnitudes: Float32Array): number => {
  if (magnitudes.length < 4) return 0.5;

  let harmonicEnergy = 0;
  let totalEnergy = 0;

  // Simple harmonic detection: look for peaks at harmonic frequencies
  for (let i = 1; i < magnitudes.length; i++) {
    const mag = magnitudes[i];
    totalEnergy += mag * mag;

    // Check if this frequency is likely harmonic (simplified)
    if (i % 2 === 0 || i % 3 === 0 || i % 5 === 0) {
      harmonicEnergy += mag * mag;
    }
  }

  return totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0.5;
};

const calculateDynamicRange = (amplitudes: number[]): number => {
  if (amplitudes.length === 0) return 0;

  const max = Math.max(...amplitudes);
  const min = Math.min(...amplitudes);
  return max > 0 ? (max - min) / max : 0;
};

const calculatePerceptualLoudness = (
  magnitudes: Float32Array,
  sampleRate: number
): number => {
  // Simplified A-weighting for perceptual loudness
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 1; i < magnitudes.length; i++) {
    const freq = (i * sampleRate) / (2 * magnitudes.length);

    // Simplified A-weighting curve (emphasizes mid frequencies)
    let weight = 1.0;
    if (freq < 1000) {
      weight = freq / 1000;
    } else if (freq > 4000) {
      weight = Math.max(0.1, 4000 / freq);
    }

    weightedSum += magnitudes[i] * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

const calculateSharpness = (magnitudes: Float32Array): number => {
  // Sharpness relates to high-frequency content
  let highFreqEnergy = 0;
  let totalEnergy = 0;

  const cutoff = Math.floor(magnitudes.length * 0.6); // Above 60% of Nyquist

  for (let i = 0; i < magnitudes.length; i++) {
    const energy = magnitudes[i] * magnitudes[i];
    totalEnergy += energy;

    if (i > cutoff) {
      highFreqEnergy += energy;
    }
  }

  return totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;
};

const calculateRoughness = (magnitudes: Float32Array): number => {
  // Roughness relates to rapid amplitude modulation and beating
  let roughnessSum = 0;

  for (let i = 1; i < magnitudes.length - 1; i++) {
    // Look for rapid changes in adjacent frequency bins
    const variation =
      Math.abs(magnitudes[i] - magnitudes[i - 1]) +
      Math.abs(magnitudes[i + 1] - magnitudes[i]);
    roughnessSum += variation;
  }

  return roughnessSum / (magnitudes.length - 2);
};

const generateAdvancedWaveformData = async (
  audioBuffer: AudioBuffer,
  targetPoints: number = 2000
): Promise<WaveformPoint[]> => {
  const rawData = audioBuffer.getChannelData(0);
  const totalSamples = rawData.length;
  const sampleRate = audioBuffer.sampleRate;
  const fftSize = 2048;
  const hopLength = 512;

  const CHUNK_DURATION_S = 10; // Process 10 seconds of audio at a time
  const samplesPerChunk = CHUNK_DURATION_S * sampleRate;
  const numChunks = Math.ceil(totalSamples / samplesPerChunk);

  let allCentroids: number[] = [];
  let allFluxes: number[] = [];
  let allAmplitudes: number[] = [];

  // Enhanced features arrays
  let allHarmonicRatios: number[] = [];
  let allDynamicRanges: number[] = [];
  let allLoudness: number[] = [];
  let allSharpness: number[] = [];
  let allRoughness: number[] = [];
  let allOnsetTimes: number[] = [];

  for (let i = 0; i < numChunks; i++) {
    const chunkStart = i * samplesPerChunk;
    const chunkEnd = Math.min(chunkStart + samplesPerChunk, totalSamples);
    const chunkData = rawData.slice(chunkStart, chunkEnd);

    // Yield to the main thread to keep UI responsive during long processing
    await new Promise((resolve) => setTimeout(resolve, 10));

    const tensorData = tf.tidy(() => {
      if (chunkData.length === 0) {
        return {
          centroidsArray: [],
          fluxArray: [],
          enhancedFeatures: {
            harmonicRatios: [],
            loudness: [],
            sharpness: [],
            roughness: [],
          },
        };
      }

      const audioTensor = tf.tensor1d(chunkData);
      const stft = tf.signal.stft(audioTensor, fftSize, hopLength);
      const mags = tf.abs(stft);

      const freqs = tf.linspace(0, sampleRate / 2, mags.shape[1]);
      const weightedFreqs = mags.mul(freqs);
      const sumWeightedFreqs = weightedFreqs.sum(1);
      const sumMags = mags.sum(1).add(1e-6);
      const centroids = sumWeightedFreqs.div(sumMags);
      const normalizedCentroids = centroids.div(sampleRate / 2);

      const magsPadded = tf.pad(mags, [
        [1, 0],
        [0, 0],
      ]);
      const magsSliced = magsPadded.slice(
        [0, 0],
        [mags.shape[0], mags.shape[1]]
      );
      const magsDiff = mags.sub(magsSliced);
      const flux = tf.sqrt(tf.sum(tf.square(tf.relu(magsDiff)), 1));

      // Calculate enhanced features for each frame
      const magsData = mags.arraySync() as number[][];
      const enhancedFeatures = {
        harmonicRatios: [] as number[],
        loudness: [] as number[],
        sharpness: [] as number[],
        roughness: [] as number[],
      };

      for (let frameIdx = 0; frameIdx < magsData.length; frameIdx++) {
        const frameMags = new Float32Array(magsData[frameIdx]);

        enhancedFeatures.harmonicRatios.push(calculateHarmonicRatio(frameMags));
        enhancedFeatures.loudness.push(
          calculatePerceptualLoudness(frameMags, sampleRate)
        );
        enhancedFeatures.sharpness.push(calculateSharpness(frameMags));
        enhancedFeatures.roughness.push(calculateRoughness(frameMags));
      }

      return {
        centroidsArray: Array.from(normalizedCentroids.dataSync()),
        fluxArray: Array.from(flux.dataSync()),
        enhancedFeatures,
      };
    });

    allCentroids.push(...tensorData.centroidsArray);
    allFluxes.push(...tensorData.fluxArray);

    // Store enhanced features
    allHarmonicRatios.push(...tensorData.enhancedFeatures.harmonicRatios);
    allLoudness.push(...tensorData.enhancedFeatures.loudness);
    allSharpness.push(...tensorData.enhancedFeatures.sharpness);
    allRoughness.push(...tensorData.enhancedFeatures.roughness);

    // Calculate amplitude and detect onsets separately on the JS thread
    const numFramesInChunk = tensorData.centroidsArray.length;
    const chunkAmplitudes: number[] = [];

    for (let j = 0; j < numFramesInChunk; j++) {
      const startIndex = j * hopLength;
      const endIndex = startIndex + hopLength;
      let peak = 0;
      for (let k = startIndex; k < endIndex && k < chunkData.length; k++) {
        peak = Math.max(peak, Math.abs(chunkData[k]));
      }
      chunkAmplitudes.push(peak);
      allAmplitudes.push(peak);

      // Simple onset detection: look for amplitude peaks
      if (j > 0 && peak > chunkAmplitudes[j - 1] * 1.5 && peak > 0.1) {
        const timeInSeconds = (i * samplesPerChunk + startIndex) / sampleRate;
        allOnsetTimes.push(timeInSeconds);
      }
    }

    // Calculate dynamic range for this chunk
    const chunkDynamicRange = calculateDynamicRange(chunkAmplitudes);
    for (let j = 0; j < numFramesInChunk; j++) {
      allDynamicRanges.push(chunkDynamicRange);
    }
  }

  // Post-process the combined results from all chunks
  const maxFlux = Math.max(...allFluxes, 0);
  const normalizedFluxArray =
    maxFlux > 0 ? allFluxes.map((f) => f / maxFlux) : allFluxes;

  // Calculate global tempo from all onsets
  const globalTempo = calculateTempo(allOnsetTimes, sampleRate);

  // Normalize enhanced features
  const maxLoudness = Math.max(...allLoudness, 1e-6);
  const maxSharpness = Math.max(...allSharpness, 1e-6);
  const maxRoughness = Math.max(...allRoughness, 1e-6);

  const normalizedLoudness = allLoudness.map((l) => l / maxLoudness);
  const normalizedSharpness = allSharpness.map((s) => s / maxSharpness);
  const normalizedRoughness = allRoughness.map((r) => r / maxRoughness);

  const finalWaveform: WaveformPoint[] = [];
  for (let i = 0; i < allCentroids.length; i++) {
    // Calculate rhythmic complexity based on local onset density
    const timeWindow = 2.0; // 2-second window
    const currentTime = (i / allCentroids.length) * (totalSamples / sampleRate);
    const nearbyOnsets = allOnsetTimes.filter(
      (t) => Math.abs(t - currentTime) <= timeWindow
    );
    const rhythmicComplexity = Math.min(1.0, nearbyOnsets.length / 8); // Normalize to 0-1

    finalWaveform.push({
      amp: allAmplitudes[i] || 0,
      spectralCentroid: allCentroids[i] || 0,
      spectralFlux: normalizedFluxArray[i] || 0,

      // Enhanced features
      tempoBpm: globalTempo,
      harmonicRatio: allHarmonicRatios[i] || 0.5,
      dynamicRange: allDynamicRanges[i] || 0,
      rhythmicComplexity: rhythmicComplexity,
      loudness: normalizedLoudness[i] || 0,
      sharpness: normalizedSharpness[i] || 0,
      roughness: normalizedRoughness[i] || 0,
    });
  }

  // Downsample to the target number of points for visualization
  if (finalWaveform.length > targetPoints) {
    const downsampled: WaveformPoint[] = [];
    const step = finalWaveform.length / targetPoints;
    for (let i = 0; i < targetPoints; i++) {
      const index = Math.floor(i * step);
      downsampled.push(finalWaveform[index]);
    }
    return downsampled;
  }

  return finalWaveform;
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

  const startPlayback = useCallback(
    (startTime: number) => {
      if (
        !audioContext ||
        !audioBuffer ||
        !gainNodeRef.current ||
        audioSourceRef.current
      )
        return;

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current);

      const offset = Math.max(
        0,
        startTime >= audioBuffer.duration ? 0 : startTime
      );
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
    },
    [audioContext, audioBuffer, stopPlayback]
  );

  const updateTime = useCallback(() => {
    if (!isPlaying || !audioContext) return;
    const newTime =
      playbackOffsetRef.current +
      (audioContext.currentTime - playbackStartTimeRef.current);
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
      const context = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const gainNode = context.createGain();
      gainNode.connect(context.destination);
      gainNodeRef.current = gainNode;
      setAudioContext(context);
    } catch (e) {
      alert("Web Audio API is not supported in this browser.");
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
    if (audioContext && audioContext.state === "suspended") {
      await audioContext.resume();
    }
    setAudioBuffer(decodedBuffer);
  };

  const generateWaveform = useCallback(
    async (buffer: AudioBuffer, detail: number) => {
      const advancedWaveform = await generateAdvancedWaveformData(
        buffer,
        detail
      );
      setWaveform(advancedWaveform);
    },
    []
  );

  const scrub = useCallback(
    (time: number) => {
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
    },
    [audioBuffer, isPlaying, startPlayback, stopPlayback]
  );

  const togglePlayPause = useCallback(() => {
    if (!audioContext || !audioBuffer) return;
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    if (isPlaying) {
      stopPlayback();
    } else {
      const time = currentTime >= audioBuffer.duration ? 0 : currentTime;
      startPlayback(time);
    }
  }, [
    audioContext,
    audioBuffer,
    isPlaying,
    startPlayback,
    stopPlayback,
    currentTime,
  ]);

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
    togglePlayPause,
  };
};
