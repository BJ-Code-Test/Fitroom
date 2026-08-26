import type { BodyParams, FitCut, FitReport, FitVerdict, FitZone, Garment, Material, SizeSpec } from '../types';

/**
 * Passform-Rechnung.
 *
 * Die Größenangaben eines Teils sind Körpermaße ("dieses M ist für 96 cm
 * Brustumfang gemacht"). Wie viel Luft daraus wird, entscheidet der Schnitt;
 * wie viel Enge der Stoff verzeiht, entscheidet das Material.
 */

/** Bewegungszugabe in cm, die der Schnitt auf das Körpermaß legt. */
const CUT_EASE: Record<FitCut, number> = { slim: 1, regular: 6, oversized: 16 };

/** Wie viel Untermass der Stoff durch Dehnung wegsteckt, in cm. */
const STRETCH: Record<Material, number> = {
  knit: 6, tech: 5, cotton: 2.5, wool: 3, denim: 0.5, leather: -1,
};

export const CUT_LABEL: Record<FitCut, string> = {
  slim: 'schmal', regular: 'regulär', oversized: 'oversized',
};

export const MATERIAL_LABEL: Record<Material, string> = {
  cotton: 'Baumwolle', denim: 'Denim', wool: 'Wolle',
  leather: 'Leder', tech: 'Funktion', knit: 'Strick',
};

export const VERDICT_LABEL: Record<FitVerdict, string> = {
  'zu-eng': 'zu eng', eng: 'eng', passt: 'passt', locker: 'locker',
  'zu-weit': 'zu weit', unbekannt: 'keine Angabe',
};

/** Wie stark ein Urteil die Gesamtnote zieht. */
const PENALTY: Record<FitVerdict, number> = {
  passt: 0, eng: 12, locker: 12, 'zu-eng': 42, 'zu-weit': 38, unbekannt: 0,
};

/** Umfangs-Zonen: Urteil aus der Differenz Kleidungsstück minus Körper (cm). */
function judgeCirc(diff: number): FitVerdict {
  if (diff < -4) return 'zu-eng';
  if (diff < 1) return 'eng';
  if (diff <= 12) return 'passt';
  if (diff <= 20) return 'locker';
  return 'zu-weit';
}

/** Längen-Zonen (Innenbein, Fuß): hier ist Untermass wie Übermass ein Problem. */
function judgeLength(diff: number, tol: number): FitVerdict {
  if (diff < -tol * 2) return 'zu-eng';
  if (diff < -tol) return 'eng';
  if (diff <= tol) return 'passt';
  if (diff <= tol * 2.2) return 'locker';
  return 'zu-weit';
}

const worst = (a: FitVerdict, b: FitVerdict) => (PENALTY[a] >= PENALTY[b] ? a : b);

/** Prüft eine konkrete Größe eines Teils gegen einen Körper. */
export function checkFit(garment: Garment, size: SizeSpec, body: BodyParams): FitReport {
  const ease = CUT_EASE[garment.cut];
  const give = STRETCH[garment.material];
  const zones: FitZone[] = [];

  const circZone = (zone: string, spec: number | undefined, bodyVal: number) => {
    if (spec === undefined) return;
    const garmentVal = spec + ease;
    zones.push({ zone, body: r1(bodyVal), garment: r1(garmentVal), verdict: judgeCirc(garmentVal - bodyVal + give) });
  };

  circZone('Brust', size.chest, body.chest);
  circZone('Taille', size.waist, body.waist);
  circZone('Hüfte', size.hip, body.hip);

  if (size.inseam !== undefined) {
    zones.push({
      zone: 'Innenbein', body: r1(body.inseam), garment: r1(size.inseam),
      verdict: judgeLength(size.inseam - body.inseam, 2.5),
    });
  }
  if (size.foot !== undefined) {
    zones.push({
      zone: 'Fuß', body: r1(body.foot), garment: r1(size.foot),
      verdict: judgeLength(size.foot - body.foot, 0.6),
    });
  }

  if (zones.length === 0) {
    return { verdict: 'unbekannt', score: 70, zones, advice: 'Für dieses Teil liegen keine Maße vor.' };
  }

  const verdict = zones.reduce<FitVerdict>((acc, z) => worst(acc, z.verdict), 'passt');
  const score = Math.max(0, 100 - zones.reduce((s, z) => s + PENALTY[z.verdict], 0));

  return { verdict, score, zones, advice: advise(verdict, zones, garment) };
}

function advise(verdict: FitVerdict, zones: FitZone[], g: Garment): string {
  const bad = zones.filter((z) => z.verdict !== 'passt');
  const where = bad.map((z) => z.zone.toLowerCase()).join(' und ');
  switch (verdict) {
    case 'passt':
      return `Sitzt wie gedacht — ${CUT_LABEL[g.cut]} geschnitten, ${MATERIAL_LABEL[g.material]}.`;
    case 'eng':
      return `Liegt an ${where} eng an. Gewollt bei ${CUT_LABEL[g.cut]}em Schnitt, sonst eine Nummer größer.`;
    case 'locker':
      return `Fällt an ${where} großzügig aus — lässig, aber nicht mehr auf Figur.`;
    case 'zu-eng':
      return `Spannt an ${where}. ${MATERIAL_LABEL[g.material]} gibt hier zu wenig nach — größer wählen.`;
    case 'zu-weit':
      return `Schlackert an ${where}. Eine oder zwei Nummern kleiner sitzt besser.`;
    default:
      return 'Keine Maße hinterlegt.';
  }
}

/** Bestes Ergebnis über alle Größen eines Teils. */
export function bestSize(garment: Garment, body: BodyParams): { size: SizeSpec; report: FitReport } | null {
  if (garment.sizes.length === 0) return null;
  let best: { size: SizeSpec; report: FitReport } | null = null;
  for (const size of garment.sizes) {
    const report = checkFit(garment, size, body);
    if (!best || report.score > best.report.score) best = { size, report };
  }
  return best;
}

/** Wie `checkFit`, ergänzt um einen Hinweis auf die bessere Größe. */
export function checkFitWithHint(garment: Garment, sizeLabel: string, body: BodyParams): FitReport {
  const size = garment.sizes.find((s) => s.label === sizeLabel) ?? garment.sizes[0];
  if (!size) return { verdict: 'unbekannt', score: 70, zones: [], advice: 'Keine Größen hinterlegt.' };
  const report = checkFit(garment, size, body);
  if (report.verdict !== 'passt') {
    const best = bestSize(garment, body);
    if (best && best.size.label !== size.label && best.report.score > report.score + 8) {
      report.betterSize = best.size.label;
    }
  }
  return report;
}

/** Gesamtnote eines Outfits: der Durchschnitt, aber ein Ausreißer zieht stärker. */
export function outfitScore(reports: FitReport[]): number {
  if (reports.length === 0) return 0;
  const avg = reports.reduce((s, r) => s + r.score, 0) / reports.length;
  const min = Math.min(...reports.map((r) => r.score));
  return Math.round(avg * 0.65 + min * 0.35);
}

const r1 = (n: number) => Math.round(n * 10) / 10;
