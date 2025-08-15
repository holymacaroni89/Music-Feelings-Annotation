export enum GEMS {
    Wonder = 'Wonder',
    Transcendence = 'Transcendence',
    Tenderness = 'Tenderness',
    Nostalgia = 'Nostalgia',
    Peacefulness = 'Peacefulness',
    Power = 'Power',
    JoyfulActivation = 'JoyfulActivation',
    Tension = 'Tension',
    Sadness = 'Sadness',
}

export enum Trigger {
    Harmony = 'Harmony',
    Melody = 'Melody',
    Rhythm = 'Rhythm',
    Timbre = 'Timbre',
    Lyrics = 'Lyrics',
}

export interface Marker {
  id: string;                 // stable UUID v4
  trackLocalId: string;       // z. B. hash des Dateinamens
  title: string;
  artist: string;
  duration_s: number;         // Gesamtdauer
  t_start_s: number;
  t_end_s: number;
  valence: number;            // −1..+1 (float)
  arousal: number;            // 0..1 (float)
  intensity: number;          // 0..100 (int)
  confidence: number;         // 0..1 (float)
  gems: GEMS | '';            // one of GEMS or empty
  trigger: Trigger[];         // subset of Trigger
  imagery: string;            // Freitext
  sync_notes: string          // Freitext (Zahlen/Symbole)
}


export interface TrackInfo {
    localId: string;
    name: string;
    title: string;
    artist: string;
    duration_s: number;
}

export interface WaveformPoint {
  amp: number;
  colorValue: number; // 0 (dark/bass) to 1 (bright/treble)
}

export type ColorPalette = 'vibrant' | 'spectral' | 'thermal' | 'grayscale';

export interface Profile {
  id: string;
  name: string;
}

export interface MerSuggestion {
  time: number;
  valence: number;
  arousal: number;
}

export interface TrainingSample {
  input: {
    valence: number;
    arousal: number;
  };
  output: {
    valence: number;
    arousal: number;
  };
}

export interface AppState {
    currentTrackLocalId: string | null;
    trackMetadata: { [key: string]: { name: string; title: string; artist: string; duration_s: number; } };
    markers: Marker[];
    // Profile Management
    profiles: Profile[];
    activeProfileId: string | null;
}