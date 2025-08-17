import React from 'react';
import { Button } from '@/components/ui/button';
import { Marker } from '../types';

interface FooterProps {
    isDirty: boolean;
    importInputRef: React.RefObject<HTMLInputElement>;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => void;
    markers: Marker[];
}

const Footer: React.FC<FooterProps> = ({
    isDirty,
    importInputRef,
    onImport,
    onExport,
    markers,
}) => {
    return (
        <footer className="flex items-center justify-between p-2 bg-gray-800 border-t border-gray-700 flex-shrink-0">
            <span className={`text-sm text-gray-500 transition-opacity duration-500 ${isDirty ? 'opacity-100' : 'opacity-0'}`}>Saving changes...</span>
            <div className="flex items-center gap-4">
                <Button onClick={() => importInputRef.current?.click()} className="bg-gray-600 hover:bg-gray-500 text-white font-bold">
                    Import CSV
                </Button>
                <input type="file" ref={importInputRef} onChange={onImport} accept=".csv,text/csv" className="hidden" />
                <Button onClick={onExport} className="bg-green-600 hover:bg-green-500 text-white font-bold" disabled={markers.length === 0}>
                    Export CSV
                </Button>
            </div>
        </footer>
    );
};

export default Footer;
