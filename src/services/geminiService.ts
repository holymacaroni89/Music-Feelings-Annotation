import { GoogleGenAI, Type } from "@google/genai";
import {
  WaveformPoint,
  MerSuggestion,
  GEMS,
  Trigger,
  AudioAnalysisResult,
} from "../types";

// Cache für Audio-Analyse-Ergebnisse
const audioAnalysisCache = new Map<string, AudioAnalysisResult>();

// Hash-Funktion für Waveform-Daten
const generateWaveformHash = (waveform: WaveformPoint[]): string => {
  const data = waveform
    .map(
      (p) =>
        `${p.amp.toFixed(3)}${p.spectralCentroid.toFixed(
          3
        )}${p.spectralFlux.toFixed(3)}`
    )
    .join("");
  return btoa(data).slice(0, 16); // Kurzer Hash für Performance
};

// Hash-Funktion für Song-Context
const generateContextHash = (context: string): string => {
  return btoa(context).slice(0, 16);
};

// Cache-Funktionen
export const getCachedAnalysis = (
  trackId: string,
  waveform: WaveformPoint[],
  songContext?: string
): AudioAnalysisResult | null => {
  const cached = audioAnalysisCache.get(trackId);
  if (!cached) return null;

  const currentWaveformHash = generateWaveformHash(waveform);
  const currentContextHash = songContext
    ? generateContextHash(songContext)
    : "";

  // Prüfe ob sich Waveform oder Context geändert haben
  if (
    cached.waveformHash !== currentWaveformHash ||
    cached.songContextHash !== currentContextHash
  ) {
    return null; // Cache ist veraltet
  }

  return cached;
};

export const cacheAnalysisResult = (
  trackId: string,
  waveform: WaveformPoint[],
  songContext: string,
  suggestions: MerSuggestion[]
): void => {
  const result: AudioAnalysisResult = {
    trackId,
    timestamp: Date.now(),
    suggestions,
    waveformHash: generateWaveformHash(waveform),
    songContextHash: generateContextHash(songContext),
    analysisVersion: "1.0",
  };

  audioAnalysisCache.set(trackId, result);
};

export const clearAnalysisCache = (trackId?: string): void => {
  if (trackId) {
    audioAnalysisCache.delete(trackId);
  } else {
    audioAnalysisCache.clear();
  }
};

// This function summarizes the detailed waveform data into a more compact text format
// that is suitable for the LLM's context window.
const summarizeWaveform = (
  waveform: WaveformPoint[],
  duration: number,
  points: number = 100
): string => {
  const summary: string[] = [];
  const pointsPerChunk = Math.ceil(waveform.length / points);

  for (let i = 0; i < points; i++) {
    const start = i * pointsPerChunk;
    const end = start + pointsPerChunk;
    const chunk = waveform.slice(start, end);

    if (chunk.length === 0) continue;

    const time = (i / points) * duration;

    const maxAmp = chunk.reduce((max, p) => Math.max(max, p.amp), 0);
    const avgCentroid =
      chunk.reduce((sum, p) => sum + p.spectralCentroid, 0) / chunk.length;
    const maxFlux = chunk.reduce((max, p) => Math.max(max, p.spectralFlux), 0);

    // Enhanced features (use first point's values as they're consistent across chunks)
    const firstPoint = chunk[0];
    const tempoBpm = firstPoint.tempoBpm || 120;
    const avgHarmonicRatio =
      chunk.reduce((sum, p) => sum + (p.harmonicRatio || 0.5), 0) /
      chunk.length;
    const avgDynamicRange =
      chunk.reduce((sum, p) => sum + (p.dynamicRange || 0), 0) / chunk.length;
    const avgRhythmicComplexity =
      chunk.reduce((sum, p) => sum + (p.rhythmicComplexity || 0), 0) /
      chunk.length;
    const avgLoudness =
      chunk.reduce((sum, p) => sum + (p.loudness || 0), 0) / chunk.length;
    const avgSharpness =
      chunk.reduce((sum, p) => sum + (p.sharpness || 0), 0) / chunk.length;
    const avgRoughness =
      chunk.reduce((sum, p) => sum + (p.roughness || 0), 0) / chunk.length;

    summary.push(
      `t:${time.toFixed(1)}s, amp:${maxAmp.toFixed(
        3
      )}, centroid:${avgCentroid.toFixed(3)}, flux:${maxFlux.toFixed(3)}, ` +
        `tempo:${tempoBpm.toFixed(0)}bpm, harmonic:${avgHarmonicRatio.toFixed(
          3
        )}, dynamic:${avgDynamicRange.toFixed(3)}, ` +
        `rhythm:${avgRhythmicComplexity.toFixed(
          3
        )}, loudness:${avgLoudness.toFixed(3)}, sharp:${avgSharpness.toFixed(
          3
        )}, rough:${avgRoughness.toFixed(3)}`
    );
  }

  return summary.join("; ");
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
            description: "The timestamp of the event in seconds.",
          },
          valence: {
            type: Type.NUMBER,
            description:
              "The emotional valence (-1 for negative, +1 for positive).",
          },
          arousal: {
            type: Type.NUMBER,
            description:
              "The emotional arousal or energy (0 for calm, 1 for intense).",
          },
          intensity: {
            type: Type.NUMBER,
            description:
              "The perceived emotional impact or 'punchiness' of the moment, from 0 to 100.",
          },
          confidence: {
            type: Type.NUMBER,
            description:
              "The AI's confidence in this suggestion's significance, from 0.0 to 1.0.",
          },
          reason: {
            type: Type.STRING,
            description:
              "A very brief justification for why this moment was chosen, based on audio features (e.g., 'Sudden peak in spectral flux', 'Sustained low centroid').",
          },
          gems: {
            type: Type.STRING,
            description: `The most likely GEMS category. Must be one of: ${Object.values(
              GEMS
            ).join(", ")}.`,
          },
          trigger: {
            type: Type.ARRAY,
            description: `The most likely musical triggers. Must be a subset of: ${Object.values(
              Trigger
            ).join(", ")}.`,
            items: { type: Type.STRING },
          },
          sync_notes: {
            type: Type.STRING,
            description:
              "Brief, objective notes on the specific musical event (e.g., 'Vocal entry', 'Beat drop'). MUST be grounded in song structure or lyrics if available.",
          },
          imagery: {
            type: Type.STRING,
            description:
              "A description of evoked imagery. MUST be directly inspired by and grounded in the specific lyrics or user annotations for this moment.",
          },
        },
        required: [
          "time",
          "valence",
          "arousal",
          "intensity",
          "confidence",
          "reason",
          "gems",
          "trigger",
          "sync_notes",
          "imagery",
        ],
      },
    },
  },
  required: ["suggestions"],
};

export const generateMerSuggestions = async (
  waveform: WaveformPoint[],
  duration: number,
  songContext?: string,
  trackId?: string
): Promise<MerSuggestion[]> => {
  // Prüfe Cache zuerst
  if (trackId) {
    const cached = getCachedAnalysis(trackId, waveform, songContext);
    if (cached) {
      return cached.suggestions;
    }
  }

  const apiKey = (import.meta as any).env?.VITE_GOOGLE_API_KEY as
    | string
    | undefined;
  if (!apiKey) {
    throw new Error(
      "Google API Key fehlt: Bitte setze VITE_GOOGLE_API_KEY (z.B. in einer .env) oder hinterlege ihn über deine lokale Umgebung, damit die KI-Analyse funktioniert."
    );
  }
  const ai = new GoogleGenAI({ apiKey });
  const summarizedData = summarizeWaveform(waveform, duration);

  const systemInstructionWithContext = `You are an expert in Music Information Retrieval (MIR) and Music Emotion Recognition (MER). Your primary task is to create a tight synthesis between summarized audio waveform data and rich lyrical/annotative context to identify emotionally significant moments in a song.

The audio data is a semicolon-separated list of summaries. Each summary contains:
- t: The timestamp in seconds.
- amp: The maximum amplitude (volume) in that time slice.
- centroid: The spectral centroid (0.0 for deep, bassy sounds; 1.0 for bright, high-frequency sounds).
- flux: The spectral flux (0.0 for stable timbre; 1.0 for rapid timbral change). A high flux indicates a sudden sonic event.
- tempo: The estimated beats per minute (BPM) for rhythmic context.
- harmonic: The harmonic ratio (0.0 for noisy/percussive sounds; 1.0 for pure harmonic content).
- dynamic: The dynamic range (0.0 for constant volume; 1.0 for high variation).
- rhythm: The rhythmic complexity (0.0 for simple patterns; 1.0 for complex rhythmic activity).
- loudness: The perceptual loudness (0.0 for quiet; 1.0 for loud, A-weighted).
- sharp: The sharpness (0.0 for dull/warm sounds; 1.0 for bright/sharp sounds).
- rough: The roughness (0.0 for smooth sounds; 1.0 for rough/harsh textures).

ENHANCED AUDIO FEATURE-EMOTION CORRELATION GUIDE:

HARMONIC CONTENT ANALYSIS (harmonic ratio):
- harmonic > 0.8: Consonant, peaceful emotions → Peacefulness, Tenderness, Wonder
- harmonic 0.5-0.8: Balanced harmonic content → Nostalgia, JoyfulActivation
- harmonic < 0.5: Dissonant, tense emotions → Tension, Power, Sadness

RHYTHMIC ENERGY ANALYSIS (rhythm + tempo):
- rhythm > 0.7 + tempo > 120: High energy emotions → JoyfulActivation, Power
- rhythm > 0.7 + tempo < 100: Complex but contemplative → Wonder, Transcendence
- rhythm < 0.3 + tempo < 80: Calm, reflective emotions → Peacefulness, Nostalgia, Sadness
- rhythm < 0.3 + tempo > 140: Simple but intense → Tension, Power

DYNAMIC INTENSITY ANALYSIS (dynamic range):
- dynamic > 0.8: Emotional volatility and intensity → Tension, Power, JoyfulActivation
- dynamic 0.4-0.8: Moderate emotional variation → Wonder, Nostalgia
- dynamic < 0.4: Stable, sustained emotions → Peacefulness, Tenderness, Sadness

TIMBRAL CHARACTER ANALYSIS (sharpness + roughness):
- sharp > 0.7 + rough < 0.3: Bright, clear emotions → JoyfulActivation, Wonder
- sharp < 0.3 + rough < 0.3: Warm, gentle emotions → Tenderness, Peacefulness
- sharp > 0.5 + rough > 0.6: Harsh, aggressive emotions → Tension, Power
- sharp < 0.5 + rough > 0.6: Dark, troubled emotions → Sadness, Tension

LOUDNESS CONTEXT (loudness + dynamic):
- loudness > 0.8 + dynamic > 0.6: Intense, impactful moments → Power, Tension, JoyfulActivation
- loudness < 0.3 + dynamic < 0.4: Intimate, delicate moments → Tenderness, Peacefulness
- loudness < 0.3 + sharp > 0.6: Delicate but bright → Wonder, Transcendence

Use these correlations to make precise emotion predictions. Combine multiple features for higher confidence scores.

You are also provided with rich song context (metadata, lyrics, annotations). Your analysis MUST deeply integrate this context. Identify 5 to 15 key moments representing significant emotional shifts.

For each moment, provide a full annotation with the following STRICT rules:
1.  time: The timestamp in seconds.
2.  valence: Estimated valence (-1 to +1).
3.  arousal: Estimated arousal (0 to 1).
4.  intensity: Perceived emotional impact (0-100). Differentiated from arousal (e.g., quiet tension can be high intensity).
5.  confidence: Your confidence (0.0 to 1.0) that this moment is emotionally significant based on BOTH audio features correlation and context.
6.  reason: A very brief justification based on specific audio features (e.g., "High harmonic + low rough = peaceful", "Peak flux + high rhythm = energetic transition").
7.  gems: The most likely GEMS category. Must be one of: ${Object.values(
    GEMS
  ).join(", ")}.
8.  trigger: An array of likely musical triggers. Must be a subset of: ${Object.values(
    Trigger
  ).join(", ")}.
9.  sync_notes: MUST be objective and directly reference the song structure or text at this timestamp. Examples: "Chorus begins", "Bridge starts with 'Now the night...'", "Vocal harmony enters".
10. imagery: MUST be directly inspired by and grounded in the specific lyrics or user annotations at this moment. You should explicitly reference the lyrical content that justifies your imagery. Example: "A sense of quiet hope, reflecting the 'sunrise' metaphor in the lyrics."

Your goal is to produce annotations where the audio analysis and the lyrical context are inextricably linked.`;

  const systemInstructionWithoutContext = `You are an expert in Music Information Retrieval (MIR) and Music Emotion Recognition (MER). Your task is to analyze summarized audio waveform data and identify the most emotionally significant moments in a piece of music, providing a comprehensive annotation for each.

The audio data is a semicolon-separated list of summaries. Each summary contains:
- t: The timestamp in seconds.
- amp: The maximum amplitude (volume) in that time slice.
- centroid: The spectral centroid (0.0 for deep, bassy sounds; 1.0 for bright, high-frequency sounds). This indicates the sound's "brightness".
- flux: The spectral flux (0.0 for stable timbre; 1.0 for rapid timbral change). A high flux indicates a sudden sonic event like a new instrument or a beat drop.
- tempo: The estimated beats per minute (BPM) for rhythmic context.
- harmonic: The harmonic ratio (0.0 for noisy/percussive sounds; 1.0 for pure harmonic content).
- dynamic: The dynamic range (0.0 for constant volume; 1.0 for high variation).
- rhythm: The rhythmic complexity (0.0 for simple patterns; 1.0 for complex rhythmic activity).
- loudness: The perceptual loudness (0.0 for quiet; 1.0 for loud, A-weighted).
- sharp: The sharpness (0.0 for dull/warm sounds; 1.0 for bright/sharp sounds).
- rough: The roughness (0.0 for smooth sounds; 1.0 for rough/harsh textures).

COMPREHENSIVE AUDIO FEATURE-EMOTION MAPPING SYSTEM:

HARMONIC CONTENT ANALYSIS (harmonic ratio → emotional consonance):
- harmonic > 0.8: Pure, consonant emotions
  → Peacefulness (valence +0.5, arousal 0.2), Tenderness (valence +0.7, arousal 0.3), Wonder (valence +0.3, arousal 0.4)
- harmonic 0.5-0.8: Balanced harmonic content
  → Nostalgia (valence -0.2, arousal 0.3), JoyfulActivation (valence +0.8, arousal 0.7)
- harmonic < 0.5: Dissonant, noisy content
  → Tension (valence -0.6, arousal 0.8), Power (valence +0.2, arousal 0.9), Sadness (valence -0.7, arousal 0.2)

RHYTHMIC ENERGY MATRIX (rhythm complexity + tempo → activation level):
- rhythm > 0.7 + tempo > 120: High complexity, fast tempo
  → JoyfulActivation (confidence +0.3), Power (confidence +0.2)
- rhythm > 0.7 + tempo < 100: Complex but slow
  → Wonder (confidence +0.2), Transcendence (confidence +0.3)
- rhythm < 0.3 + tempo < 80: Simple and slow
  → Peacefulness (confidence +0.3), Nostalgia (confidence +0.2), Sadness (confidence +0.2)
- rhythm < 0.3 + tempo > 140: Simple but fast
  → Tension (confidence +0.2), Power (confidence +0.2)

DYNAMIC INTENSITY PATTERNS (dynamic range → emotional volatility):
- dynamic > 0.8: High emotional volatility
  → Tension (intensity +20), Power (intensity +25), JoyfulActivation (intensity +20)
- dynamic 0.4-0.8: Moderate variation
  → Wonder (intensity +10), Nostalgia (intensity +10)
- dynamic < 0.4: Stable, sustained
  → Peacefulness (intensity +5), Tenderness (intensity +10), Sadness (intensity +5)

TIMBRAL CHARACTER MATRIX (sharpness + roughness → textural emotion):
- sharp > 0.7 + rough < 0.3: Bright and smooth
  → JoyfulActivation (valence +0.2), Wonder (valence +0.1)
- sharp < 0.3 + rough < 0.3: Warm and smooth
  → Tenderness (valence +0.2), Peacefulness (valence +0.1)
- sharp > 0.5 + rough > 0.6: Bright and harsh
  → Tension (arousal +0.2), Power (arousal +0.1)
- sharp < 0.5 + rough > 0.6: Dark and harsh
  → Sadness (valence -0.2), Tension (valence -0.1)

LOUDNESS CONTEXT ANALYSIS (loudness + other features → impact assessment):
- loudness > 0.8 + dynamic > 0.6: Loud and variable
  → Power (intensity +30), Tension (intensity +25), JoyfulActivation (intensity +20)
- loudness < 0.3 + dynamic < 0.4: Quiet and stable
  → Tenderness (intensity +15), Peacefulness (intensity +10)
- loudness < 0.3 + sharp > 0.6: Quiet but bright
  → Wonder (intensity +15), Transcendence (intensity +20)

CONFIDENCE CALCULATION RULES:
- Base confidence: 0.5
- +0.2 for strong feature correlation (e.g., high harmonic + Peacefulness)
- +0.1 for supporting secondary features
- +0.1 for consistent tempo-rhythm relationship
- +0.1 for clear spectral flux peaks (indicating significant events)
- Maximum confidence: 1.0

Your goal is to identify 5 to 15 key moments that represent significant emotional shifts, peaks, or transitions.

For each moment you identify, provide a full annotation:
- time: The timestamp in seconds.
- valence: Estimated valence (-1 to +1) based on harmonic content and timbral character.
- arousal: Estimated arousal (0 to 1) based on rhythmic energy and dynamic patterns.
- intensity: Integer from 0 to 100 for perceived emotional impact, enhanced by loudness context.
- confidence: Float from 0.0 to 1.0 calculated using the confidence rules above.
- reason: A very brief justification based on specific feature combinations (e.g., "High harmonic + low rough = peaceful", "Peak flux + complex rhythm = energetic transition").
- gems: The most likely GEMS category based on the feature-emotion mapping above. Must be one of: ${Object.values(
    GEMS
  ).join(", ")}.
- trigger: An array of the most likely musical triggers. Must be a subset of: ${Object.values(
    Trigger
  ).join(", ")}.
- sync_notes: Brief, objective notes on the specific musical event at this exact timestamp (e.g., 'Vocal entry', 'Beat drop', 'Guitar solo starts').
- imagery: A brief description of any images or feelings evoked by the sound at this moment, informed by the emotional character derived from audio features.`;

  const systemInstruction = songContext
    ? systemInstructionWithContext
    : systemInstructionWithoutContext;

  let promptContent = `Here is the summarized audio data for a track that is ${duration.toFixed(
    0
  )} seconds long. Please identify the key emotional moments and provide full annotations.\n\nAUDIO DATA: ${summarizedData}`;

  if (songContext) {
    promptContent = `Analyze the following song based on its audio data and the provided context. The track is ${duration.toFixed(
      0
    )} seconds long. Identify key emotional moments and provide full annotations.\n\n--- SONG CONTEXT ---\n${songContext}\n\n--- AUDIO DATA ---\n${summarizedData}`;
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
      const suggestions = result.suggestions
        .map((s: any) => {
          const parsedGems = Object.values(GEMS).includes(s.gems as GEMS)
            ? (s.gems as GEMS)
            : "";
          const parsedTriggers = Array.isArray(s.trigger)
            ? (s.trigger.filter(
                (t: any) =>
                  typeof t === "string" &&
                  Object.values(Trigger).includes(t as Trigger)
              ) as Trigger[])
            : [];

          return {
            time: s.time,
            valence: Math.max(-1, Math.min(1, s.valence)),
            arousal: Math.max(0, Math.min(1, s.arousal)),
            intensity: Math.round(Math.max(0, Math.min(100, s.intensity || 0))),
            confidence: Math.max(0, Math.min(1, s.confidence || 0)),
            reason: s.reason || "No reason provided.",
            gems: parsedGems,
            trigger: parsedTriggers,
            sync_notes: s.sync_notes || "",
            imagery: s.imagery || "",
          };
        })
        .filter((s: MerSuggestion) => s.time <= duration && s.time >= 0);

      // Cache das Ergebnis
      if (trackId && songContext) {
        cacheAnalysisResult(trackId, waveform, songContext, suggestions);
      }

      return suggestions;
    }

    return [];
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Fallback or re-throw
    throw new Error("Failed to get analysis from AI model.");
  }
};
