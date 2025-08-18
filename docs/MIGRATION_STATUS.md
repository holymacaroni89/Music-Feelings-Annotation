# UI Migration Status (Tailwind + shadcn/ui)

Aktualisiert: automatisch, Stand der letzten Änderungen in diesem Repo.

## Installierte/konfigurierte Basis
- Tailwind über Vite gebundled (kein CDN)
- Plugins: `@tailwindcss/typography`, `tailwindcss-animate`
- shadcn/ui: `components.json`, Aliases (`@`), `src/lib/utils.ts (cn)`
- Icons: `lucide-react`

## Komponentenstatus
- Dialog/Modal: shadcn `<Dialog>` implementiert in `src/components/Modal.tsx`
- Buttons: Header/Footer/MarkerList auf shadcn `<Button>`
- Slider: Header-Volume + LabelPanel-Slider auf shadcn `<Slider>`
- Icons: Alle über `src/components/icons.tsx` auf `lucide-react`

## Ausstehend
- Select (GEMS) → `shadcn/ui` Select
- Checkbox-Gruppe (Trigger) → `shadcn/ui` Checkbox
- Theme/Variants: Prominenz wichtiger Aktionen (z. B. Analyze Emotions) erhöhen
- **Responsive Design vervollständigen** (laufend - mitten drin)
  - Mobile und Tablet-Layouts optimieren
  - Touch-Interaktionen für kleinere Geräte verbessern
  - Breakpoint-spezifische Anpassungen finalisieren
- A11y-Review nach Abschluss des responsiven Designs

## Nächste Schritte (Kurz)
1. **Responsive Design vervollständigen** (hohe Priorität)
   - Mobile/Tablet-Layouts optimieren
   - Touch-Interaktionen verbessern
2. `npx shadcn@latest add select checkbox`
3. LabelPanel: GEMS-Select und Trigger-Checkboxen migrieren
4. Button-Variants vereinheitlichen (primary/secondary/ghost etc.)
5. Visueller Review (Abstände, Kontraste, Fokus-Stile)

