import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { XIcon, SearchIcon, SpinnerIcon } from "./icons";
import { GeniusSong, GeniusSongDetails } from "../types";
import { GeniusSearchState } from "../hooks/useAnnotationSystem";

interface GeniusSearchModalProps {
  initialQuery: string;
  geniusSearchState: GeniusSearchState;
  searchGenius: (query: string) => void;
  selectSong: (song: GeniusSong) => void;
  confirmSelection: (details: GeniusSongDetails) => {
    title: string;
    artist: string;
  };
  backToSearch: () => void;
  onTrackInfoUpdate: (metadata: { title: string; artist: string }) => void;
  onSwitchToManual: () => void;
  onViewRawJson: () => void;
  onClose: () => void;
}

const GeniusSearchModal: React.FC<GeniusSearchModalProps> = ({
  initialQuery,
  geniusSearchState,
  searchGenius,
  selectSong,
  confirmSelection,
  backToSearch,
  onTrackInfoUpdate,
  onSwitchToManual,
  onViewRawJson,
  onClose,
}) => {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGenius(query);
  };

  const handleConfirm = (details: GeniusSongDetails) => {
    const updatedMetadata = confirmSelection(details);
    onTrackInfoUpdate(updatedMetadata);
    onClose();
  };

  const renderContent = () => {
    const { status, results, detailedSong, error } = geniusSearchState;

    if (status === "fetchingDetails") {
      return (
        <div className="flex justify-center items-center h-full p-16">
          <SpinnerIcon />
        </div>
      );
    }

    if (status === "details" && detailedSong) {
      return (
        <div className="flex flex-col max-h-[70vh]">
          <div className="p-6 flex-grow overflow-y-auto">
            <div className="flex items-start gap-4">
              <img
                src={detailedSong.imageUrl}
                alt="Album art"
                className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-grow">
                <h4 className="text-2xl font-bold text-white">
                  {detailedSong.title}
                </h4>
                <p className="text-lg text-gray-300">{detailedSong.artist}</p>
                {detailedSong.album && (
                  <p className="text-sm text-gray-400 mt-1">
                    Album: {detailedSong.album}
                  </p>
                )}
                {detailedSong.releaseDate && (
                  <p className="text-sm text-gray-400">
                    Released: {detailedSong.releaseDate}
                  </p>
                )}
              </div>
            </div>

            {detailedSong.descriptionHtml && (
              <div className="mt-4">
                <h5 className="font-bold text-gray-200 mb-2 border-b border-gray-700 pb-1">
                  About "{detailedSong.title}"
                </h5>
                <div
                  className="prose prose-sm prose-invert text-gray-300 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: detailedSong.descriptionHtml,
                  }}
                />
              </div>
            )}

            {detailedSong.lyrics && (
              <div className="mt-4">
                <h5 className="font-bold text-gray-200 mb-2 border-b border-gray-700 pb-1">
                  Lyrics
                </h5>
                <p className="whitespace-pre-wrap text-gray-300 text-sm font-mono">
                  {detailedSong.lyrics}
                </p>
              </div>
            )}
            {!detailedSong.lyrics && (
              <p className="mt-4 text-gray-500">
                Lyrics could not be found for this song.
              </p>
            )}
          </div>
          <div className="bg-gray-700 px-6 py-4 flex justify-between items-center rounded-b-lg flex-shrink-0">
            <div className="flex gap-4">
              <Button
                onClick={backToSearch}
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300"
              >
                ← Back to Search Results
              </Button>
              <Button
                onClick={onViewRawJson}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-300"
              >
                View Raw JSON
              </Button>
            </div>
            <Button
              onClick={() => handleConfirm(detailedSong)}
              variant="primary"
              size="sm"
            >
              Use This Data for AI Analysis
            </Button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="p-6">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-grow bg-gray-700 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter song title and artist..."
              autoFocus
              disabled={status === "searching"}
            />
            <Button
              type="submit"
              variant="primary"
              size="icon"
              disabled={status === "searching"}
            >
              {status === "searching" ? <SpinnerIcon /> : <SearchIcon />}
            </Button>
          </form>

          <div className="h-64 overflow-y-auto pr-2">
            {status === "searching" && (
              <div className="flex justify-center items-center h-full pt-8">
                <SpinnerIcon />
              </div>
            )}
            {status === "results" && results.length === 0 && (
              <div className="text-center text-gray-500 pt-8">
                No results found. Try a different search query.
              </div>
            )}
            {status === "error" && (
              <div className="text-center text-red-400 pt-8">{error}</div>
            )}
            {status === "results" && results.length > 0 && (
              <ul className="space-y-2">
                {results.map((song) => (
                  <li
                    key={song.id}
                    onClick={() => selectSong(song)}
                    className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <img
                      src={song.thumbnailUrl}
                      alt="Album art"
                      className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-gray-600"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjNEI1NTYzIi8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMjQgMjhWMjAiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHA+YXRoIGQ9Ik0yMCAyNEwyOCAyNCIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K";
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">
                        {song.title}
                      </p>
                      <p className="text-gray-400 text-sm truncate">
                        {song.artist}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="bg-gray-700 px-6 py-4 flex justify-between items-center rounded-b-lg">
          <button
            onClick={onSwitchToManual}
            className="text-sm text-blue-400 hover:underline"
          >
            Enter Context Manually
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="flex justify-between items-start p-6 pb-0 mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-100">
            Find Song Info on Genius
          </h3>
          <p className="text-sm text-gray-400 max-w-md">
            Accurate metadata and lyrics provide crucial context for the AI
            analysis.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <XIcon />
        </button>
      </div>
      {renderContent()}
    </>
  );
};

export default GeniusSearchModal;
