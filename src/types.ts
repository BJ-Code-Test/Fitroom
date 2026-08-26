/** Zentrale Datentypen von FitRoom. */

/** Slots, die ein Avatar gleichzeitig tragen kann. Reihenfolge = Reihenfolge in der Leiste. */
export const SLOTS = ['head', 'top', 'outer', 'bottom', 'shoes', 'accessory'] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_LABEL: Record<Slot, string> = {
  head: 'Kopf',
  top: 'Oberteil',
  outer: 'Jacke',
  bottom: 'Unterteil',
  shoes: 'Schuhe',
  accessory: 'Accessoire',
};

/** Wie ein Kleidungsstück in 3D gebaut wird. Ein Bauplan, kein fertiges Mesh. */
export type GarmentShape =
  | 'tee'        // kurzarm, hüfthoch
  | 'longsleeve'
  | 'hoodie'     // dicker, mit Kapuze
  | 'shirt'      // Hemd mit Kragen
  | 'jacket'
  | 'coat'       // knielang
  | 'pants'
  | 'jeans'
  | 'shorts'
  | 'skirt'
  | 'sneaker'
  | 'boot'
  | 'cap'
  | 'beanie'
  | 'belt'
  | 'scarf';

/** Wie weit das Teil geschnitten ist. Fliesst direkt in die Passform-Rechnung ein. */
export type FitCut = 'slim' | 'regular' | 'oversized';

export type Material = 'cotton' | 'denim' | 'wool' | 'leather' | 'tech' | 'knit';

/** Körpermaße eines Größenlaufs, in cm (Körpermaß, nicht Stoffmass). */
export interface SizeSpec {
  /** z.B. "M", "32/32", "42" */
  label: string;
  chest?: number;
  waist?: number;
  hip?: number;
  /** Innenbeinlänge für Hosen */
  inseam?: number;
  /** Fußlänge in cm für Schuhe */
  foot?: number;
}

export interface Colorway {
  name: string;
  /** Hauptfarbe des Stoffs */
  hex: string;
  /** optionale Zweitfarbe (Sohle, Kragen, Naht) */
  accentHex?: string;
}

export interface Provider {
  id: string;
  name: string;
  /** Kurzzeichen für das Badge im Katalog */
  tag: string;
  /** Free-User sehen nur Anbieter mit tier 'free'. */
  tier: 'free' | 'pro';
  hue: string;
}

export interface Garment {
  id: string;
  name: string;
  brand: string;
  providerId: string;
  slot: Slot;
  shape: GarmentShape;
  cut: FitCut;
  material: Material;
  /** Preis in Euro */
  price: number;
  colorways: Colorway[];
  sizes: SizeSpec[];
  /** Länge des Teils als Anteil der Körperhöhe, überschreibt den Shape-Default. */
  lengthMod?: number;
}

/** Was der Nutzer an einem Slot trägt. */
export interface WornItem {
  garmentId: string;
  colorIndex: number;
  sizeLabel: string;
}

export type Worn = Partial<Record<Slot, WornItem>>;

/** Alle Regler des Avatar-Builders. Maße in cm, Höhe in cm. */
export interface BodyParams {
  height: number;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  /** Innenbeinlänge in cm */
  inseam: number;
  /** Fußlänge in cm */
  foot: number;
  /** Muskel-/Füllgrad 0..1, beeinflusst Arme und Beine */
  tone: number;
  skin: string;
  hair: string;
  /** Silhouette-Vorlage, nur als Startpunkt für die Regler */
  preset: BodyPreset;
}

export type BodyPreset = 'neutral' | 'schlank' | 'athletisch' | 'kurvig' | 'kraeftig';

export interface SavedOutfit {
  id: string;
  name: string;
  worn: Worn;
  body: BodyParams;
  createdAt: number;
}

export type Plan = 'free' | 'pro';

/** Ergebnis der Passform-Prüfung eines Teils an einem Körper. */
export type FitVerdict = 'zu-eng' | 'eng' | 'passt' | 'locker' | 'zu-weit' | 'unbekannt';

export interface FitZone {
  zone: string;
  /** Körpermaß in cm */
  body: number;
  /** Mass des Teils in cm (inkl. Schnitt-Zugabe) */
  garment: number;
  verdict: FitVerdict;
}

export interface FitReport {
  verdict: FitVerdict;
  score: number;
  zones: FitZone[];
  /** Ein Satz Klartext für die Oberfläche */
  advice: string;
  /** Größe, die laut Rechnung besser passen würde (falls es eine gibt) */
  betterSize?: string;
}
