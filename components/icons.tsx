import React from 'react';

export const PlayIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.745 1.295 2.541 0 3.286L7.279 20.99c-1.25.718-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
);

export const PauseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 00-.75.75v12a.75.75 0 00.75.75h2.25a.75.75 0 00.75-.75V6a.75.75 0 00-.75-.75H6.75zm8.25 0a.75.75 0 00-.75.75v12a.75.75 0 00.75.75h2.25a.75.75 0 00.75-.75V6a.75.75 0 00-.75-.75h-2.25z" clipRule="evenodd" />
    </svg>
);

export const MarkerIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M9.563 3.468a.75.75 0 01.75-.038l8.25 4.5a.75.75 0 010 1.34l-8.25 4.5a.75.75 0 01-1.06-.67V4.177a.75.75 0 01.31-.609zM4.5 19.5a.75.75 0 00.75-.75V6a.75.75 0 00-1.5 0v12.75c0 .414.336.75.75.75z" clipRule="evenodd" />
    </svg>
);

export const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-1.15.048-2.26.11-3.374.168a.75.75 0 00-.722.766v.94c0 .414.336.75.75.75h.393l.863 8.631a3.75 3.75 0 003.746 3.497h2.5c2.071 0 3.75-1.679 3.75-3.75L16.48 7.5h.393a.75.75 0 00.75-.75v-.94a.75.75 0 00-.722-.766c-1.114-.058-2.224-.12-3.374-.168v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 2.5a1.25 1.25 0 011.25 1.25v.443H8.75v-.443A1.25 1.25 0 0110 2.5zM8.5 7.5a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm3 0a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6z" clipRule="evenodd" />
    </svg>
);

export const ZoomInIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
    </svg>
);

export const ZoomOutIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
    </svg>
);

export const VolumeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.66 1.905H6.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 01-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
        <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
    </svg>
);

export const SettingsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M11.49 3.17a.75.75 0 01.447.898l-.458 1.832a.75.75 0 00.928.928l1.832-.458a.75.75 0 01.898.447l1.294 3.11a.75.75 0 01-.272.96l-1.548.929a.75.75 0 000 1.316l1.548.929a.75.75 0 01.272.96l-1.294 3.11a.75.75 0 01-.898.447l-1.832-.458a.75.75 0 00-.928.928l.458 1.832a.75.75 0 01-.447.898l-3.11 1.294a.75.75 0 01-.96-.272l-.929-1.548a.75.75 0 00-1.316 0l-.929 1.548a.75.75 0 01-.96.272l-3.11-1.294a.75.75 0 01-.447-.898l.458-1.832a.75.75 0 00-.928-.928l-1.832.458a.75.75 0 01-.898-.447l-1.294-3.11a.75.75 0 01.272-.96l1.548-.929a.75.75 0 000-1.316l-1.548-.929a.75.75 0 01-.272-.96l1.294-3.11a.75.75 0 01.898-.447l1.832.458a.75.75 0 00.928-.928l-.458-1.832a.75.75 0 01.447-.898l3.11-1.294a.75.75 0 01.96.272l.929 1.548a.75.75 0 001.316 0l.929-1.548a.75.75 0 01.96-.272l3.11 1.294zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);
