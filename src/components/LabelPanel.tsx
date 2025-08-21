import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Marker, GEMS, Trigger } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface LabelPanelProps {
  selectedMarker: Marker | null;
  onUpdateMarker: (updatedMarker: Marker) => void;
  onDeleteMarker: (markerId: string) => void;
}

// InfoTooltip component with consistent sizing
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="relative group flex items-center">
    <div className="w-5 h-5 rounded-full bg-gray-600 text-gray-200 text-xs flex items-center justify-center cursor-help hover:bg-gray-500 transition-colors">
      ?
    </div>
    <div className="absolute bottom-full mb-2 w-64 p-3 bg-gray-900 text-gray-200 text-sm rounded-lg border border-gray-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 transform -translate-x-1/2 left-1/2">
      {text}
    </div>
  </div>
);

// EmotionSlider component with consistent design system
const EmotionSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  tooltip: string;
  formatValue?: (value: number) => string;
}> = ({ label, value, min, max, step, onChange, tooltip, formatValue }) => {
  const displayValue = formatValue ? formatValue(value) : value.toFixed(2);

  return (
    <div className="space-y-3">
      <label className="flex justify-between items-center text-sm font-medium text-gray-200">
        <span className="flex items-center gap-2">
          {label}
          <InfoTooltip text={tooltip} />
        </span>
        <span className="text-accent-400 font-mono text-sm min-w-[3rem] text-right">
          {displayValue}
        </span>
      </label>
      <div className="px-1">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
      </div>
    </div>
  );
};

const LabelPanel: React.FC<LabelPanelProps> = ({
  selectedMarker,
  onUpdateMarker,
  onDeleteMarker,
}) => {
  // State für das Modal auf kleineren Bildschirmen
  const [showMobileModal, setShowMobileModal] = useState(false);

  // Modal auf kleineren Bildschirmen anzeigen
  useEffect(() => {
    if (selectedMarker && window.innerWidth < 1024) {
      setShowMobileModal(true);
    } else if (!selectedMarker) {
      setShowMobileModal(false);
    }
  }, [selectedMarker]);

  // Modal schließen, wenn der Bildschirm größer wird
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowMobileModal(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Modal schließen, wenn der Benutzer es manuell schließt
  const handleModalClose = () => {
    setShowMobileModal(false);
  };

  if (!selectedMarker) {
    // Auf mobilen Ansichten (unter lg) kein statisches Panel anzeigen, um vertikalen Platz zu sparen.
    // Das Bearbeiten erfolgt dort ausschließlich im Modal, sobald ein Marker ausgewählt ist.
    return (
      <div className="hidden lg:flex w-full lg:w-80 bg-gray-900 p-3 sm:p-4 flex-col justify-center items-center text-center text-gray-400 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-800 min-h-0">
        <p className="font-semibold text-gray-300">Select a marker to edit.</p>
        <p className="text-xs mt-2 text-gray-500">
          To create a new marker range:
          <br />
          1. Press 'M' to set the start point.
          <br />
          2. Press 'M' again to set the end point.
        </p>
      </div>
    );
  }

  const handleInputChange = (field: keyof Marker, value: any) => {
    onUpdateMarker({ ...selectedMarker, [field]: value });
  };

  const handleTriggerChange = (trigger: Trigger, checked: boolean) => {
    const newTriggers = checked
      ? [...selectedMarker.trigger, trigger]
      : selectedMarker.trigger.filter((t) => t !== trigger);
    onUpdateMarker({ ...selectedMarker, trigger: newTriggers.sort() });
  };

  // Desktop-Version (ab 1024px)
  const desktopPanel = (
    <div className="hidden lg:block w-80 bg-gray-900 p-2 sm:p-3 overflow-y-auto flex-shrink-0 border-l border-gray-800 shadow-lg min-h-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-100">
          Marker @ {selectedMarker.t_start_s.toFixed(2)}s
        </h2>
        <Button
          onClick={() => onDeleteMarker(selectedMarker.id)}
          variant="destructive"
          size="sm"
          className="shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Delete
        </Button>
      </div>

      <div className="space-y-6">
        <EmotionSlider
          label="Valence"
          value={selectedMarker.valence}
          min={-1}
          max={1}
          step={0.01}
          onChange={(value) => handleInputChange("valence", value)}
          tooltip="How positive (+1) or negative (-1) the emotion is."
        />

        <EmotionSlider
          label="Arousal"
          value={selectedMarker.arousal}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => handleInputChange("arousal", value)}
          tooltip="The energy level of the emotion, from calm (0) to activated (1)."
        />

        <EmotionSlider
          label="Intensity"
          value={selectedMarker.intensity}
          min={0}
          max={100}
          step={1}
          onChange={(value) =>
            handleInputChange("intensity", Math.round(value))
          }
          tooltip="The perceived emotional impact or 'punchiness' of the moment (0-100). A quiet, tense moment can have low arousal but high intensity."
          formatValue={(value) => Math.round(value).toString()}
        />

        <EmotionSlider
          label="Confidence"
          value={selectedMarker.confidence}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => handleInputChange("confidence", value)}
          tooltip="How certain you are about this annotation (0-1)."
        />

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
            GEMS
            <InfoTooltip text="The primary Geneva Emotional Music Scale category that best fits the feeling." />
          </label>
          <Select
            value={selectedMarker.gems || "none"}
            onValueChange={(value) =>
              handleInputChange("gems", value === "none" ? "" : value)
            }
          >
            <SelectTrigger className="w-full h-11 bg-gray-800 border border-gray-700 text-gray-200 hover:border-gray-600 focus:border-accent-400 transition-colors">
              <SelectValue placeholder="Select GEMS category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border border-gray-700">
              <SelectItem value="none">No GEMS category</SelectItem>
              {Object.values(GEMS).map((gems) => (
                <SelectItem key={gems} value={gems}>
                  {gems}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
            Musical Triggers
            <InfoTooltip text="What musical elements triggered this emotional response." />
          </label>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(Trigger).map((trigger) => (
              <div key={trigger} className="flex items-center space-x-3">
                <Checkbox
                  id={`trigger-${trigger}`}
                  checked={selectedMarker.trigger.includes(trigger)}
                  onCheckedChange={(checked) =>
                    handleTriggerChange(trigger, checked as boolean)
                  }
                  className="h-5 w-5 data-[state=checked]:bg-accent-500 data-[state=checked]:border-accent-500"
                />
                <label
                  htmlFor={`trigger-${trigger}`}
                  className="text-sm text-gray-200 cursor-pointer select-none"
                >
                  {trigger}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
            Imagery
            <InfoTooltip text="What images, scenes, or associations come to mind when you hear this moment?" />
          </label>
          <Textarea
            value={selectedMarker.imagery}
            onChange={(e) => handleInputChange("imagery", e.target.value)}
            className="w-full min-h-[80px] bg-gray-800 border border-gray-700 text-gray-200 hover:border-gray-600 focus:ring-accent-400 focus:border-accent-400 transition-colors duration-200 resize-none"
            placeholder="Describe the mental imagery..."
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
            Sync Notes
            <InfoTooltip text="Any timing-specific notes, numbers, or symbols to help with synchronization." />
          </label>
          <Textarea
            value={selectedMarker.sync_notes}
            onChange={(e) => handleInputChange("sync_notes", e.target.value)}
            className="w-full min-h-[80px] bg-gray-800 border border-gray-700 text-gray-200 hover:border-gray-600 focus:ring-accent-400 focus:border-accent-400 transition-colors duration-200 resize-none"
            placeholder="Timing notes, numbers, symbols..."
          />
        </div>
      </div>
    </div>
  );

  // Mobile-Version (Modal)
  const mobileModal = (
    <Dialog open={showMobileModal} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-gray-100 shadow-2xl z-50">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center text-gray-100">
            <span>Marker @ {selectedMarker.t_start_s.toFixed(2)}s</span>
            <Button
              onClick={() => onDeleteMarker(selectedMarker.id)}
              variant="destructive"
              size="sm"
              className="ml-2"
            >
              Delete
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <EmotionSlider
            label="Valence"
            value={selectedMarker.valence}
            min={-1}
            max={1}
            step={0.01}
            onChange={(value) => handleInputChange("valence", value)}
            tooltip="How positive (+1) or negative (-1) the emotion is."
          />

          <EmotionSlider
            label="Arousal"
            value={selectedMarker.arousal}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => handleInputChange("arousal", value)}
            tooltip="The energy level of the emotion, from calm (0) to activated (1)."
          />

          <EmotionSlider
            label="Intensity"
            value={selectedMarker.intensity}
            min={0}
            max={100}
            step={1}
            onChange={(value) =>
              handleInputChange("intensity", Math.round(value))
            }
            tooltip="The perceived emotional impact or 'punchiness' of the moment (0-100)."
            formatValue={(value) => Math.round(value).toString()}
          />

          <EmotionSlider
            label="Confidence"
            value={selectedMarker.confidence}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => handleInputChange("confidence", value)}
            tooltip="How certain you are about this annotation (0-1)."
          />

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
              GEMS
              <InfoTooltip text="The primary Geneva Emotional Music Scale category that best fits the feeling." />
            </label>
            <Select
              value={selectedMarker.gems || "none"}
              onValueChange={(value) =>
                handleInputChange("gems", value === "none" ? "" : value)
              }
            >
              <SelectTrigger className="w-full h-11 bg-gray-800 border border-gray-700 text-gray-200 hover:border-gray-600 focus:border-accent-400 transition-colors">
                <SelectValue placeholder="Select GEMS category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border border-gray-700">
                <SelectItem value="none">No GEMS category</SelectItem>
                {Object.values(GEMS).map((gems) => (
                  <SelectItem key={gems} value={gems}>
                    {gems}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
              Musical Triggers
              <InfoTooltip text="What musical elements triggered this emotional response." />
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(Trigger).map((trigger) => (
                <div key={trigger} className="flex items-center space-x-3">
                  <Checkbox
                    id={`mobile-trigger-${trigger}`}
                    checked={selectedMarker.trigger.includes(trigger)}
                    onCheckedChange={(checked) =>
                      handleTriggerChange(trigger, checked as boolean)
                    }
                    className="h-5 w-5 data-[state=checked]:bg-accent-500 data-[state=checked]:border-accent-500"
                  />
                  <label
                    htmlFor={`mobile-trigger-${trigger}`}
                    className="text-sm text-gray-200 cursor-pointer select-none"
                  >
                    {trigger}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
              Imagery
              <InfoTooltip text="What images, scenes, or associations come to mind when you hear this moment?" />
            </label>
            <Textarea
              value={selectedMarker.imagery}
              onChange={(e) => handleInputChange("imagery", e.target.value)}
              className="w-full min-h-[80px] bg-gray-800 border border-gray-700 text-gray-200 hover:border-gray-600 focus:ring-accent-400 focus:border-accent-400 transition-colors duration-200 resize-none"
              placeholder="Describe the mental imagery..."
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-200">
              Sync Notes
              <InfoTooltip text="Any timing-specific notes, numbers, or symbols to help with synchronization." />
            </label>
            <Textarea
              value={selectedMarker.sync_notes}
              onChange={(e) => handleInputChange("sync_notes", e.target.value)}
              className="w-full min-h-[80px] bg-gray-800 border border-gray-700 text-gray-200 hover:border-gray-600 focus:ring-accent-400 focus:border-accent-400 transition-colors duration-200 resize-none"
              placeholder="Timing notes, numbers, symbols..."
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {desktopPanel}
      {mobileModal}
    </>
  );
};

export default LabelPanel;
