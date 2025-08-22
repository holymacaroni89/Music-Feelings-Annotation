import { GEMS, Trigger, EmotionVisualConfig } from "./types";

export const GEMS_OPTIONS: GEMS[] = Object.values(GEMS);
export const TRIGGER_OPTIONS: Trigger[] = Object.values(Trigger);

export const AUTOSAVE_KEY = "mea_state_v1";
export const MARKER_DEFAULT_DURATION_S = 1.0;

export const GEMS_COLORS: { [key in GEMS]: string } = {
  [GEMS.Wonder]: "bg-accent-400 text-accent-950", // Violett - Wunder & Staunen
  [GEMS.Transcendence]: "bg-info-400 text-info-950", // Blau - Transzendenz & Erhabenheit
  [GEMS.Tenderness]: "bg-pink-300 text-pink-950", // Rosa - Zärtlichkeit & Sanftheit
  [GEMS.Nostalgia]: "bg-warning-400 text-warning-950", // Gelb - Nostalgie & Erinnerung
  [GEMS.Peacefulness]: "bg-success-400 text-success-950", // Grün - Friedlichkeit & Ruhe
  [GEMS.Power]: "bg-error-500 text-error-50", // Rot - Kraft & Stärke
  [GEMS.JoyfulActivation]: "bg-warning-300 text-warning-950", // Gelb-Orange - Freude & Aktivierung
  [GEMS.Tension]: "bg-orange-500 text-orange-50", // Orange - Spannung & Aufregung
  [GEMS.Sadness]: "bg-gray-500 text-gray-50", // Grau - Traurigkeit & Melancholie
};

// Neue detaillierte Visualisierungs-Konfigurationen für emotionale Hotspots
export const EMOTION_VISUAL_CONFIGS: Record<GEMS, EmotionVisualConfig> = {
  [GEMS.Wonder]: {
    baseColor: "#8B5CF6", // Violett
    intensityGradient: ["#8B5CF6", "#A855F7", "#C084FC"],
    hoverColor: "#7C3AED",
    selectedColor: "#6D28D9",
    opacity: 0.8,
    size: { min: 8, max: 24, base: 16 },
  },
  [GEMS.Transcendence]: {
    baseColor: "#3B82F6", // Blau
    intensityGradient: ["#3B82F6", "#60A5FA", "#93C5FD"],
    hoverColor: "#2563EB",
    selectedColor: "#1D4ED8",
    opacity: 0.8,
    size: { min: 8, max: 24, base: 16 },
  },
  [GEMS.Tenderness]: {
    baseColor: "#EC4899", // Rosa
    intensityGradient: ["#EC4899", "#F472B6", "#F9A8D4"],
    hoverColor: "#DB2777",
    selectedColor: "#BE185D",
    opacity: 0.8,
    size: { min: 8, max: 24, base: 16 },
  },
  [GEMS.Nostalgia]: {
    baseColor: "#F59E0B", // Gelb
    intensityGradient: ["#F59E0B", "#FBBF24", "#FCD34D"],
    hoverColor: "#D97706",
    selectedColor: "#B45309",
    opacity: 0.8,
    size: { min: 8, max: 24, base: 16 },
  },
  [GEMS.Peacefulness]: {
    baseColor: "#10B981", // Grün
    intensityGradient: ["#10B981", "#34D399", "#6EE7B7"],
    hoverColor: "#059669",
    selectedColor: "#047857",
    opacity: 0.8,
    size: { min: 8, max: 24, base: 16 },
  },
  [GEMS.Power]: {
    baseColor: "#EF4444", // Rot
    intensityGradient: ["#EF4444", "#F87171", "#FCA5A5"],
    hoverColor: "#DC2626",
    selectedColor: "#B91C1C",
    opacity: 0.8,
    size: { min: 8, max: 24, base: 16 },
  },
  [GEMS.JoyfulActivation]: {
    baseColor: "#FCD34D", // Gelb-Orange
    intensityGradient: ["#FCD34D", "#FBBF24", "#F59E0B"],
    hoverColor: "#F59E0B",
    selectedColor: "#D97706",
    opacity: 0.8,
    size: { min: 8, max: 24, base: 16 },
  },
  [GEMS.Tension]: {
    baseColor: "#F97316", // Orange
    intensityGradient: ["#F97316", "#FB923C", "#FDBA74"],
    hoverColor: "#EA580C",
    selectedColor: "#C2410C",
    opacity: 0.8,
    size: { min: 8, max: 24, base: 16 },
  },
  [GEMS.Sadness]: {
    baseColor: "#6B7280", // Grau
    intensityGradient: ["#6B7280", "#9CA3AF", "#D1D5DB"],
    hoverColor: "#4B5563",
    selectedColor: "#374151",
    opacity: 0.8,
    size: { min: 8, max: 24, base: 16 },
  },
};

// Hilfsfunktionen für Hotspot-Visualisierung
export const getIntensityColor = (
  gradient: string[],
  intensity: number
): string => {
  if (intensity < 0.3) return gradient[0]; // Niedrig
  if (intensity < 0.7) return gradient[1]; // Mittel
  return gradient[2]; // Hoch
};

export const getConfidenceAlpha = (confidence: number): number => {
  return 0.3 + confidence * 0.7; // 0.3 bis 1.0
};

export const getHotspotSize = (
  intensity: number,
  baseSize: number = 16
): number => {
  const intensityMultiplier = 0.5 + intensity * 0.5;
  return baseSize * intensityMultiplier;
};
