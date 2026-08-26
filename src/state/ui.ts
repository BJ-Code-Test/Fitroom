import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Oberflächen-Einstellungen.
 *
 * Palette und Intensität sind Klassen auf <html> — genau so verlangt es das
 * Neuro-Glass-Regelwerk. `applyTheme` ist die einzige Stelle, die das Element
 * anfasst; alles andere setzt nur den Zustand.
 */

/**
 * Die Reihenfolge ist die Empfehlung: oben das Ruhige.
 *
 * `papier` ist der Standard und bewusst fast farblos — in einem Kleiderschrank
 * soll die Farbe von der Kleidung kommen, nicht von der Oberfläche. Wer es
 * bunter mag, findet die kräftigen Paletten weiter unten.
 */
export const PALETTES = [
  { id: 'papier', label: 'Papier', dark: false, swatch: ['#e3e7ee', '#e9e5e0', '#dde4e6'] },
  { id: 'nebel', label: 'Nebel', dark: false, swatch: ['#c3ccdd', '#d5d9e2', '#aeb9cc'] },
  { id: 'graphit', label: 'Graphit', dark: true, swatch: ['#3a4250', '#4a5260', '#2f3a44'] },
  { id: 'tinte', label: 'Tinte', dark: true, swatch: ['#4a5aa8', '#7a4a8f', '#2f7a72'] },
  { id: 'sand', label: 'Sand', dark: false, swatch: ['#e8c9a0', '#d9a08a', '#b7c4a8'] },
  { id: 'nordlicht', label: 'Nordlicht', dark: false, swatch: ['#8ea2ff', '#ff9ec4', '#7fe3d4'] },
  { id: 'ozean', label: 'Ozean', dark: false, swatch: ['#8fc4d9', '#7fb0c9', '#a8d9cf'] },
  { id: 'rosenquarz', label: 'Rosenquarz', dark: false, swatch: ['#e3b9d2', '#c9b8e8', '#f0cdb8'] },
] as const;

export type PaletteId = (typeof PALETTES)[number]['id'];

export const INTENSITIES = [
  { id: 0, label: 'Mono', hint: 'fast farblos' },
  { id: 1, label: 'Ruhig', hint: 'gedämpft' },
  { id: 2, label: 'Normal', hint: 'ausgewogen' },
  { id: 3, label: 'Kräftig', hint: 'plakativ' },
] as const;

export type Intensity = 0 | 1 | 2 | 3;
export type Unit = 'cm' | 'inch';

interface UiState {
  palette: PaletteId;
  intensity: Intensity;
  unit: Unit;
  sidebarOpen: boolean;
  setPalette: (p: PaletteId) => void;
  setIntensity: (i: Intensity) => void;
  setUnit: (u: Unit) => void;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      palette: 'papier',
      intensity: 1,
      unit: 'cm',
      sidebarOpen: false,
      setPalette: (palette) => set({ palette }),
      setIntensity: (intensity) => set({ intensity }),
      setUnit: (unit) => set({ unit }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'fitroom.ui',
      // Version 2 stellt auf die ruhige Standardpalette um. Ohne diesen Schritt
      // behielte jeder, der die App schon offen hatte, das alte bunte Tinte.
      version: 2,
      migrate: (state, from) => {
        const old = (state ?? {}) as Partial<UiState>;
        if (from < 2) return { ...old, palette: 'papier', intensity: 1 } as UiState;
        return old as UiState;
      },
    },
  ),
);

/** Schreibt Palette und Intensität als Klassen auf <html>. */
export function applyTheme(palette: PaletteId, intensity: Intensity): void {
  const el = document.documentElement;
  el.classList.forEach((cls) => {
    if (cls.startsWith('ng-p-') || cls.startsWith('ng-i-')) el.classList.remove(cls);
  });
  el.classList.add(`ng-p-${palette}`, `ng-i-${intensity}`);

  const isDark = PALETTES.find((p) => p.id === palette)?.dark ?? true;
  el.setAttribute('data-theme', isDark ? 'dark' : 'light');
  el.style.colorScheme = isDark ? 'dark' : 'light';
}

// ------------------------------------------------------------- Einheiten

const CM_PER_INCH = 2.54;

/** Zahl in der eingestellten Einheit anzeigen — der Zustand bleibt immer cm. */
export function displayLength(cm: number, unit: Unit): string {
  if (unit === 'inch') return `${(cm / CM_PER_INCH).toFixed(1)}"`;
  return `${Math.round(cm * 10) / 10} cm`;
}

export const toCm = (value: number, unit: Unit): number =>
  unit === 'inch' ? value * CM_PER_INCH : value;

export const fromCm = (cm: number, unit: Unit): number =>
  unit === 'inch' ? cm / CM_PER_INCH : cm;

export const euro = (n: number): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);
