# Touch-Gesten Test-Checkliste

Diese Checkliste hilft beim manuellen Testen der Touch-Funktionalität auf mobilen Geräten oder Emulatoren.

## 🎯 Phase 7: Mobile UX Modernisierung (NEU!)

### Neue Features (2025-01-18)

1. **Header-Layout kompakter** - 3-Zeilen-Struktur, Card-Design
2. **Profile-Dropdown modernisiert** - Touch-Modal mit Avatars
3. **Button-Hierarchie verbessert** - Primary/Secondary/Tertiary
4. **Bottom Navigation hinzugefügt** - Mobile-optimierte Controls
5. **Gesture-Support implementiert** - Swipe, Long Press, Pull-to-Refresh

## Implementierte Touch-Features

### Timeline Touch-Unterstützung

- **Scrubbing**: Finger auf Timeline → Audio-Position folgt
- **Marker-Drag**: Marker-Kanten ziehen → Start/End-Zeit ändern
- **Marker-Body-Drag**: Marker-Mitte ziehen → gesamten Marker verschieben
- **Suggestion-Tap**: Gelbe Rauten antippen → Marker erstellen
- **Touch-Hitboxen**: 24px (optimiert für Touch, Apple-Guideline-konform)
- **🆕 Swipe Left/Right**: Zwischen Markern navigieren
- **🆕 Long Press**: Marker auswählen + Haptic Feedback
- **🆕 Touch vs Drag**: Intelligente Unterscheidung (8px Threshold)

### Responsive Layout-Anpassungen

- **LabelPanel**: Auf Mobile nur als Modal (kein statisches Panel)
- **Timeline-Höhen**: h-20 (XS) → h-24 (SM) → h-32 (MD) → h-40 (LG) → h-48 (XL)
- **Tooltip-Clamping**: Tooltips bleiben im Viewport (links/rechts/zentriert)
- **🆕 Header-Kompaktierung**: 3-Zeilen-Struktur, Card-Design
- **🆕 Bottom Navigation**: Mobile-only Controls (Play, Marker, Zoom, Settings)
- **🆕 Profile Selector**: Touch-Modal statt Dropdown
- **🆕 Button-Hierarchie**: Primary/Secondary/Tertiary Variants
- **🆕 Pull-to-Refresh**: Header Pull-Down für Audio neu laden
- **MarkerList**: Kompakte Zeit-Formate auf XS

## Test-Szenarien

### 🆕 0. Phase 7 Features (Priorität: HOCH)

#### Header-Layout & Profile Selector

- [ ] **Desktop (lg+)**: 3-Zeilen-Struktur, Audio Controls sichtbar
- [ ] **Mobile (< lg)**: 2-Zeilen-Struktur, Audio Controls versteckt
- [ ] **Profile Tap**: Modal öffnet sich mit Avatar-Liste
- [ ] **Profile Auswahl**: Checkmark, Modal schließt, Profil wechselt
- [ ] **Add New Profile**: Button funktional, Input Modal
- [ ] **Training Points**: Separate Card, Refine Button bei >= 5 Samples

#### Bottom Navigation (Mobile Only)

- [ ] **Visibility**: Nur auf Mobile sichtbar, nur wenn Track geladen
- [ ] **Play/Pause**: Größter Button (h-12), funktional
- [ ] **Marker Creation**: Warning-Farbe wenn aktiv, funktional
- [ ] **Zoom In/Out**: Separate Buttons, Timeline-Zoom ändert sich
- [ ] **Settings**: Öffnet Visualization Settings Modal
- [ ] **Layout**: Kein Content-Overlap (pb-20 auf main)

#### Gesture-Support

- [ ] **Swipe Left**: Timeline → Nächster Marker ausgewählt + Audio springt
- [ ] **Swipe Right**: Timeline → Vorheriger Marker ausgewählt + Audio springt
- [ ] **Zyklische Navigation**: Letzter → Erster, Erster → Letzter
- [ ] **Long Press**: 500ms auf Marker → Auswahl + Vibration (falls verfügbar)
- [ ] **Pull-to-Refresh**: Header Pull-Down → Indicator → File Dialog
- [ ] **Gesture vs Drag**: Swipe/Long Press interferiert nicht mit Marker-Drag

#### Button-Hierarchie

- [ ] **Primary**: Load Audio (accent-600, lg, prominent)
- [ ] **Secondary**: Analyze/Refine (gray-700, default)
- [ ] **Tertiary**: Settings/Zoom (ghost, icon, subtil)

### 1. Timeline Touch-Interaktionen

**Geräte**: iPhone SE, Pixel 7, iPad Mini, Android Tablet

#### Scrubbing

- [ ] Finger auf Timeline legen → Audio springt zur Position
- [ ] Finger horizontal bewegen → Audio folgt flüssig
- [ ] Finger loslassen → Audio bleibt an Position

#### Marker-Manipulation

- [ ] Marker-Kante antippen und ziehen → Start/End-Zeit ändert sich
- [ ] Marker-Mitte antippen und ziehen → gesamter Marker verschiebt sich
- [ ] Marker-Kanten sind gut greifbar (24px Hitbox)
- [ ] Drag-Feedback visuell erkennbar

#### KI-Suggestions

- [ ] Gelbe Rauten (Suggestions) antippen → Marker wird erstellt
- [ ] Tooltip erscheint beim Hover/Touch
- [ ] Tooltip bleibt im Viewport (nicht abgeschnitten)

### 2. Responsive Layout

**Breakpoints testen**: 320px, 375px, 414px, 768px, 1024px

#### Header (XS/SM)

- [ ] Alle Buttons erreichbar und groß genug
- [ ] Zeit-Display: "3:45/4:20" auf XS, "03:45 / 04:20" auf SM+
- [ ] Profile-Select nicht zu breit
- [ ] Training Points: "15pts" auf XS, "15 training points" auf SM+
- [ ] Kein Text-Wrap oder Überlauf

#### Timeline

- [ ] Höhe angemessen: 80px (XS) → 96px (SM) → 128px (MD) → 160px (LG)
- [ ] Tooltips bleiben im Viewport
- [ ] Touch-Targets gut erreichbar

#### MarkerList

- [ ] Zeit-Format: "3:45-4:20" auf XS, "03:45 - 04:20" auf SM+
- [ ] Marker-Cards nicht zu eng
- [ ] Delete-Buttons gut erreichbar
- [ ] Text trunciert sauber

#### LabelPanel

- [ ] Auf XS/SM: Kein statisches Panel sichtbar
- [ ] Marker auswählen → Modal öffnet sich
- [ ] Modal scrollbar und Touch-Targets OK

### 3. Performance & Usability

- [ ] Touch-Lag minimal (< 100ms)
- [ ] Scroll-Performance flüssig
- [ ] Zoom-Gesten funktionieren (falls implementiert)
- [ ] Keine ungewollten Scroll-Konflikte
- [ ] Orientierungswechsel funktioniert

### 4. Edge Cases

- [ ] Sehr kurze Marker (< 1s) noch manipulierbar
- [ ] Marker an Timeline-Rändern erreichbar
- [ ] Lange Songtitel trunciert korrekt
- [ ] Viele Marker (10+) Performance OK

## Bekannte Limitierungen

- **Zoom-Gesten**: Aktuell nur Buttons, keine Pinch-to-Zoom
- **Multi-Touch**: Nur Single-Touch unterstützt
- **🆕 Haptic Feedback**: Implementiert (navigator.vibrate), aber browser-abhängig
- **🆕 Context Menu**: Long Press wählt nur aus, kein echtes Kontext-Menü
- **🆕 Pull-to-Refresh**: Nur im Header, nicht global

## 🎯 Erfolgs-Kriterien Phase 7

- [ ] **Alle 5 Features funktional**: Header, Profile, Buttons, Bottom Nav, Gestures
- [ ] **Performance**: Touch Response < 50ms, Animations 60fps
- [ ] **UX**: Intuitive Bedienung ohne Tutorial
- [ ] **Responsive**: Smooth Breakpoint-Transitions
- [ ] **Accessibility**: Keyboard Navigation erhalten
- [ ] **No Regressions**: Desktop-Funktionalität unverändert

## Test-Protokoll

**Datum**: \***\*\_\_\_\*\***  
**Gerät**: \***\*\_\_\_\*\***  
**Browser**: \***\*\_\_\_\*\***  
**Viewport**: \***\*\_\_\_\*\***

**Issues gefunden**:

- [ ] Issue 1: **\*\***\*\*\*\***\*\***\_**\*\***\*\*\*\***\*\***
- [ ] Issue 2: **\*\***\*\*\*\***\*\***\_**\*\***\*\*\*\***\*\***
- [ ] Issue 3: **\*\***\*\*\*\***\*\***\_**\*\***\*\*\*\***\*\***

**Gesamtbewertung**: ⭐⭐⭐⭐⭐ (1-5 Sterne)
