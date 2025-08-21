/**
 * Parse a filename to extract title and artist information
 * Uses heuristics to determine the most likely title/artist combination
 */
export const cleanFileName = (
  fileName: string
): { title: string; artist: string } => {
  // Remove extension
  let baseName = fileName.split(".").slice(0, -1).join(".");

  // Common separators: -, –, —
  const parts = baseName.split(/ - | – | — /);

  if (parts.length > 1) {
    // Try to detect which part is the artist vs title
    // Common patterns: "Artist - Title" or "Title - Artist"
    // Heuristic: if first part looks like a song title (common words), swap them
    const firstPart = parts[0].trim().toLowerCase();
    const secondPart = parts.slice(1).join(" ").trim().toLowerCase();

    // Common song title indicators (not exhaustive, but covers many cases)
    const titleIndicators = [
      "love",
      "heart",
      "time",
      "night",
      "day",
      "life",
      "world",
      "home",
      "away",
      "back",
      "again",
      "never",
      "always",
      "forever",
      "tonight",
      "yesterday",
      "tomorrow",
      "sunrise",
      "sunset",
      "morning",
      "evening",
    ];

    const firstHasTitleWords = titleIndicators.some((word) =>
      firstPart.includes(word)
    );
    const secondHasTitleWords = titleIndicators.some((word) =>
      secondPart.includes(word)
    );

    // If first part has title words but second doesn't, assume "Title - Artist" format
    if (firstHasTitleWords && !secondHasTitleWords) {
      return {
        title: parts[0].trim(),
        artist: parts.slice(1).join(" ").trim(),
      };
    }

    // Default to "Artist - Title" format
    return { artist: parts[0].trim(), title: parts.slice(1).join(" ").trim() };
  }

  return { title: baseName, artist: "Unknown Artist" };
};
