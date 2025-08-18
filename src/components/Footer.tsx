import React from "react";
import { Button } from "@/components/ui/button";
import { Marker } from "../types";

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
    <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-1 sm:p-2 bg-gray-900 border-t border-gray-800 flex-shrink-0 shadow-lg gap-1 sm:gap-2">
      {/* Status - Zentriert auf Mobile */}
      <div className="flex justify-center sm:justify-start">
        <span
          className={`text-xs sm:text-sm text-gray-400 transition-all duration-500 ${
            isDirty ? "opacity-100 text-accent-400" : "opacity-0"
          }`}
        >
          {isDirty ? "💾 Saving changes..." : "All changes saved"}
        </span>
      </div>

      {/* Buttons - Gestapelt auf Mobile */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4">
        <Button
          onClick={() => importInputRef.current?.click()}
          variant="secondary"
          className="font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 transition-all duration-200 w-full sm:w-auto text-sm"
        >
          Import CSV
        </Button>
        <input
          type="file"
          ref={importInputRef}
          onChange={onImport}
          accept=".csv,text/csv"
          className="hidden"
        />
        <Button
          onClick={onExport}
          variant="default"
          className="bg-success-600 hover:bg-success-700 text-success-50 font-bold shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto text-sm"
          disabled={markers.length === 0}
        >
          Export CSV
        </Button>
      </div>
    </footer>
  );
};

export default Footer;
