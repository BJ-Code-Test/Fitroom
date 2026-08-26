import { create } from 'zustand';
import type { BodyParams, BodyPreset, Garment, Plan, SavedOutfit, Slot, Worn } from '../types';
import { DEFAULT_BODY, applyPreset } from '../lib/body';
import { bestSize } from '../lib/fit';
import * as repo from '../data/repo';

/**
 * Der Zustand, mit dem gearbeitet wird: Maße, aktuelles Outfit, Plan,
 * gespeicherte Looks, Favoriten.
 *
 * Geschrieben wird immer über `repo` — ob das im Browser oder in Supabase
 * landet, entscheidet dort die Anmeldung, nicht hier.
 */

interface AppState {
  userId: string | null;
  ready: boolean;
  body: BodyParams;
  worn: Worn;
  plan: Plan;
  outfits: SavedOutfit[];
  favorites: string[];

  hydrate: (userId: string | null) => Promise<void>;

  setBody: (patch: Partial<BodyParams>) => void;
  usePreset: (preset: BodyPreset) => void;
  resetBody: () => void;

  wear: (garment: Garment) => void;
  unwear: (slot: Slot) => void;
  setColor: (slot: Slot, colorIndex: number) => void;
  setSize: (slot: Slot, sizeLabel: string) => void;
  clearOutfit: () => void;

  saveOutfit: (name: string) => Promise<SavedOutfit>;
  applyOutfit: (id: string) => void;
  removeOutfit: (id: string) => Promise<void>;
  rename: (id: string, name: string) => Promise<void>;

  toggleFavorite: (garmentId: string) => Promise<void>;
  setPlan: (plan: Plan) => void;
}

/**
 * Jede Änderung am aktuellen Outfit geht durch diese eine Stelle, damit sie
 * nirgends vergessen wird: sichtbar machen und im Browser sichern sind hier
 * derselbe Vorgang. Sonst verliert ein Neuladen, was gerade am Körper hängt.
 */
function setWorn(set: (partial: Partial<AppState>) => void, worn: Worn): void {
  set({ worn });
  repo.saveWorn(worn);
}

/** Maße werden beim Schieben laufend geändert — gespeichert wird nach Ruhe. */
let bodySaveTimer: ReturnType<typeof setTimeout> | undefined;

export const useApp = create<AppState>()((set, get) => ({
  userId: null,
  ready: false,
  body: DEFAULT_BODY,
  worn: {},
  plan: 'free',
  outfits: [],
  favorites: [],

  hydrate: async (userId) => {
    set({ userId, ready: false });
    const [body, outfits, favorites, plan] = await Promise.all([
      repo.loadBody(userId),
      repo.listOutfits(userId),
      repo.listFavorites(userId),
      repo.loadPlan(userId),
    ]);
    set({ body, worn: repo.loadWorn(), outfits, favorites, plan, ready: true });
  },

  setBody: (patch) => {
    const body = { ...get().body, ...patch };
    set({ body });
    clearTimeout(bodySaveTimer);
    bodySaveTimer = setTimeout(() => {
      void repo.saveBody(get().userId, get().body);
    }, 600);
  },

  usePreset: (preset) => {
    get().setBody(applyPreset(get().body, preset));
  },

  resetBody: () => {
    get().setBody(DEFAULT_BODY);
  },

  wear: (garment) => {
    // Die Größe, die zu den Maßen am besten passt, ist die sinnvolle
    // Vorauswahl — der Nutzer kann sie danach jederzeit ändern.
    const best = bestSize(garment, get().body);
    const sizeLabel = best?.size.label ?? garment.sizes[0]?.label ?? '';
    setWorn(set, { ...get().worn, [garment.slot]: { garmentId: garment.id, colorIndex: 0, sizeLabel } });
  },

  unwear: (slot) => {
    const next = { ...get().worn };
    delete next[slot];
    setWorn(set, next);
  },

  setColor: (slot, colorIndex) => {
    const item = get().worn[slot];
    if (!item) return;
    setWorn(set, { ...get().worn, [slot]: { ...item, colorIndex } });
  },

  setSize: (slot, sizeLabel) => {
    const item = get().worn[slot];
    if (!item) return;
    setWorn(set, { ...get().worn, [slot]: { ...item, sizeLabel } });
  },

  clearOutfit: () => setWorn(set, {}),

  saveOutfit: async (name) => {
    const { userId, worn, body } = get();
    const outfit = await repo.createOutfit(userId, name, worn, body);
    set({ outfits: [outfit, ...get().outfits] });
    return outfit;
  },

  applyOutfit: (id) => {
    const outfit = get().outfits.find((o) => o.id === id);
    if (!outfit) return;
    set({ body: outfit.body });
    setWorn(set, outfit.worn);
    void repo.saveBody(get().userId, outfit.body);
  },

  removeOutfit: async (id) => {
    await repo.deleteOutfit(get().userId, id);
    set({ outfits: get().outfits.filter((o) => o.id !== id) });
  },

  rename: async (id, name) => {
    await repo.renameOutfit(get().userId, id, name);
    set({ outfits: get().outfits.map((o) => (o.id === id ? { ...o, name } : o)) });
  },

  toggleFavorite: async (garmentId) => {
    const on = !get().favorites.includes(garmentId);
    set({
      favorites: on
        ? [...get().favorites, garmentId]
        : get().favorites.filter((f) => f !== garmentId),
    });
    await repo.toggleFavorite(get().userId, garmentId, on);
  },

  setPlan: (plan) => {
    set({ plan });
    repo.savePlanLocal(plan);
  },
}));

/** Wie viele Slots gerade belegt sind. */
export const wornCount = (worn: Worn): number => Object.keys(worn).length;
