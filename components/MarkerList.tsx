import React from 'react';
import { Marker } from '../types';
import { GEMS_COLORS } from '../constants';
import { TrashIcon } from './icons';

interface MarkerListProps {
    markers: Marker[];
    selectedMarkerId: string | null;
    onSelectMarker: (markerId: string) => void;
    onDeleteMarker: (markerId:string) => void;
}

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const MarkerList: React.FC<MarkerListProps> = ({ markers, selectedMarkerId, onSelectMarker, onDeleteMarker }) => {
    if (markers.length === 0) {
        return (
            <div className="flex-grow flex justify-center items-center text-gray-500 bg-gray-900 p-4">
                <p>No markers created yet. Use 'M' to define a time range.</p>
            </div>
        );
    }

    return (
        <div className="flex-grow bg-gray-900 overflow-y-auto p-2">
            <div className="space-y-2">
                {markers.map(marker => {
                    const isSelected = marker.id === selectedMarkerId;
                    const gemColor = marker.gems ? GEMS_COLORS[marker.gems] : 'bg-gray-500';

                    return (
                        <div
                            key={marker.id}
                            onClick={() => onSelectMarker(marker.id)}
                            className={`
                                p-3 rounded-lg cursor-pointer flex items-center justify-between gap-4
                                transition-all duration-150 ease-in-out
                                ${isSelected ? 'bg-blue-500 bg-opacity-20 ring-2 ring-blue-500' : 'bg-gray-800 hover:bg-gray-700'}
                            `}
                        >
                            <div className="flex items-center gap-4 flex-grow min-w-0">
                                 <div className={`w-3 h-3 rounded-full flex-shrink-0 ${gemColor}`}></div>
                                 <div className="font-mono text-sm text-gray-300 w-28 flex-shrink-0">
                                     {formatTime(marker.t_start_s)} - {formatTime(marker.t_end_s)}
                                 </div>
                                 <div className="flex flex-col min-w-0">
                                     <span className="text-white font-semibold truncate">{marker.gems || 'No GEMS'}</span>
                                     <p className="text-gray-400 text-xs truncate">{marker.imagery || 'No imagery text.'}</p>
                                 </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent selection when deleting
                                    onDeleteMarker(marker.id);
                                }}
                                className="p-1 rounded-full text-gray-400 hover:bg-red-700 hover:text-white transition-colors flex-shrink-0"
                                title="Delete Marker"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MarkerList;
