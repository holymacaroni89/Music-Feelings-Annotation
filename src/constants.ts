import { GEMS, Trigger } from './types';

export const GEMS_OPTIONS: GEMS[] = Object.values(GEMS);
export const TRIGGER_OPTIONS: Trigger[] = Object.values(Trigger);

export const AUTOSAVE_KEY = 'mea_state_v1';
export const MARKER_DEFAULT_DURATION_S = 1.0;

export const GEMS_COLORS: { [key in GEMS]: string } = {
    [GEMS.Wonder]: 'bg-purple-500',
    [GEMS.Transcendence]: 'bg-sky-400',
    [GEMS.Tenderness]: 'bg-pink-400',
    [GEMS.Nostalgia]: 'bg-amber-500',
    [GEMS.Peacefulness]: 'bg-green-400',
    [GEMS.Power]: 'bg-red-600',
    [GEMS.JoyfulActivation]: 'bg-yellow-400',
    [GEMS.Tension]: 'bg-orange-500',
    [GEMS.Sadness]: 'bg-blue-600',
};
