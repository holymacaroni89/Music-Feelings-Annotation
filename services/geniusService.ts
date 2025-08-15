import { GeniusHit, GeniusSong } from '../types';

const API_BASE = 'https://api.genius.com';

/**
 * Searches the Genius API for a given query using a provided API key.
 * Uses a CORS proxy to bypass browser restrictions on client-side API calls.
 */
export const searchSongs = async (query: string, apiKey: string): Promise<GeniusSong[]> => {
    if (!apiKey) {
        console.error("Genius API Key was not provided.");
        // This will be caught and handled in the UI to prompt the user.
        throw new Error("Genius API Key is not configured.");
    }

    try {
        const searchUrl = `${API_BASE}/search?q=${encodeURIComponent(query)}`;
        // Switched to a more reliable CORS proxy. The new proxy expects the target URL to be encoded.
        const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(searchUrl)}`;

        const response = await fetch(proxiedUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Genius API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Map the raw API response to our simplified GeniusSong type
        return data.response.hits.map((hit: GeniusHit) => ({
            id: hit.result.id,
            url: hit.result.url,
            title: hit.result.title,
            artist: hit.result.primary_artist.name,
            thumbnailUrl: hit.result.song_art_image_thumbnail_url
        }));

    } catch (error) {
        console.error("Error searching Genius API:", error);
        // Re-throw to be handled by the caller
        throw error;
    }
};

/**
 * Fetches the lyrics for a given Genius song URL.
 * NOTE: This is a fragile web-scraping approach because the official Genius API does not provide lyrics.
 * It works by fetching the song page's HTML and parsing it. This can break if Genius changes its website structure.
 */
export const getLyrics = async (songPageUrl: string): Promise<string | null> => {
    try {
        // We must route this through the CORS proxy as well.
        const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(songPageUrl)}`;
        const response = await fetch(proxiedUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch song page with status ${response.status}`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Genius wraps lyrics in containers with this data attribute.
        // We find all of them and join their content.
        const lyricNodes = doc.querySelectorAll('div[data-lyrics-container="true"]');
        if (lyricNodes.length === 0) {
            console.warn("Could not find lyrics container on Genius page.");
            return null;
        }

        let lyricsText = '';
        lyricNodes.forEach(node => {
            // A more robust way to get text content while preserving line breaks from <br> tags.
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = node.innerHTML.replace(/<br\s*\/?>/gi, '\n'); 
            lyricsText += tempDiv.textContent || '';
        });

        return lyricsText.trim();

    } catch (error) {
        console.error("Error fetching or parsing lyrics:", error);
        return null;
    }
};