import { GEMS, Trigger } from './types';

export const GEMS_OPTIONS: GEMS[] = Object.values(GEMS);
export const TRIGGER_OPTIONS: Trigger[] = Object.values(Trigger);

export const AUTOSAVE_KEY = 'mea_state_v1';
export const MARKER_DEFAULT_DURATION_S = 1.0;

export const GEMS_COLORS: { [key in GEMS]: string } = {
    [GEMS.Wonder]: 'bg-accent-400 text-accent-950',           // Violett - Wunder & Staunen
    [GEMS.Transcendence]: 'bg-info-400 text-info-950',        // Blau - Transzendenz & Erhabenheit
    [GEMS.Tenderness]: 'bg-pink-300 text-pink-950',           // Rosa - Zärtlichkeit & Sanftheit
    [GEMS.Nostalgia]: 'bg-warning-400 text-warning-950',      // Gelb - Nostalgie & Erinnerung
    [GEMS.Peacefulness]: 'bg-success-400 text-success-950',   // Grün - Friedlichkeit & Ruhe
    [GEMS.Power]: 'bg-error-500 text-error-50',               // Rot - Kraft & Stärke
    [GEMS.JoyfulActivation]: 'bg-warning-300 text-warning-950', // Gelb-Orange - Freude & Aktivierung
    [GEMS.Tension]: 'bg-orange-500 text-orange-50',           // Orange - Spannung & Aufregung
    [GEMS.Sadness]: 'bg-gray-500 text-gray-50',               // Grau - Traurigkeit & Melancholie
};
