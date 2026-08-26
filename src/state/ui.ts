import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Oberflaechen-Einstellungen.
 *
 * Es gibt genau eine Oberflaeche — Neumorphismus — in zwei Helligkeiten.
 * Keine Paletten, keine Intensitaetsstufen: die Oberflaeche bleibt nahezu
 * farblos, damit die Farbe von der Kleidung kommt. `applyTheme` ist die
 * einzige Stelle, die das <html>-Element anfasst.
 */

export const THEMES = [
  { id: 'hell', label: 'Hell', attr: 'light' },
  { id: 'dunkel', label: 'Dunkel', attr: 'dark' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export type Unit = 'cm' | 'inch';

interface UiState {
  theme: ThemeId;
  unit: Unit;
  sidebarOpen: boolean;
  setTheme: (t: ThemeId) => void;
  setUnit: (u: Unit) => void;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      theme: 'hell',
      unit: 'cm',
      sidebarOpen: false,
      setTheme: (theme) => set({ theme }),
      setUnit: (unit) => set({ unit }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'fitroom.ui',
      // Version 3 loest Palette und Intensitaet ab. Ohne diesen Schritt haetten
      // alle, die die App schon offen hatten, ein `theme: undefined` im
      // Speicher — und damit gar kein Aussehen.
      version: 3,
      migrate: (state, from) => {
        const old = (state ?? {}) as Partial<UiState> & { palette?: string };
        if (from < 3) {
          // Wer eine dunkle Palette gewaehlt hatte, bleibt im Dunkeln.
          const wasDark = old.palette === 'tinte' || old.palette === 'graphit';
          const { palette: _palette, ...rest } = old;
          return { ...rest, theme: wasDark ? 'dunkel' : 'hell' } as UiState;
        }
        return old as UiState;
      },
    },
  ),
);

/** Spiegelt das gewaehlte Aussehen auf <html>. */
export function applyTheme(theme: ThemeId): void {
  const el = document.documentElement;
  const attr = THEMES.find((t) => t.id === theme)?.attr ?? 'light';
  el.setAttribute('data-theme', attr);
  el.style.colorScheme = attr;
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
