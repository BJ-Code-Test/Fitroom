import type { BodyParams, BodyPreset } from '../types';

/**
 * Parametrisches Körpermodell.
 *
 * Eingabe sind die Maße, die ein Mensch von sich kennt (Höhe, Brust-, Taillen-,
 * Hüftumfang, Innenbeinlänge, Fußlänge). Ausgabe sind Höhen und Radien in
 * Metern, aus denen die 3D-Szene den Körper und jedes Kleidungsstück baut.
 *
 * Alles Anthropometrische steckt hier — die Szene rechnet nicht selbst.
 */

/** Umfang (cm) -> Radius (m) eines Kreises gleicher Fläche. */
export const circToRadius = (circCm: number): number => circCm / (2 * Math.PI) / 100;

/** Der Rumpf ist im Querschnitt oval, nicht rund: Tiefe = Breite * DEPTH. */
export const DEPTH = 0.74;

/** Höhen als Anteil der Körperhöhe, gemessen von der Sohle. */
const F = {
  ankle: 0.039,
  knee: 0.285,
  hip: 0.53,
  waist: 0.62,
  chest: 0.72,
  shoulder: 0.818,
  neck: 0.862,
  chin: 0.872,
  headTop: 1.0,
} as const;

export interface BodyModel {
  /** Körperhöhe in Metern */
  H: number;
  y: {
    sole: number; ankle: number; knee: number; crotch: number; hip: number;
    waist: number; chest: number; shoulder: number; neck: number; chin: number; headTop: number;
  };
  r: {
    hip: number; waist: number; chest: number; neck: number; head: number;
    thigh: number; calf: number; ankle: number;
    upperArm: number; foreArm: number; wrist: number;
  };
  /** halbe Schulterbreite in Metern (Mitte -> Schultergelenk) */
  shoulderHalf: number;
  /** Abstand Körpermitte -> Beinmitte */
  legOffset: number;
  foot: { length: number; width: number };
  depth: number;
  skin: string;
  hair: string;
}

export const PRESETS: Record<BodyPreset, Partial<BodyParams>> = {
  neutral:    { shoulder: 44, chest: 96,  waist: 82, hip: 98,  tone: 0.45 },
  schlank:    { shoulder: 42, chest: 88,  waist: 72, hip: 90,  tone: 0.3 },
  athletisch: { shoulder: 48, chest: 104, waist: 80, hip: 96,  tone: 0.78 },
  kurvig:     { shoulder: 41, chest: 100, waist: 76, hip: 110, tone: 0.42 },
  kraeftig:   { shoulder: 50, chest: 116, waist: 104, hip: 114, tone: 0.55 },
};

export const DEFAULT_BODY: BodyParams = {
  height: 178,
  shoulder: 44,
  chest: 96,
  waist: 82,
  hip: 98,
  inseam: 82,
  foot: 26.5,
  tone: 0.45,
  skin: '#c98d68',
  hair: '#2b2118',
  preset: 'neutral',
};

/** Grenzen der Regler — auch die Oberfläche liest sie hier aus. */
export const LIMITS = {
  height: [148, 210] as const,
  shoulder: [34, 58] as const,
  chest: [70, 145] as const,
  waist: [55, 140] as const,
  hip: [72, 145] as const,
  inseam: [62, 98] as const,
  foot: [21, 33] as const,
};

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function applyPreset(body: BodyParams, preset: BodyPreset): BodyParams {
  const p = PRESETS[preset];
  // Umfänge skalieren mit der Körperhöhe: die Vorlagen sind auf 178 cm geeicht.
  const k = body.height / 178;
  return {
    ...body,
    preset,
    shoulder: round1(clamp((p.shoulder ?? body.shoulder) * k, ...LIMITS.shoulder)),
    chest: round1(clamp((p.chest ?? body.chest) * k, ...LIMITS.chest)),
    waist: round1(clamp((p.waist ?? body.waist) * k, ...LIMITS.waist)),
    hip: round1(clamp((p.hip ?? body.hip) * k, ...LIMITS.hip)),
    tone: p.tone ?? body.tone,
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Schuhgröße (EU) aus der Fußlänge. */
export const euShoeSize = (footCm: number) => Math.round(footCm * 1.5 + 2);

/**
 * Baut aus den Reglerwerten das fertige Modell.
 * Reine Funktion: gleiche Maße -> gleiches Modell.
 */
export function buildBody(p: BodyParams): BodyModel {
  const H = p.height / 100;
  const inseam = clamp(p.inseam, ...LIMITS.inseam) / 100;

  // Die Schrittlänge kommt direkt aus der Innenbeinlänge — der Rest des
  // Beins folgt daraus, damit sich Rumpf- und Beinlänge gegenläufig ändern.
  const crotch = clamp(inseam, 0.36 * H, 0.58 * H);
  const knee = crotch * 0.594;
  const ankle = F.ankle * H;

  // Rumpfmarken sitzen relativ zur Höhe, werden aber nach oben geschoben,
  // wenn die Beine länger sind als es die Proportion vorgibt.
  const legShift = crotch - 0.48 * H;
  const up = (f: number) => f * H + legShift * (1 - (f - 0.48) / 0.52) * 0.55;

  const rChest = circToRadius(p.chest);
  const rWaist = circToRadius(p.waist);
  const rHip = circToRadius(p.hip);

  // Gliedmassen: Grundmass aus dem Rumpf, dann über "tone" gefüllt.
  const t = clamp(p.tone, 0, 1);
  const limb = (base: number) => base * (0.86 + t * 0.3);

  return {
    H,
    y: {
      sole: 0,
      ankle,
      knee,
      crotch,
      hip: up(F.hip),
      waist: up(F.waist),
      chest: up(F.chest),
      shoulder: up(F.shoulder),
      neck: up(F.neck),
      chin: up(F.chin),
      headTop: H,
    },
    r: {
      hip: rHip,
      waist: rWaist,
      chest: rChest,
      neck: circToRadius(p.chest * 0.38),
      head: H * 0.0715,
      thigh: limb(rHip * 0.58),
      calf: limb(rHip * 0.36),
      ankle: limb(rHip * 0.2),
      upperArm: limb(rChest * 0.3),
      foreArm: limb(rChest * 0.24),
      wrist: limb(rChest * 0.16),
    },
    shoulderHalf: clamp(p.shoulder, ...LIMITS.shoulder) / 2 / 100,
    legOffset: rHip * 0.52,
    foot: { length: clamp(p.foot, ...LIMITS.foot) / 100, width: clamp(p.foot, ...LIMITS.foot) / 100 * 0.37 },
    depth: DEPTH,
    skin: p.skin,
    hair: p.hair,
  };
}
