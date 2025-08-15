import { GeniusHit, GeniusSong, GeniusSongDetails } from '../types';

const API_BASE = 'https://api.genius.com';

// Use a more reliable CORS proxy
const PROXY_URL = 'https://corsproxy.io/?';

interface GeniusReferent {
  _type: 'referent';
  fragment: string;
  annotations: {
    body: {
      dom: any; // The DOM structure is complex, using 'any' for simplicity
    };
  }[];
}

/**
 * Recursively extracts plain text from the Genius annotation's DOM structure.
 */
const extractTextFromDom = (node: any): string => {
    if (typeof node === 'string') {
        return node;
    }
    if (node && node.children) {
        return node.children.map(extractTextFromDom).join('');
    }
    return '';
};


/**
 * Fetches all line-by-line annotations (referents) for a given song ID.
 */
const getReferents = async (songId: number, apiKey: string): Promise<{ data: GeniusReferent[], raw: any }> => {
    try {
        const referentsUrl = `${API_BASE}/referents?song_id=${songId}`;
        const proxiedUrl = `${PROXY_URL}${encodeURIComponent(referentsUrl)}`;

        const response = await fetch(proxiedUrl, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) {
            throw new Error(`Genius referents request failed with status ${response.status}`);
        }
        
        const rawData = await response.json();
        return { data: rawData.response.referents, raw: rawData };

    } catch (error) {
        console.error(`Error fetching referents for song ID ${songId}:`, error);
        return { data: [], raw: { error: error instanceof Error ? error.message : String(error) } };
    }
}


/**
 * Searches the Genius API for a given query using a provided API key.
 * Uses a CORS proxy to bypass browser restrictions on client-side API calls.
 */
export const searchSongs = async (query: string, apiKey: string): Promise<GeniusSong[]> => {
    if (!apiKey) {
        console.error("Genius API Key was not provided.");
        throw new Error("Genius API Key is not configured.");
    }

    try {
        const searchUrl = `${API_BASE}/search?q=${encodeURIComponent(query)}`;
        const proxiedUrl = `${PROXY_URL}${encodeURIComponent(searchUrl)}`;

        const response = await fetch(proxiedUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Genius API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.response.hits.map((hit: GeniusHit) => ({
            id: hit.result.id,
            url: hit.result.url,
            title: hit.result.title,
            artist: hit.result.primary_artist.name,
            thumbnailUrl: hit.result.song_art_image_thumbnail_url
        }));

    } catch (error) {
        console.error("Error searching Genius API:", error);
        throw error;
    }
};

/**
 * Fetches the lyrics for a given Genius song URL by scraping the page with a robust DOM traversal method.
 */
export const getLyrics = async (songPageUrl: string): Promise<string | null> => {
    try {
        const proxiedUrl = `${PROXY_URL}${encodeURIComponent(songPageUrl)}`;
        const response = await fetch(proxiedUrl);
        if (!response.ok) throw new Error(`Failed to fetch song page with status ${response.status}`);
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const container = doc.querySelector('div[data-lyrics-container="true"]');
        if (!container) return null;

        let lyrics = '';
        const processNode = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                lyrics += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.tagName.toLowerCase() === 'br') {
                    lyrics += '\n';
                } else if (element.tagName.toLowerCase() === 'div') {
                    if (lyrics.length > 0 && !lyrics.endsWith('\n') && !lyrics.endsWith(' ')) {
                        lyrics += '\n';
                    }
                    element.childNodes.forEach(processNode);
                } else {
                    // For other tags like <a> or <i>, just process their children.
                    element.childNodes.forEach(processNode);
                }
            }
        };

        container.childNodes.forEach(processNode);
        
        // Final cleanup: remove leading/trailing whitespace and collapse multiple newlines.
        return lyrics.trim().replace(/\n{3,}/g, '\n\n');

    } catch (error) {
        console.error("Error fetching or parsing lyrics:", error);
        return null;
    }
};


/**
 * Fetches detailed information for a specific song ID from the Genius API.
 * This includes metadata, community annotations, and lyrics with line-by-line annotations merged in.
 */
export const getSongDetails = async (song: GeniusSong, apiKey: string): Promise<{ details: GeniusSongDetails; raw: { song: any; referents: any; } } | null> => {
    try {
        const songApiUrl = `${API_BASE}/songs/${song.id}`;
        const proxiedApiUrl = `${PROXY_URL}${encodeURIComponent(songApiUrl)}`;

        const songDetailsPromise = fetch(proxiedApiUrl, {
             headers: { 'Authorization': `Bearer ${apiKey}` }
        }).then(res => {
            if (!res.ok) throw new Error(`Genius song details request failed with status ${res.status}`);
            return res.json();
        });
        
        // Fetch lyrics and referents in parallel
        const lyricsPromise = getLyrics(song.url);
        const referentsPromise = getReferents(song.id, apiKey);
        
        const [detailsData, lyrics, { data: referents, raw: rawReferents }] = await Promise.all([songDetailsPromise, lyricsPromise, referentsPromise]);

        const songData = detailsData.response.song;
        const descriptionHtml = songData.description_annotation?.annotations[0]?.body?.html || null;
        
        let finalLyrics = lyrics;
        
        if (finalLyrics && referents && referents.length > 0) {
            const lyricsLines = finalLyrics.split('\n');
            const annotatedLyricsLines: string[] = [];
            let lastMatchedIndex = -1;

            const normalizeLine = (line: string) => line.trim().replace(/’/g, "'").toLowerCase();

            for (const ref of referents.sort((a,b) => a.fragment.length - b.fragment.length)) { // Process shorter fragments first
                const fragmentLines = ref.fragment.split('\n').map(normalizeLine).filter(Boolean);
                if (fragmentLines.length === 0) continue;

                let matchIndex = -1;

                for (let i = 0; i <= lyricsLines.length - fragmentLines.length; i++) {
                     if(i <= lastMatchedIndex) continue; // Avoid re-matching same lines

                     let isMatch = true;
                     for (let j = 0; j < fragmentLines.length; j++) {
                        if (normalizeLine(lyricsLines[i + j]) !== fragmentLines[j]) {
                            isMatch = false;
                            break;
                        }
                    }

                    if (isMatch) {
                        matchIndex = i + fragmentLines.length - 1; // Index of the last line of the match
                        break;
                    }
                }
                
                if (matchIndex !== -1) {
                    lastMatchedIndex = matchIndex;
                    const annotationText = extractTextFromDom(ref.annotations[0]?.body?.dom).trim().replace(/\s+/g, ' ');
                    if (annotationText) {
                       const originalLine = lyricsLines[matchIndex];
                       lyricsLines[matchIndex] = `${originalLine}\n> ANNOTATION: ${annotationText}`;
                    }
                }
            }
             finalLyrics = lyricsLines.join('\n');
        }

        const details: GeniusSongDetails = {
            ...song,
            album: songData.album?.name || null,
            releaseDate: songData.release_date_for_display || null,
            imageUrl: songData.song_art_image_url,
            descriptionHtml: descriptionHtml,
            lyrics: finalLyrics
        };
        
        return {
            details,
            raw: {
                song: detailsData,
                referents: rawReferents,
            }
        };

    } catch (error) {
        console.error(`Error getting details for song ID ${song.id}:`, error);
        return null;
    }
};