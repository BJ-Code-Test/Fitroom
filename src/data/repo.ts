import { SLOTS, type BodyParams, type Plan, type SavedOutfit, type Worn } from '../types';
import { DEFAULT_BODY } from '../lib/body';
import { newId } from '../lib/id';
import { supabase } from '../lib/supabase';
import type { Json } from '../lib/database.types';

/**
 * Datenzugriff.
 *
 * Die einzige Stelle der App, die Supabase kennt. Ist niemand angemeldet,
 * schreibt dieselbe Schnittstelle in den localStorage — die App ist also auch
 * als Gast vollständig benutzbar. Beim ersten Anmelden werden die lokalen
 * Daten übernommen (`migrateLocalToCloud`).
 */

const LS = {
  body: 'fitroom.body',
  worn: 'fitroom.worn',
  outfits: 'fitroom.outfits',
  favorites: 'fitroom.favorites',
  plan: 'fitroom.plan',
  migrated: 'fitroom.migrated',
} as const;

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Privater Modus oder volles Kontingent: die Daten gehen verloren, die App
    // läuft weiter. Wer sie sicher haben will, meldet sich an.
  }
}

/**
 * Die jsonb-Grenze.
 *
 * `Worn` und `BodyParams` sind gewöhnliche Interfaces ohne Index-Signatur und
 * passen deshalb strukturell nicht auf `Json`, obwohl sie genau das sind: reine
 * Daten. Statt beide Typen dafür aufzuweichen, steht die Umdeutung an den zwei
 * Stellen, an denen sie tatsächlich in eine jsonb-Spalte laufen.
 */
const alsJson = (wert: Worn | BodyParams): Json => wert as unknown as Json;

type BodyRow = Record<string, unknown>;

/** Spaltenwerte der Datenbank kommen als String zurück — hier normalisiert. */
function rowToBody(row: BodyRow): BodyParams {
  const num = (k: string, d: number) => {
    const v = row[k];
    const n = typeof v === 'string' ? Number.parseFloat(v) : typeof v === 'number' ? v : NaN;
    return Number.isFinite(n) ? n : d;
  };
  return {
    height: num('height', DEFAULT_BODY.height),
    shoulder: num('shoulder', DEFAULT_BODY.shoulder),
    chest: num('chest', DEFAULT_BODY.chest),
    waist: num('waist', DEFAULT_BODY.waist),
    hip: num('hip', DEFAULT_BODY.hip),
    inseam: num('inseam', DEFAULT_BODY.inseam),
    foot: num('foot', DEFAULT_BODY.foot),
    tone: num('tone', DEFAULT_BODY.tone),
    skin: (row.skin as string) ?? DEFAULT_BODY.skin,
    hair: (row.hair as string) ?? DEFAULT_BODY.hair,
    preset: (row.preset as BodyParams['preset']) ?? DEFAULT_BODY.preset,
  };
}

const bodyToRow = (b: BodyParams) => ({
  height: b.height,
  shoulder: b.shoulder,
  chest: b.chest,
  waist: b.waist,
  hip: b.hip,
  inseam: b.inseam,
  foot: b.foot,
  tone: b.tone,
  skin: b.skin,
  hair: b.hair,
  preset: b.preset,
});

// ------------------------------------------------------------------ Maße

export async function loadBody(userId: string | null): Promise<BodyParams> {
  if (!userId || !supabase) return readLocal(LS.body, DEFAULT_BODY);

  const { data, error } = await supabase
    .from('body_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return readLocal(LS.body, DEFAULT_BODY);
  return rowToBody(data as BodyRow);
}

export async function saveBody(userId: string | null, body: BodyParams): Promise<void> {
  writeLocal(LS.body, body);
  if (!userId || !supabase) return;

  const { data } = await supabase
    .from('body_profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle();

  const existingId = (data as { id?: string } | null)?.id;
  if (existingId) {
    await supabase.from('body_profiles').update(bodyToRow(body)).eq('id', existingId);
  } else {
    await supabase
      .from('body_profiles')
      .insert({ user_id: userId, name: 'Meine Maße', is_default: true, ...bodyToRow(body) });
  }
}

// -------------------------------------------------- Aktuelles Outfit

/**
 * Was gerade am Körper hängt.
 *
 * Bewusst nur lokal: die Ankleide ist ein Arbeitsstand, kein Dokument —
 * wer ihn behalten will, speichert ihn als Outfit. Trotzdem darf ein
 * Neuladen der Seite ihn nicht verschlucken, denn genau das liest sich
 * für den Nutzer wie ein Datenverlust.
 */
export function loadWorn(): Worn {
  const raw = readLocal<Worn>(LS.worn, {});
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  // Nur behalten, was heute noch ein gültiger Slot mit gültigem Inhalt ist —
  // ein alter Eintrag aus einer früheren Katalogfassung darf die Ankleide
  // nicht lahmlegen.
  const clean: Worn = {};
  for (const slot of SLOTS) {
    const item = raw[slot];
    if (!item || typeof item !== 'object') continue;
    if (typeof item.garmentId !== 'string' || typeof item.sizeLabel !== 'string') continue;
    clean[slot] = {
      garmentId: item.garmentId,
      colorIndex: Number.isFinite(item.colorIndex) ? item.colorIndex : 0,
      sizeLabel: item.sizeLabel,
    };
  }
  return clean;
}

export function saveWorn(worn: Worn): void {
  writeLocal(LS.worn, worn);
}

// ---------------------------------------------------------------- Outfits

interface OutfitRow {
  id: string;
  name: string;
  worn: Worn | null;
  body: BodyParams | null;
  created_at: string;
}

export async function listOutfits(userId: string | null): Promise<SavedOutfit[]> {
  if (!userId || !supabase) return readLocal<SavedOutfit[]>(LS.outfits, []);

  const { data, error } = await supabase
    .from('outfits')
    .select('id, name, worn, body, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as OutfitRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    worn: r.worn ?? {},
    body: r.body ?? DEFAULT_BODY,
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export async function createOutfit(
  userId: string | null,
  name: string,
  worn: Worn,
  body: BodyParams,
): Promise<SavedOutfit> {
  const outfit: SavedOutfit = { id: newId(), name, worn, body, createdAt: Date.now() };

  if (!userId || !supabase) {
    const all = readLocal<SavedOutfit[]>(LS.outfits, []);
    writeLocal(LS.outfits, [outfit, ...all]);
    return outfit;
  }

  const { data, error } = await supabase
    .from('outfits')
    .insert({ user_id: userId, name, worn: alsJson(worn), body: alsJson(body) })
    .select('id, created_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Outfit konnte nicht gespeichert werden.');
  }
  const row = data as { id: string; created_at: string };
  return { ...outfit, id: row.id, createdAt: new Date(row.created_at).getTime() };
}

export async function renameOutfit(userId: string | null, id: string, name: string): Promise<void> {
  if (!userId || !supabase) {
    const all = readLocal<SavedOutfit[]>(LS.outfits, []);
    writeLocal(
      LS.outfits,
      all.map((o) => (o.id === id ? { ...o, name } : o)),
    );
    return;
  }
  await supabase.from('outfits').update({ name }).eq('id', id);
}

export async function deleteOutfit(userId: string | null, id: string): Promise<void> {
  if (!userId || !supabase) {
    const all = readLocal<SavedOutfit[]>(LS.outfits, []);
    writeLocal(
      LS.outfits,
      all.filter((o) => o.id !== id),
    );
    return;
  }
  await supabase.from('outfits').delete().eq('id', id);
}

// -------------------------------------------------------------- Favoriten

export async function listFavorites(userId: string | null): Promise<string[]> {
  if (!userId || !supabase) return readLocal<string[]>(LS.favorites, []);
  const { data } = await supabase.from('favorites').select('garment_id').eq('user_id', userId);
  return (data ?? []).map((r) => (r as { garment_id: string }).garment_id);
}

export async function toggleFavorite(
  userId: string | null,
  garmentId: string,
  on: boolean,
): Promise<void> {
  if (!userId || !supabase) {
    const all = new Set(readLocal<string[]>(LS.favorites, []));
    if (on) all.add(garmentId);
    else all.delete(garmentId);
    writeLocal(LS.favorites, [...all]);
    return;
  }
  if (on) {
    await supabase.from('favorites').upsert({ user_id: userId, garment_id: garmentId });
  } else {
    await supabase.from('favorites').delete().eq('user_id', userId).eq('garment_id', garmentId);
  }
}

// ------------------------------------------------------------------- Plan

export async function loadPlan(userId: string | null): Promise<Plan> {
  if (!userId || !supabase) return readLocal<Plan>(LS.plan, 'free');
  const { data } = await supabase.from('profiles').select('plan').eq('id', userId).maybeSingle();
  return ((data as { plan?: Plan } | null)?.plan ?? 'free') as Plan;
}

export function savePlanLocal(plan: Plan): void {
  writeLocal(LS.plan, plan);
}

// -------------------------------------------------------------- Migration

/**
 * Übernimmt beim ersten Anmelden, was als Gast entstanden ist.
 * Läuft genau einmal je Konto und lässt vorhandene Cloud-Daten in Ruhe.
 */
export async function migrateLocalToCloud(userId: string): Promise<number> {
  if (!supabase) return 0;

  const done = readLocal<Record<string, boolean>>(LS.migrated, {});
  if (done[userId]) return 0;

  let moved = 0;

  const localBody = readLocal<BodyParams | null>(LS.body, null);
  if (localBody) {
    const { count } = await supabase
      .from('body_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (!count) {
      await saveBody(userId, localBody);
      moved += 1;
    }
  }

  const localOutfits = readLocal<SavedOutfit[]>(LS.outfits, []);
  if (localOutfits.length > 0) {
    const rows = localOutfits.map((o) => ({
      user_id: userId,
      name: o.name,
      worn: alsJson(o.worn),
      body: alsJson(o.body),
    }));
    const { error } = await supabase.from('outfits').insert(rows);
    if (!error) moved += rows.length;
  }

  const localFavs = readLocal<string[]>(LS.favorites, []);
  if (localFavs.length > 0) {
    await supabase
      .from('favorites')
      .upsert(localFavs.map((garmentId) => ({ user_id: userId, garment_id: garmentId })));
    moved += localFavs.length;
  }

  writeLocal(LS.migrated, { ...done, [userId]: true });
  return moved;
}

/** Alles löschen, was lokal liegt (Einstellungen-Seite). */
export function clearLocal(): void {
  for (const key of Object.values(LS)) {
    try {
      localStorage.removeItem(key);
    } catch {
      // nichts zu tun
    }
  }
}

/** Datenexport für die Profilseite. */
export async function exportAll(userId: string | null) {
  return {
    exportedAt: new Date().toISOString(),
    body: await loadBody(userId),
    outfits: await listOutfits(userId),
    favorites: await listFavorites(userId),
    plan: await loadPlan(userId),
  };
}
