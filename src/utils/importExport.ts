import { exportToCsv, importFromCsv } from "../services/csvService";
import { Marker, TrackInfo } from "../types";

export const handleExport = (
  markers: Marker[],
  trackInfo: TrackInfo | null
) => {
  if (markers.length === 0) {
    alert("No markers to export.");
    return;
  }

  const csvString = exportToCsv(markers);
  const blob = new Blob([`\uFEFF${csvString}`], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${trackInfo?.title || "markers"}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const handleImport = (
  file: File,
  trackInfo: TrackInfo | null,
  onMarkersImported: (markers: Marker[]) => void,
  onWarnings: (warnings: string[]) => void
) => {
  if (!trackInfo) {
    alert("Please load an audio track before importing markers.");
    return;
  }

  if (!confirm("This will replace all current markers. Are you sure?")) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const { markers: importedMarkers, warnings: importWarnings } =
      importFromCsv(event.target?.result as string);

    if (
      importedMarkers.length > 0 &&
      importedMarkers[0].trackLocalId !== trackInfo.localId
    ) {
      importWarnings.unshift(
        "Warning: Imported markers seem to be for a different file."
      );
    }

    const sortedMarkers = importedMarkers.sort(
      (a, b) => a.t_start_s - b.t_start_s
    );
    onMarkersImported(sortedMarkers);
    onWarnings(importWarnings);
  };

  reader.readAsText(file);
};
