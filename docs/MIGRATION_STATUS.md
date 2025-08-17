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
- A11y/Responsiveness: Review und Feinschliff

## Nächste Schritte (Kurz)
1. `npx shadcn@latest add select checkbox`
2. LabelPanel: GEMS-Select und Trigger-Checkboxen migrieren
3. Button-Variants vereinheitlichen (primary/secondary/ghost etc.)
4. Visueller Review (Abstände, Kontraste, Fokus-Stile)

