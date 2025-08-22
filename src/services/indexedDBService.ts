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
}

class IndexedDBService {
  private dbName = "music-emotion-annotation-v2";
  private version = 2; // Version erhöht für neuen waveforms Store
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error(
          "❌ [IndexedDB] Fehler beim Öffnen der Datenbank:",
          request.error
        );
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;

        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

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
        console.error(
          "❌ [IndexedDB] Fehler beim Speichern der Audio-Datei:",
          request.error
        );
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
        console.error(
          "❌ [IndexedDB] Fehler beim Laden der Audio-Datei:",
          request.error
        );
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
        console.error(
          "❌ [IndexedDB] Fehler beim Speichern des App States:",
          request.error
        );
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
    audioFilesCount: number;
    totalSize: number;
  }> {
    if (!this.db) {
      throw new Error("IndexedDB nicht initialisiert");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["audioFiles"], "readonly");
      const store = transaction.objectStore("audioFiles");

      const request = store.getAll();

      request.onsuccess = () => {
        const audioFiles = request.result;
        const totalSize = audioFiles.reduce((sum, file) => sum + file.size, 0);

        resolve({
          audioFilesCount: audioFiles.length,
          totalSize,
        });
      };

      request.onerror = () => {
        console.error(
          "❌ [IndexedDB] Fehler beim Abrufen der Datenbank-Info:",
          request.error
        );
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
      console.error("❌ [Fallback] Fehler beim Speichern in localStorage:", e);
    }
  },

  loadAppState: (): AppState | null => {
    try {
      const saved = localStorage.getItem("music-emotion-annotation-state");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("❌ [Fallback] Fehler beim Laden aus localStorage:", e);
    }
    return null;
  },
};
