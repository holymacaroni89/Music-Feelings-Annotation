# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-22

### Hinzugefügt

- **IndexedDB-Integration für Waveform-Caching**: Waveforms werden jetzt in IndexedDB gespeichert und geladen
- **Vereinfachte Waveform-Logik**: Neuer Waveform-Manager ersetzt komplexe useEffect-Ketten
- **Automatische Waveform-Persistierung**: Neue Waveforms werden automatisch gespeichert
- **Performance-Optimierung**: Keine doppelten Waveform-Generierungen mehr

### Geändert

- **Waveform-Generierung**: Komplett neu geschrieben für bessere Performance und Stabilität
- **State-Verwaltung**: Vereinfachte useEffect-Struktur ohne komplexe Dependency-Ketten
- **Code-Struktur**: Saubere Trennung zwischen Audio-Loading und Waveform-Verarbeitung

### Entfernt

- **Alle Debug-Logs**: Console-Logs für sauberen Produktionscode entfernt
- **Komplexe useEffect-Ketten**: Durch einfachere, direktere Logik ersetzt
- **Redundante State-Updates**: Optimierte State-Verwaltung

### Behoben

- **Infinite Loop in Waveform-Generierung**: Durch neue Architektur gelöst
- **Doppelte Waveform-Generierung**: Durch Caching-System verhindert
- **Performance-Probleme**: Deutlich verbesserte Ladezeiten bei Lied-Wechseln

## [0.1.0] - 2025-01-21

### Hinzugefügt

- **Grundlegende Audio-Annotation**: Manuelle Marker-Erstellung mit 'M'-Taste
- **KI-Emotionsanalyse**: Google Gemini Integration für emotionale Hotspots
- **Genius API-Integration**: Song-Kontext und Lyrics-Abruf
- **TensorFlow.js Personalisierung**: Persönliches ML-Modell für bessere KI-Vorschläge
- **Multi-Profil-System**: Verschiedene Benutzerprofile mit eigenem KI-Modell
- **CSV-Import/Export**: Datenportabilität für externe Analyse
- **Sitzungspersistierung**: Automatisches Speichern im lokalen Browser-Speicher

### Technische Features

- **React 19 + TypeScript**: Moderne Frontend-Architektur
- **Web Audio API**: Erweiterte Audio-Verarbeitung und Visualisierung
- **TailwindCSS + shadcn/ui**: Moderne UI-Komponenten
- **Vite**: Schnelle Entwicklungsumgebung
