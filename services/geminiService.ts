import { GoogleGenAI, Type } from "@google/genai";
import { WaveformPoint, MerSuggestion } from '../types';

// This assumes process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// This function summarizes the detailed waveform data into a more compact text format
// that is suitable for the LLM's context window.
const summarizeWaveform = (waveform: WaveformPoint[], duration: number, points: number = 100): string => {
    const summary: string[] = [];
    const pointsPerChunk = Math.ceil(waveform.length / points);
    
    for (let i = 0; i < points; i++) {
        const start = i * pointsPerChunk;
        const end = start + pointsPerChunk;
        const chunk = waveform.slice(start, end);
        
        if (chunk.length === 0) continue;
        
        const time = (i / points) * duration;
        
        const avgAmp = chunk.reduce((sum, p) => sum + p.amp, 0) / chunk.length;
        const maxAmp = chunk.reduce((max, p) => Math.max(max, p.amp), 0);
        const avgColor = chunk.reduce((sum, p) => sum + p.colorValue, 0) / chunk.length; // avg brightness
        
        summary.push(
          `t:${time.toFixed(1)}s, amp_avg:${avgAmp.toFixed(3)}, amp_max:${maxAmp.toFixed(3)}, brightness:${avgColor.toFixed(3)}`
        );
    }
    
    return summary.join('; ');
};

const suggestionSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            description: "List of identified emotionally significant moments.",
            items: {
                type: Type.OBJECT,
                properties: {
                    time: {
                        type: Type.NUMBER,
                        description: "The timestamp of the event in seconds."
                    },
                    valence: {
                        type: Type.NUMBER,
                        description: "The emotional valence (-1 for negative, +1 for positive)."
                    },
                    arousal: {
                        type: Type.NUMBER,
                        description: "The emotional arousal or energy (0 for calm, 1 for intense)."
                    },
                    intensity: {
                        type: Type.NUMBER,
                        description: "The perceived emotional impact or 'punchiness' of the moment, from 0 to 100."
                    },
                    confidence: {
                        type: Type.NUMBER,
                        description: "The AI's confidence in this suggestion's significance, from 0.0 to 1.0."
                    },
                    reason: {
                        type: Type.STRING,
                        description: "A very brief justification for why this moment was chosen (e.g., 'Sudden drop in brightness', 'Sustained high energy')."
                    }
                },
                 required: ["time", "valence", "arousal", "intensity", "confidence", "reason"],
            }
        }
    },
    required: ["suggestions"],
};

export const generateMerSuggestions = async (waveform: WaveformPoint[], duration: number): Promise<MerSuggestion[]> => {
    const summarizedData = summarizeWaveform(waveform, duration);
    
    const systemInstruction = `You are an expert in Music Information Retrieval (MIR) and Music Emotion Recognition (MER). Your task is to analyze summarized audio waveform data and identify the most emotionally significant moments in a piece of music.
The input data is a semicolon-separated list of summaries. Each summary represents a point in time and contains:
- t: The timestamp in seconds.
- amp_avg: The average amplitude (volume) around that time.
- amp_max: The maximum amplitude (volume) around that time.
- brightness: A value from 0.0 (deep, bassy sounds) to 1.0 (bright, high-frequency sounds).

Your goal is to identify 5 to 15 key moments that represent significant emotional shifts, peaks, or transitions. Focus on:
- Sudden changes in amplitude (drops or spikes).
- Transitions between high and low brightness.
- Sections of sustained high or low energy (amplitude and brightness).
- The beginning and end of major sections as suggested by the data.

For each moment you identify, provide:
- time: The timestamp in seconds.
- valence: An estimated valence (-1 to +1).
- arousal: An estimated arousal (0 to 1).
- intensity: An integer from 0 to 100 for the perceived emotional impact. This is different from arousal; a quiet, tense moment can have low arousal but high intensity.
- confidence: A float from 0.0 to 1.0 indicating your confidence that this moment is emotionally significant.
- reason: A very brief justification for your choice.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Here is the summarized audio data for a track that is ${duration.toFixed(0)} seconds long. Please identify the key emotional moments.\n\nDATA: ${summarizedData}`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: suggestionSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result && Array.isArray(result.suggestions)) {
            // Validate and format the suggestions
            return result.suggestions
                .map((s: any) => ({
                    time: s.time,
                    valence: Math.max(-1, Math.min(1, s.valence)),
                    arousal: Math.max(0, Math.min(1, s.arousal)),
                    intensity: Math.round(Math.max(0, Math.min(100, s.intensity || 0))),
                    confidence: Math.max(0, Math.min(1, s.confidence || 0)),
                    reason: s.reason || 'No reason provided.',
                }))
                .filter((s: MerSuggestion) => s.time <= duration && s.time >= 0);
        }
        
        return [];
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Fallback or re-throw
        throw new Error("Failed to get analysis from AI model.");
    }
};