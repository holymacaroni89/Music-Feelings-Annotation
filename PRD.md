# **Product Requirements Document (PRD)**

## **Music Emotion Annotation Tool - Forschungsprojekt & App-Entwicklung**

---

## **1. Ziel und Kontext**

### **Projektvision**

Das Music Emotion Annotation Tool ist ein Forschungsprojekt, das KI beibringt, subjektive Gefühle in Musik zu erkennen und zu visualisieren. Das ultimative Ziel ist es, neurodivergenter Kinder dabei zu helfen, ihre intensiven emotionalen Reaktionen auf Musik zu verstehen und zu regulieren.

### **Duale Zielsetzung**

- **Forschungsziel**: Entwicklung einer KI, die subjektive emotionale Reaktionen auf Musik lernt
- **App-Entwicklung**: Erstellung einer benutzerfreundlichen, performanten Webanwendung
- **Therapeutisches Potenzial**: Grundlage für assistive Technologien bei neurodivergenter Kinder

### **Zielnutzer**

- **Primär**: Forscher im Bereich Music Emotion Recognition (MER) und Neurodiversität
- **Sekundär**: Therapeuten und Pädagogen, die mit neurodivergenter Kinder arbeiten
- **Tertiär**: Entwickler von assistiven Technologien und Musik-Apps

---

## **2. Problemstellung**

### **Kernproblem**

Neurodivergente Kinder erleben Gefühle oft intensiver, können sie aber schlechter einordnen, benennen und regulieren. Musik löst bei ihnen starke emotionale Reaktionen aus, die sie überwältigen können. Gleichzeitig fehlen benutzerfreundliche Tools für die systematische Erforschung dieser Zusammenhänge.

### **Warum ist das wichtig?**

- **Emotionale Regulation**: 70% der neurodivergenter Kinder haben Schwierigkeiten mit Gefühlsregulation
- **Musik als Brücke**: Musik ist ein universeller emotionaler Kanal
- **Visuelle Unterstützung**: Konkrete Visualisierungen helfen bei der Gefühlserkennung
- **Therapeutischer Nutzen**: Grundlage für neue Behandlungsansätze
- **Forschungseffizienz**: Aktuelle Tools sind ineffizient und nicht benutzerfreundlich

---

## **3. Ziele & Erfolgskriterien**

### **Forschungsziele**

1. **KI-Lernen**: Die KI lernt subjektive emotionale Muster aus individuellen Annotationen
2. **Visualisierungsqualität**: Gefühle werden so dargestellt, dass Kinder sie verstehen können
3. **Personalisierung**: Jedes Kind bekommt ein auf seine Wahrnehmung abgestimmtes Modell
4. **Wissenschaftliche Validierung**: Publikationsreife Ergebnisse in MER-Forschung

### **App-Entwicklungsziele**

1. **Benutzerfreundlichkeit**: Intuitive Bedienung für Forscher und Therapeuten
2. **Performance**: Schnelle Verarbeitung großer Audiodateien
3. **Skalierbarkeit**: Unterstützung für umfangreiche Forschungsstudien
4. **Code-Qualität**: Wartbarer, modularer Code für zukünftige Erweiterungen

### **Erfolgskriterien**

- **KI-Genauigkeit**: 85% Übereinstimmung zwischen KI-Vorhersage und tatsächlichen Gefühlen
- **Visualisierungsverständnis**: 90% der Kinder können ihre Gefühle korrekt zuordnen
- **App-Performance**: Ladezeit < 3s, Audio-Dekodierung < 5s ✅
- **Code-Qualität**: 25% Code-Reduktion, modulare Architektur ✅
- **Forschungsoutput**: Mindestens 2 wissenschaftliche Publikationen
- **Timeline-Performance**: 60fps bei 1000+ Markern ✅
- **Audio-Features**: 5+ Audio-Feature-Tracks implementiert ✅

---

## **4. Funktionale Anforderungen**

### **Core Features (MVP) ✅ ABGESCHLOSSEN**

```
US-001: Als Forscher möchte ich Audiodateien laden können ✅
- Akzeptiert MP3, WAV, FLAC (bis 100MB)
- Automatische Metadaten-Extraktion
- Wellenform-Visualisierung
- Audio-Caching (IndexedDB)

US-002: Als Nutzer möchte ich KI-gestützte Emotionsanalyse ✅
- Google Gemini Integration
- Automatische Hotspot-Erkennung
- Kontextuelle Vorschläge (GEMS-Kategorien)
- AI-Fehlerbehandlung & Marker-Erhaltung

US-003: Als Nutzer möchte ich manuelle Marker erstellen ✅
- Tastatur-Shortcuts (M-Taste)
- Drag & Drop Timeline-Interaktion
- Valence/Arousal/Intensity-Slider
- Emoji-basierte Marker mit emotionaler Kontextualisierung

US-004: Als Nutzer möchte ich Profile verwalten ✅
- Multi-User-Support
- Personalisiertes KI-Training
- TensorFlow.js-Integration
```

### **Forschungs-Features (Phase 2) 🔄 LAUFEND - 85% ABGESCHLOSSEN**

```
US-005: Als Forscher möchte ich subjektive emotionale Annotationen sammeln ✅
- Individuelle Valence/Arousal-Bewertungen
- GEMS-Kategorien für spezifische Emotionen
- Freitext-Beschreibungen emotionaler Reaktionen
- Emoji-basierte Marker mit emotionaler Kontextualisierung

US-006: Als Forscher möchte ich KI-Modelle personalisieren ✅
- TensorFlow.js-Integration für lokales Training
- Individuelle Profile für verschiedene Wahrnehmungsmuster
- Transfer-Learning zwischen ähnlichen Profilen

US-007: Als Forscher möchte ich emotionale Visualisierungen erstellen ✅
- Farbkodierte Timeline-Ansichten (GEMS-Farben)
- Emotionale "Hotspots" identifizieren
- Kindgerechte Darstellung von Gefühlen (Emoji-Marker)
- Mehrspurige Timeline mit 5 Audio-Feature-Tracks

US-008: Als Forscher möchte ich Daten für Studien exportieren ✅
- Anonymisierte Forschungsdaten
- Statistische Analysen
- Vergleich zwischen neurotypischen und neurodivergenten Mustern
```

### **Advanced Features (Phase 3) 📋 GEPLANT**

```
US-009: Als Nutzer möchte ich Genius-Integration
- Song-Metadaten-Suche
- Lyrics-Integration
- Community-Anmerkungen

US-010: Als Nutzer möchte ich erweiterte Visualisierungen ✅ (Teilweise implementiert)
- Mehrspurige Timeline ✅ (5 Tracks implementiert)
- Tooltip-Erweiterungen ✅ (T-003.1 abgeschlossen)
- Struktur-Overlays 📋 (Segmentierung-Erkennung geplant)

US-011: Als Therapeut möchte ich kindgerechte Visualisierungen ✅ (Teilweise implementiert)
- Einfache Farb- und Formsprache ✅ (GEMS-Farben, Emoji-Marker)
- Emotionale "Hotspots" identifizieren ✅
- Interaktive Gefühls-Exploration ✅ (Timeline-Interaktion)
```

---

## **5. Nicht funktionale Anforderungen**

### **Forschungsqualität**

- **Datenintegrität**: Vollständige Audit-Trails für alle Annotationen
- **Reproduzierbarkeit**: Alle Experimente sind vollständig dokumentiert
- **Ethik**: DSGVO-konforme, anonymisierte Datenspeicherung
- **Validierung**: Peer-Review der Forschungsmethoden

### **App-Performance**

- **Ladezeit**: < 3 Sekunden für 10MB Audio
- **Responsivität**: < 100ms für UI-Interaktionen
- **Skalierung**: Unterstützt bis zu 1000 Marker pro Song
- **Bundle-Größe**: Optimierte Chunks für bessere Performance

### **Code-Qualität**

- **Architektur**: Modulare, wartbare Struktur
- **TypeScript**: Strict Mode, vollständige Typisierung
- **Testing**: Unit-Tests für kritische Funktionen
- **Dokumentation**: Umfassende Entwickler-Dokumentation

### **Usability**

- **Lernkurve**: Neue Nutzer können in < 10 Minuten annotieren
- **Accessibility**: WCAG 2.1 AA Compliance
- **Responsive Design**: Funktioniert auf Desktop, Tablet, Mobile

---

## **6. Abgrenzung (Out-of-Scope)**

### **Was wird NICHT abgedeilt:**

- **Klinische Anwendungen**: Keine medizinische Diagnose oder Behandlung
- **Kinder-Direktnutzung**: Fokus liegt auf Forschung, nicht auf Endnutzern
- **Kommerzialisierung**: Keine Produktentwicklung für den Markt
- **Therapie-Apps**: Keine vollständigen therapeutischen Systeme
- **Cloud-Services**: Alle Daten bleiben lokal für Datenschutz
- **Mobile Apps**: Nur Web-basiert für Plattformunabhängigkeit

---

## **7. Abhängigkeiten & Risiken**

### **Forschungsabhängigkeiten**

- **Ethik-Kommission**: Genehmigung für Studien mit Kindern
- **Datenschutz**: DSGVO-Compliance für sensible Daten
- **Fachkräfte**: Kooperation mit Therapeuten und Pädagogen
- **Studienteilnehmer**: Rekrutierung neurodivergenter Kinder

### **Technische Abhängigkeiten**

- **Google Gemini API**: Kosten und Rate-Limits
- **Genius API**: CORS-Probleme, externe Verfügbarkeit
- **TensorFlow.js**: Browser-Kompatibilität
- **Web Audio API**: Browser-Support

### **Risiken & Mitigation**

| Risiko                     | Wahrscheinlichkeit | Auswirkung | Mitigation                          |
| -------------------------- | ------------------ | ---------- | ----------------------------------- |
| Datenschutz-Verstöße       | Hoch               | Kritisch   | Lokale Verarbeitung, Anonymisierung |
| KI-Bias                    | Mittel             | Hoch       | Diverse Trainingsdaten, Bias-Tests  |
| Therapeutische Wirksamkeit | Hoch               | Kritisch   | Pilotstudien, Expert-Reviews        |
| Forschungsvalidität        | Mittel             | Hoch       | Peer-Review, Methoden-Validierung   |
| Gemini API-Kosten          | Hoch               | Mittel     | Kosten-Monitoring, Fallback-Modi    |
| Browser-Kompatibilität     | Mittel             | Hoch       | Progressive Enhancement, Polyfills  |

---

## **8. Release-Plan & Meilensteine**

### **Phase 1: MVP & Grundlagen (Q1 2024) ✅ ABGESCHLOSSEN**

- ✅ Core Audio-Funktionalität
- ✅ Basis-UI mit Tailwind/shadcn
- ✅ KI-Integration (Gemini)
- ✅ Marker-Erstellung
- ✅ Code-Konsolidierung (25% Reduktion)
- ✅ Bundle-Optimierung

### **Phase 2: Forschungsvalidierung & App-Verbesserung (Q4 2024) 🔄 LAUFEND - 85% ABGESCHLOSSEN**

- ✅ Mehrspurige Timeline (5 Tracks implementiert)
- ✅ Emotionale Hotspot-Visualisierung (GEMS-Farben, Emoji-Marker, Tooltips)
- ✅ Erweiterte Audio-Features (Vocal-Presence, Onset-Detection, Harmonic-Complexity)
- ✅ Audio-Caching (IndexedDB-basiert)
- ✅ AI-Fehlerbehandlung & Marker-Erhaltung
- 🔄 Tooltip-Erweiterungen (T-003.1 abgeschlossen, T-003.2 in Bearbeitung)
- 📋 Performance-Optimierung (Lazy Loading, Web Workers)
- 📋 Responsive Design (Touch-Gesten, Mobile-Optimierung)

### **Phase 3: Advanced Features & Therapeutische Anwendung (Q1 2025) 📋 GEPLANT**

- 📋 Genius-Integration
- 📋 Erweiterte KI-Features
- 📋 Kindgerechte UI-Designs
- 📋 Therapeuten-Dashboard
- 📋 Fortschritts-Tracking
- 📋 Ethik-Kommission-Antrag

### **Phase 4: Forschungsabschluss & Produktionsreife (Q2 2025) 📋 GEPLANT**

- 📋 Vollständige Studien
- 📋 Wissenschaftliche Publikationen
- 📋 Therapeutische Validierung
- 📋 Performance-Tuning
- 📋 Security-Audit
- 📋 Forschungsbericht

---

## **9. Zusammenfassung**

Das Music Emotion Annotation Tool ist ein Forschungsprojekt, das KI beibringt, subjektive Gefühle in Musik zu erkennen. Das ultimative Ziel ist es, neurodivergenter Kinder dabei zu helfen, ihre intensiven emotionalen Reaktionen zu verstehen und zu regulieren.

**Forschungsfokus:**

- 🧠 **KI-Lernen** subjektiver emotionaler Muster
- 🎨 **Visualisierung** von Gefühlen für Kinder
- 👤 **Personalisierung** für individuelle Wahrnehmung
- 🔬 **Wissenschaftliche Validierung** der Methoden

**App-Entwicklung:**

- 🚀 **Performance**: Schnelle, responsive Benutzeroberfläche
- 🏗️ **Architektur**: Modulare, wartbare Codebasis
- 📱 **Usability**: Intuitive Bedienung für Forscher
- 🔧 **Code-Qualität**: 25% Reduktion, optimierte Bundles

**Therapeutisches Potenzial:**

- Unterstützung bei Gefühlsregulation
- Musik als therapeutisches Medium
- Grundlage für neue Behandlungsansätze
- Empowerment neurodivergenter Kinder

---

## **🔧 Iterative Verbesserungsvorschläge**

### **1. Forschungsvalidierung**

- **Pilotstudien** mit kleinen Gruppen neurodivergenter Kinder
- **Expert-Reviews** von Therapeuten und Pädagogen
- **Methoden-Validierung** durch Peer-Review

### **2. App-Entwicklung**

- **Performance-Monitoring** mit echten Nutzern
- **Code-Reviews** für Qualitätssicherung
- **Bundle-Analyse** für weitere Optimierungen

### **3. Therapeutische Integration**

- **Kooperationen** mit Therapiezentren
- **Ethik-Anträge** für Studien mit Kindern
- **Eltern-Feedback** zu Visualisierungen

### **4. Wissenschaftliche Qualität**

- **Publikationen** in MER- und Neurodiversitäts-Journalen
- **Konferenzbeiträge** für internationale Sichtbarkeit
- **Open Science** für Reproduzierbarkeit

### **5. Langzeitentwicklung**

- **Langzeitstudien** zur therapeutischen Wirksamkeit
- **Vergleichsstudien** zwischen verschiedenen Gruppen
- **Technologie-Transfer** zu therapeutischen Anwendungen

**Nächster Schritt**: T-003.2 (Erweiterte KI-Analyse mit musikalischem Kontext) implementieren, um die Tooltip-Erweiterungen abzuschließen. Anschließend Fokus auf Performance-Optimierung (Lazy Loading, Web Workers) und Responsive Design (Touch-Gesten, Mobile-Optimierung).
