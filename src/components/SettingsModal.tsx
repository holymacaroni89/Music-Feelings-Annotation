import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { SettingsIcon, XIcon } from "./icons";
import { ColorPalette } from "../types";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  waveformDetail: number;
  onWaveformDetailChange: (detail: number) => void;
  colorPalette: ColorPalette;
  onColorPaletteChange: (palette: ColorPalette) => void;
  audioBuffer: AudioBuffer | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
  waveformDetail,
  onWaveformDetailChange,
  colorPalette,
  onColorPaletteChange,
  audioBuffer,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center text-gray-100">
            <span className="flex items-center gap-2">
              <SettingsIcon />
              Visualization Settings
            </span>
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-200"
            >
              <XIcon />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Waveform Detail */}
          <div>
            <label className="flex justify-between text-sm font-medium text-gray-300 mb-3">
              <span>Waveform Detail</span>
              <span className="text-gray-400">{waveformDetail} points</span>
            </label>
            <input
              type="range"
              min="500"
              max="8000"
              step="100"
              value={waveformDetail}
              onChange={(e) =>
                onWaveformDetailChange(parseInt(e.target.value, 10))
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-500 border border-gray-600"
              disabled={!audioBuffer}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label
              htmlFor="color-palette"
              className="block text-sm font-medium text-gray-300 mb-3"
            >
              Color Palette
            </label>
            <select
              id="color-palette"
              value={colorPalette}
              onChange={(e) =>
                onColorPaletteChange(e.target.value as ColorPalette)
              }
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-md p-3 focus:ring-accent-500 focus:border-accent-500 transition-colors duration-200"
            >
              <option value="vibrant">Vibrant</option>
              <option value="spectral">Spectral</option>
              <option value="thermal">Thermal</option>
              <option value="grayscale">Grayscale</option>
            </select>
          </div>

          {/* Additional Settings können hier hinzugefügt werden */}
          <div className="text-xs text-gray-500 text-center">
            Changes are applied automatically
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
