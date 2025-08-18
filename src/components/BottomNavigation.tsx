import React from 'react';
import { Button } from '@/components/ui/button';
import {
  PlayIcon,
  PauseIcon,
  MarkerIcon,
  ZoomInIcon,
  ZoomOutIcon,
  SettingsIcon,
} from './icons';

interface BottomNavigationProps {
  // Audio Controls
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  
  // Marker Creation
  pendingMarkerStart: number | null;
  onMarkerCreationToggle: () => void;
  
  // Zoom Controls
  onZoom: (direction: 'in' | 'out') => void;
  
  // Settings
  onOpenSettings: () => void;
  
  // Visibility
  trackInfo: any; // Only show when track is loaded
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  isPlaying,
  onTogglePlayPause,
  pendingMarkerStart,
  onMarkerCreationToggle,
  onZoom,
  onOpenSettings,
  trackInfo,
}) => {
  // Only show bottom navigation on mobile/tablet and when track is loaded
  if (!trackInfo) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-4 py-3 z-40 lg:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Play/Pause - Most Important */}
        <Button
          onClick={onTogglePlayPause}
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-accent-600 hover:bg-accent-700 text-white transition-all duration-200 shadow-lg"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </Button>

        {/* Marker Creation */}
        <Button
          onClick={onMarkerCreationToggle}
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-full text-white transition-all duration-200 ${
            pendingMarkerStart !== null
              ? "bg-warning-400 text-warning-950 hover:bg-warning-500"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          title={
            pendingMarkerStart !== null
              ? "Set Marker End"
              : "Set Marker Start"
          }
        >
          <MarkerIcon />
        </Button>

        {/* Zoom In */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all duration-200"
          onClick={() => onZoom("in")}
          title="Zoom In"
        >
          <ZoomInIcon />
        </Button>

        {/* Zoom Out */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all duration-200"
          onClick={() => onZoom("out")}
          title="Zoom Out"
        >
          <ZoomOutIcon />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all duration-200"
          onClick={onOpenSettings}
          title="Settings"
        >
          <SettingsIcon />
        </Button>
      </div>
    </div>
  );
};

export default BottomNavigation;
