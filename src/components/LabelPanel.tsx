import React from 'react';
import { Marker, GEMS, Trigger } from '../types';
import { GEMS_OPTIONS, TRIGGER_OPTIONS } from '../constants';
import { QuestionMarkIcon } from './icons';

interface LabelPanelProps {
    selectedMarker: Marker | null;
    onUpdateMarker: (updatedMarker: Marker) => void;
    onDeleteMarker: (markerId: string) => void;
}

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="relative group flex items-center">
        <QuestionMarkIcon />
        <div className="absolute bottom-full mb-2 w-64 p-2 bg-gray-900 text-gray-200 text-xs rounded-md border border-gray-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 transform -translate-x-1/2 left-1/2">
            {text}
        </div>
    </div>
);

interface SliderProps {
    label: string;
    tooltipText: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    displayValue: string;
}

const Slider: React.FC<SliderProps> = ({ label, tooltipText, value, min, max, step, onChange, displayValue }) => (
    <div>
        <label className="flex justify-between items-center text-sm font-medium text-gray-300">
            <span className="flex items-center gap-1.5">
                {label}
                <InfoTooltip text={tooltipText} />
            </span>
            <span>{displayValue}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
    </div>
);

const LabelPanel: React.FC<LabelPanelProps> = ({ selectedMarker, onUpdateMarker, onDeleteMarker }) => {
    if (!selectedMarker) {
        return (
            <div className="w-96 bg-gray-800 p-6 flex flex-col justify-center items-center text-center text-gray-500 flex-shrink-0">
                <p className="font-semibold">Select a marker to edit.</p>
                <p className="text-xs mt-2">
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
    
    const handleTriggerChange = (trigger: Trigger) => {
        const newTriggers = selectedMarker.trigger.includes(trigger)
            ? selectedMarker.trigger.filter(t => t !== trigger)
            : [...selectedMarker.trigger, trigger];
        onUpdateMarker({ ...selectedMarker, trigger: newTriggers.sort() });
    };

    return (
        <div className="w-96 bg-gray-800 p-4 overflow-y-auto flex-shrink-0 border-l border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-100">Marker @ {selectedMarker.t_start_s.toFixed(2)}s</h2>
                <button
                    onClick={() => onDeleteMarker(selectedMarker.id)}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors"
                >
                    Delete
                </button>
            </div>

            <div className="space-y-5">
                <Slider
                    label="Valence"
                    tooltipText="How positive (+1) or negative (-1) the emotion is."
                    value={selectedMarker.valence}
                    min={-1} max={1} step={0.01}
                    onChange={e => handleInputChange('valence', parseFloat(e.target.value))}
                    displayValue={selectedMarker.valence.toFixed(2)}
                />
                <Slider
                    label="Arousal"
                    tooltipText="The energy level of the emotion, from calm (0) to activated (1)."
                    value={selectedMarker.arousal}
                    min={0} max={1} step={0.01}
                    onChange={e => handleInputChange('arousal', parseFloat(e.target.value))}
                    displayValue={selectedMarker.arousal.toFixed(2)}
                />
                <Slider
                    label="Intensity"
                    tooltipText="The perceived emotional impact or 'punchiness' of the moment (0-100). A quiet, tense moment can have low arousal but high intensity."
                    value={selectedMarker.intensity}
                    min={0} max={100} step={1}
                    onChange={e => handleInputChange('intensity', parseInt(e.target.value, 10))}
                    displayValue={selectedMarker.intensity.toString()}
                />
                <Slider
                    label="Confidence"
                    tooltipText="How certain you are about this annotation (0-1)."
                    value={selectedMarker.confidence}
                    min={0} max={1} step={0.01}
                    onChange={e => handleInputChange('confidence', parseFloat(e.target.value))}
                    displayValue={selectedMarker.confidence.toFixed(2)}
                />

                <div>
                    <label htmlFor="gems" className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-1">
                        GEMS
                        <InfoTooltip text="The primary Geneva Emotional Music Scale category that best fits the feeling." />
                    </label>
                    <select
                        id="gems"
                        value={selectedMarker.gems}
                        onChange={e => handleInputChange('gems', e.target.value as GEMS | '')}
                        className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">None</option>
                        {GEMS_OPTIONS.map(gem => (
                            <option key={gem} value={gem}>{gem}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-2">
                        Trigger
                        <InfoTooltip text="The main musical element(s) causing the emotion." />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {TRIGGER_OPTIONS.map(trigger => (
                            <label key={trigger} className="flex items-center space-x-2 p-2 bg-gray-700 rounded-md select-none cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedMarker.trigger.includes(trigger)}
                                    onChange={() => handleTriggerChange(trigger)}
                                    className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-500"
                                />
                                <span>{trigger}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="imagery" className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-1">
                        Imagery
                        <InfoTooltip text="Free-text description of any images, thoughts, or feelings evoked." />
                    </label>
                    <textarea
                        id="imagery"
                        rows={3}
                        value={selectedMarker.imagery}
                        onChange={e => handleInputChange('imagery', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe any imagery..."
                    />
                </div>

                <div>
                    <label htmlFor="sync_notes" className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-1">
                        Sync Notes
                        <InfoTooltip text="Notes on specific musical events for synchronization (e.g., 'beat drop', 'vocals enter')." />
                    </label>
                    <textarea
                        id="sync_notes"
                        rows={3}
                        value={selectedMarker.sync_notes}
                        onChange={e => handleInputChange('sync_notes', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Note sync points, symbols..."
                    />
                </div>
            </div>
        </div>
    );
};

export default LabelPanel;
