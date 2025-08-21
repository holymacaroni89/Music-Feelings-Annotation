interface AudioFileData {
  name: string;
  size: number;
  lastModified: number;
  arrayBuffer: ArrayBuffer;
  duration: number;
  channels: number;
  sampleRate: number;
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
  private dbName = "music-emotion-annotation";
  private version = 1;
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
        console.log("✅ [IndexedDB] Datenbank erfolgreich geöffnet");
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
          console.log("✅ [IndexedDB] Audio Files Store erstellt");
        }

        // App State Store
        if (!db.objectStoreNames.contains("appState")) {
          const stateStore = db.createObjectStore("appState", {
            keyPath: "id",
          });
          console.log("✅ [IndexedDB] App State Store erstellt");
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
        console.log("✅ [IndexedDB] Audio-Datei gespeichert:", audioData.name);
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
          console.log("✅ [IndexedDB] Audio-Datei geladen:", fileName);
          resolve(request.result);
        } else {
          console.log("🔍 [IndexedDB] Audio-Datei nicht gefunden:", fileName);
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
        console.log("✅ [IndexedDB] App State gespeichert");
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
          console.log("✅ [IndexedDB] App State geladen");
          const { id, ...state } = request.result;
          resolve(state);
        } else {
          console.log("🔍 [IndexedDB] App State nicht gefunden");
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
        console.log("✅ [IndexedDB] Alle Audio-Dateien gelöscht");
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
      console.log("✅ [Fallback] App State in localStorage gespeichert");
    } catch (e) {
      console.error("❌ [Fallback] Fehler beim Speichern in localStorage:", e);
    }
  },

  loadAppState: (): AppState | null => {
    try {
      const saved = localStorage.getItem("music-emotion-annotation-state");
      if (saved) {
        console.log("✅ [Fallback] App State aus localStorage geladen");
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("❌ [Fallback] Fehler beim Laden aus localStorage:", e);
    }
    return null;
  },
};
