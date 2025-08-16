import { GoogleGenAI, Type } from "@google/genai";
import { WaveformPoint, MerSuggestion, GEMS, Trigger } from '../types';

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
        
        const maxAmp = chunk.reduce((max, p) => Math.max(max, p.amp), 0);
        const avgCentroid = chunk.reduce((sum, p) => sum + p.spectralCentroid, 0) / chunk.length;
        const maxFlux = chunk.reduce((max, p) => Math.max(max, p.spectralFlux), 0);
        
        summary.push(
          `t:${time.toFixed(1)}s, amp:${maxAmp.toFixed(3)}, centroid:${avgCentroid.toFixed(3)}, flux:${maxFlux.toFixed(3)}`
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
                        description: "A very brief justification for why this moment was chosen, based on audio features (e.g., 'Sudden peak in spectral flux', 'Sustained low centroid')."
                    },
                    gems: {
                        type: Type.STRING,
                        description: `The most likely GEMS category. Must be one of: ${Object.values(GEMS).join(', ')}.`
                    },
                    trigger: {
                        type: Type.ARRAY,
                        description: `The most likely musical triggers. Must be a subset of: ${Object.values(Trigger).join(', ')}.`,
                        items: { type: Type.STRING }
                    },
                    sync_notes: {
                        type: Type.STRING,
                        description: "Brief, objective notes on the specific musical event (e.g., 'Vocal entry', 'Beat drop'). MUST be grounded in song structure or lyrics if available."
                    },
                    imagery: {
                        type: Type.STRING,
                        description: "A description of evoked imagery. MUST be directly inspired by and grounded in the specific lyrics or user annotations for this moment."
                    }
                },
                 required: ["time", "valence", "arousal", "intensity", "confidence", "reason", "gems", "trigger", "sync_notes", "imagery"],
            }
        }
    },
    required: ["suggestions"],
};

export const generateMerSuggestions = async (waveform: WaveformPoint[], duration: number, songContext?: string): Promise<MerSuggestion[]> => {
    const summarizedData = summarizeWaveform(waveform, duration);
    
    const systemInstructionWithContext = `You are an expert in Music Information Retrieval (MIR) and Music Emotion Recognition (MER). Your primary task is to create a tight synthesis between summarized audio waveform data and rich lyrical/annotative context to identify emotionally significant moments in a song.

The audio data is a semicolon-separated list of summaries. Each summary contains:
- t: The timestamp in seconds.
- amp: The maximum amplitude (volume) in that time slice.
- centroid: The spectral centroid (0.0 for deep, bassy sounds; 1.0 for bright, high-frequency sounds).
- flux: The spectral flux (0.0 for stable timbre; 1.0 for rapid timbral change). A high flux indicates a sudden sonic event.

You are also provided with rich song context (metadata, lyrics, annotations). Your analysis MUST deeply integrate this context. Identify 5 to 15 key moments representing significant emotional shifts.

For each moment, provide a full annotation with the following STRICT rules:
1.  time: The timestamp in seconds.
2.  valence: Estimated valence (-1 to +1).
3.  arousal: Estimated arousal (0 to 1).
4.  intensity: Perceived emotional impact (0-100). Differentiated from arousal (e.g., quiet tension can be high intensity).
5.  confidence: Your confidence (0.0 to 1.0) that this moment is emotionally significant based on BOTH audio and context.
6.  reason: A very brief justification based on an audio feature (e.g., "Peak in spectral flux", "Shift to low centroid").
7.  gems: The most likely GEMS category. Must be one of: ${Object.values(GEMS).join(', ')}.
8.  trigger: An array of likely musical triggers. Must be a subset of: ${Object.values(Trigger).join(', ')}.
9.  sync_notes: MUST be objective and directly reference the song structure or text at this timestamp. Examples: "Chorus begins", "Bridge starts with 'Now the night...'", "Vocal harmony enters".
10. imagery: MUST be directly inspired by and grounded in the specific lyrics or user annotations at this moment. You should explicitly reference the lyrical content that justifies your imagery. Example: "A sense of quiet hope, reflecting the 'sunrise' metaphor in the lyrics."

Your goal is to produce annotations where the audio analysis and the lyrical context are inextricably linked.`;

    const systemInstructionWithoutContext = `You are an expert in Music Information Retrieval (MIR) and Music Emotion Recognition (MER). Your task is to analyze summarized audio waveform data and identify the most emotionally significant moments in a piece of music, providing a comprehensive annotation for each.

The audio data is a semicolon-separated list of summaries. Each summary contains:
- t: The timestamp in seconds.
- amp: The maximum amplitude (volume) in that time slice.
- centroid: The spectral centroid (0.0 for deep, bassy sounds; 1.0 for bright, high-frequency sounds). This indicates the sound's "brightness".
- flux: The spectral flux (0.0 for stable timbre; 1.0 for rapid timbral change). A high flux indicates a sudden sonic event like a new instrument or a beat drop.

Your goal is to identify 5 to 15 key moments that represent significant emotional shifts, peaks, or transitions.

For each moment you identify, provide a full annotation:
- time: The timestamp in seconds.
- valence: Estimated valence (-1 to +1).
- arousal: Estimated arousal (0 to 1).
- intensity: Integer from 0 to 100 for perceived emotional impact.
- confidence: Float from 0.0 to 1.0 indicating your confidence that this moment is emotionally significant.
- reason: A very brief justification for your choice based on audio features (e.g., "Peak in spectral flux", "Shift to low centroid").
- gems: The most likely GEMS category. Must be one of: ${Object.values(GEMS).join(', ')}.
- trigger: An array of the most likely musical triggers. Must be a subset of: ${Object.values(Trigger).join(', ')}.
- sync_notes: Brief, objective notes on the specific musical event at this exact timestamp (e.g., 'Vocal entry', 'Beat drop', 'Guitar solo starts').
- imagery: A brief description of any images or feelings evoked by the sound at this moment.`;

    const systemInstruction = songContext ? systemInstructionWithContext : systemInstructionWithoutContext;
    
    let promptContent = `Here is the summarized audio data for a track that is ${duration.toFixed(0)} seconds long. Please identify the key emotional moments and provide full annotations.\n\nAUDIO DATA: ${summarizedData}`;
    
    if (songContext) {
        promptContent = `Analyze the following song based on its audio data and the provided context. The track is ${duration.toFixed(0)} seconds long. Identify key emotional moments and provide full annotations.\n\n--- SONG CONTEXT ---\n${songContext}\n\n--- AUDIO DATA ---\n${summarizedData}`;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptContent,
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
                .map((s: any) => {
                    const parsedGems = Object.values(GEMS).includes(s.gems as GEMS) ? (s.gems as GEMS) : '';
                    const parsedTriggers = Array.isArray(s.trigger) 
                        ? s.trigger.filter((t: any) => typeof t === 'string' && Object.values(Trigger).includes(t as Trigger)) as Trigger[]
                        : [];

                    return {
                        time: s.time,
                        valence: Math.max(-1, Math.min(1, s.valence)),
                        arousal: Math.max(0, Math.min(1, s.arousal)),
                        intensity: Math.round(Math.max(0, Math.min(100, s.intensity || 0))),
                        confidence: Math.max(0, Math.min(1, s.confidence || 0)),
                        reason: s.reason || 'No reason provided.',
                        gems: parsedGems,
                        trigger: parsedTriggers,
                        sync_notes: s.sync_notes || '',
                        imagery: s.imagery || '',
                    };
                })
                .filter((s: MerSuggestion) => s.time <= duration && s.time >= 0);
        }
        
        return [];
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Fallback or re-throw
        throw new Error("Failed to get analysis from AI model.");
    }
};
