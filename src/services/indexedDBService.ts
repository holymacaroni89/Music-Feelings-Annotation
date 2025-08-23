import { GEMS } from "../types";

interface AudioFileData {
  name: string;
  size: number;
  lastModified: number;
  arrayBuffer: ArrayBuffer;
  duration: number;
  channels: number;
  sampleRate: number;
}

interface WaveformData {
  trackId: string;
  waveform: any[];
  timestamp: number;
  version: string;
}

interface AppState {
  currentTrackLocalId: string | null;
  trackMetadata: { [key: string]: any };
  markers: any[];
  profiles: any[];
  activeProfileId: string | null;
  geniusApiKey?: string;
  songContext: { [trackLocalId: string]: string };
  suggestions: { [trackLocalId: string]: import("../types").MerSuggestion[] }; // Verwende den korrekten Typ aus types.ts
}

// Verwende den korrekten MerSuggestion Typ aus types.ts
type MerSuggestion = import("../types").MerSuggestion;

class IndexedDBService {
  private dbName = "music-emotion-annotation-v2";
  private version = 3; // Version erhöht für neuen AI-Suggestions Store
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error("Fehler beim Öffnen der Datenbank:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log(
          `🔄 [IndexedDB] DB-Upgrade erforderlich: Version ${this.version}`
        );
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        console.log(
          `📈 [IndexedDB] Upgrade von Version ${oldVersion} auf ${this.version}`
        );

        // Audio Files Store
        if (!db.objectStoreNames.contains("audioFiles")) {
          const audioStore = db.createObjectStore("audioFiles", {
            keyPath: "name",
          });
          audioStore.createIndex("lastModified", "lastModified", {
            unique: false,
          });
        }

        // App State Store
        if (!db.objectStoreNames.contains("appState")) {
          const stateStore = db.createObjectStore("appState", {
            keyPath: "id",
          });
        }

        // Waveform Store
        if (!db.objectStoreNames.contains("waveforms")) {
          const waveformStore = db.createObjectStore("waveforms", {
            keyPath: "trackId",
          });
          waveformStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }

        // AI Suggestions Store
        if (!db.objectStoreNames.contains("aiSuggestions")) {
          const suggestionsStore = db.createObjectStore("aiSuggestions", {
            keyPath: "trackId",
          });
          suggestionsStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }
      };
    });
  }

  async saveAudioFile(audioData: AudioFileData): Promise<void> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["audioFiles"], "readwrite");
      const store = transaction.objectStore("audioFiles");

      const request = store.put(audioData);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error("Fehler beim Speichern der Audio-Datei:", request.error);
        reject(request.error);
      };
    });
  }

  async loadAudioFile(fileName: string): Promise<AudioFileData | null> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["audioFiles"], "readonly");
      const store = transaction.objectStore("audioFiles");

      const request = store.get(fileName);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error("Fehler beim Laden der Audio-Datei:", request.error);
        reject(request.error);
      };
    });
  }

  async saveAppState(state: AppState): Promise<void> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["appState"], "readwrite");
      const store = transaction.objectStore("appState");

      const request = store.put({ id: "main", ...state });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error("Fehler beim Speichern des App States:", request.error);
        reject(request.error);
      };
    });
  }

  async loadAppState(): Promise<AppState | null> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["appState"], "readonly");
      const store = transaction.objectStore("appState");

      const request = store.get("main");

      request.onsuccess = () => {
        if (request.result) {
          const { id, ...state } = request.result;
          resolve(state);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error(
          "❌ [IndexedDB] Fehler beim Laden des App States:",
          request.error
        );
        reject(request.error);
      };
    });
  }

  async clearAudioFiles(): Promise<void> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["audioFiles"], "readwrite");
      const store = transaction.objectStore("audioFiles");

      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error(
          "❌ [IndexedDB] Fehler beim Löschen der Audio-Dateien:",
          request.error
        );
        reject(request.error);
      };
    });
  }

  // Waveform-Persistierung
  async saveWaveform(trackId: string, waveform: any[]): Promise<void> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    const waveformData: WaveformData = {
      trackId,
      waveform,
      timestamp: Date.now(),
      version: "1.0",
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["waveforms"], "readwrite");
      const store = transaction.objectStore("waveforms");

      const request = store.put(waveformData);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error(
          "❌ [IndexedDB] Fehler beim Speichern der Waveform:",
          request.error
        );
        reject(request.error);
      };
    });
  }

  async loadWaveform(trackId: string): Promise<any[] | null> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["waveforms"], "readonly");
      const store = transaction.objectStore("waveforms");

      const request = store.get(trackId);

      request.onsuccess = () => {
        const waveformData = request.result;
        if (waveformData) {
          resolve(waveformData.waveform);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error(
          "❌ [IndexedDB] Fehler beim Laden der Waveform:",
          request.error
        );
        reject(request.error);
      };
    });
  }

  async hasWaveform(trackId: string): Promise<boolean> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["waveforms"], "readonly");
      const store = transaction.objectStore("waveforms");

      const request = store.count(trackId);

      request.onsuccess = () => {
        const hasWaveform = request.result > 0;

        resolve(hasWaveform);
      };

      request.onerror = () => {
        console.error(
          "❌ [IndexedDB] Fehler beim Waveform-Check:",
          request.error
        );
        reject(request.error);
      };
    });
  }

  async getDatabaseInfo(): Promise<{
    audioFiles: number;
    appStates: number;
    waveforms: number;
    aiSuggestions: number;
  }> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["audioFiles", "appState", "waveforms", "aiSuggestions"],
        "readonly"
      );

      const audioStore = transaction.objectStore("audioFiles");
      const stateStore = transaction.objectStore("appState");
      const waveformStore = transaction.objectStore("waveforms");
      const suggestionsStore = transaction.objectStore("aiSuggestions");

      const audioCount = audioStore.count();
      const stateCount = stateStore.count();
      const waveformCount = waveformStore.count();
      const suggestionsCount = suggestionsStore.count();

      Promise.all([
        new Promise<number>((res) => {
          audioCount.onsuccess = () => res(audioCount.result);
        }),
        new Promise<number>((res) => {
          stateCount.onsuccess = () => res(stateCount.result);
        }),
        new Promise<number>((res) => {
          waveformCount.onsuccess = () => res(waveformCount.result);
        }),
        new Promise<number>((res) => {
          suggestionsCount.onsuccess = () => res(suggestionsCount.result);
        }),
      ])
        .then(([audio, state, waveform, suggestions]) => {
          resolve({
            audioFiles: audio,
            appStates: state,
            waveforms: waveform,
            aiSuggestions: suggestions,
          });
        })
        .catch(reject);
    });
  }

  // Neue Methoden für AI-Suggestions
  async saveSuggestions(
    trackId: string,
    suggestions: MerSuggestion[]
  ): Promise<void> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["aiSuggestions"], "readwrite");
      const store = transaction.objectStore("aiSuggestions");

      const request = store.put({
        trackId,
        suggestions,
        timestamp: Date.now(),
        version: "1.0",
      });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error(
          "Fehler beim Speichern der AI-Suggestions:",
          request.error
        );
        reject(request.error);
      };
    });
  }

  async loadSuggestions(trackId: string): Promise<MerSuggestion[] | null> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["aiSuggestions"], "readonly");
      const store = transaction.objectStore("aiSuggestions");

      const request = store.get(trackId);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.suggestions);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error("Fehler beim Laden der AI-Suggestions:", request.error);
        reject(request.error);
      };
    });
  }

  async hasSuggestions(trackId: string): Promise<boolean> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["aiSuggestions"], "readonly");
      const store = transaction.objectStore("aiSuggestions");

      const request = store.get(trackId);

      request.onsuccess = () => {
        const hasSuggestions = !!request.result;
        resolve(hasSuggestions);
      };

      request.onerror = () => {
        console.error("Fehler beim Prüfen der AI-Suggestions:", request.error);
        reject(request.error);
      };
    });
  }

  async clearSuggestions(trackId?: string): Promise<void> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["aiSuggestions"], "readwrite");
      const store = transaction.objectStore("aiSuggestions");

      let request: IDBRequest;

      if (trackId) {
        // Lösche nur für einen bestimmten Track
        request = store.delete(trackId);
      } else {
        // Lösche alle AI-Suggestions
        request = store.clear();
      }

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error("Fehler beim Löschen der AI-Suggestions:", request.error);
        reject(request.error);
      };
    });
  }
}

// Singleton-Instanz
export const indexedDBService = new IndexedDBService();

// Fallback zu localStorage für kleine Daten
export const fallbackStorage = {
  saveAppState: (state: AppState): void => {
    try {
      localStorage.setItem(
        "music-emotion-annotation-state",
        JSON.stringify(state)
      );
    } catch (e) {
      console.error("Fehler beim Speichern in localStorage:", e);
    }
  },

  loadAppState: (): AppState | null => {
    try {
      const saved = localStorage.getItem("music-emotion-annotation-state");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Fehler beim Laden aus localStorage:", e);
    }
    return null;
  },
};
