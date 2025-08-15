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
  spectralCentroid: number; // Normalized 0-1, represents brightness
  spectralFlux: number;     // Normalized 0-1, represents timbral change
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
  intensity: number;
  confidence: number;
  reason: string;
  gems: GEMS | '';
  trigger: Trigger[];
  sync_notes: string;
  imagery: string;
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
    // API Keys
    geniusApiKey?: string;
    // AI Context
    songContext: { [trackLocalId: string]: string };
}

export interface GeniusHit {
  result: {
    id: number;
    url: string;
    title: string;
    primary_artist: {
      name: string;
    };
    song_art_image_thumbnail_url: string;
  }
}

// For search results
export interface GeniusSong {
  id: number;
  url: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
}

// For detailed view
export interface GeniusSongDetails extends GeniusSong {
    album: string | null;
    releaseDate: string | null;
    imageUrl: string;
    descriptionHtml: string | null; // Community annotations
    lyrics: string | null;
}