/**
 * Beweist, dass das Körpermodell auf die Maße reagiert — sonst wären die
 * Regler Zierde.
 */
import { buildBody, applyPreset, euShoeSize, DEFAULT_BODY, LIMITS } from '../src/lib/body.ts';

const fail = (msg: string): never => {
  console.error('FEHLER:', msg);
  process.exit(1);
};

const base = buildBody(DEFAULT_BODY);

// --- Höhe ---------------------------------------------------------------
const tall = buildBody({ ...DEFAULT_BODY, height: 200 });
const short = buildBody({ ...DEFAULT_BODY, height: 155 });
if (!(short.H < base.H && base.H < tall.H)) fail('Körperhöhe wirkt nicht.');
if (!(short.y.shoulder < tall.y.shoulder)) fail('Schulterhöhe folgt der Körperhöhe nicht.');
console.log(`Höhe: ${short.H} < ${base.H} < ${tall.H}`);

// --- Umfänge ------------------------------------------------------------
const wide = buildBody({ ...DEFAULT_BODY, chest: 130 });
if (!(wide.r.chest > base.r.chest)) fail('Brustumfang wirkt nicht auf den Radius.');
const hips = buildBody({ ...DEFAULT_BODY, hip: 130 });
if (!(hips.r.hip > base.r.hip)) fail('Hüftumfang wirkt nicht auf den Radius.');
console.log(`Brustradius: ${base.r.chest.toFixed(3)} -> ${wide.r.chest.toFixed(3)} m`);

// --- Innenbeinlänge verschiebt den Schritt ------------------------------
const longLegs = buildBody({ ...DEFAULT_BODY, inseam: 95 });
const shortLegs = buildBody({ ...DEFAULT_BODY, inseam: 65 });
if (!(shortLegs.y.crotch < base.y.crotch && base.y.crotch < longLegs.y.crotch)) {
  fail('Innenbeinlänge verschiebt den Schritt nicht.');
}
// Bei längeren Beinen und gleicher Höhe muss der Rumpf kürzer werden.
const torsoBase = base.y.shoulder - base.y.crotch;
const torsoLong = longLegs.y.shoulder - longLegs.y.crotch;
if (!(torsoLong < torsoBase)) fail('Längere Beine müssten den Rumpf verkürzen.');
console.log(`Rumpf: ${torsoBase.toFixed(3)} -> ${torsoLong.toFixed(3)} m bei langen Beinen`);

// --- Statur füllt die Gliedmassen ---------------------------------------
const soft = buildBody({ ...DEFAULT_BODY, tone: 0 });
const firm = buildBody({ ...DEFAULT_BODY, tone: 1 });
if (!(firm.r.upperArm > soft.r.upperArm)) fail('Statur wirkt nicht auf die Arme.');
console.log(`Oberarm: ${soft.r.upperArm.toFixed(3)} -> ${firm.r.upperArm.toFixed(3)} m`);

// --- Landmarken müssen von unten nach oben laufen -----------------------
for (const p of [DEFAULT_BODY, { ...DEFAULT_BODY, height: 150, inseam: 63 }, { ...DEFAULT_BODY, height: 208, inseam: 97 }]) {
  const m = buildBody(p);
  const order = [m.y.sole, m.y.ankle, m.y.knee, m.y.crotch, m.y.hip, m.y.waist, m.y.chest, m.y.shoulder, m.y.neck, m.y.headTop];
  for (let i = 1; i < order.length; i++) {
    if (!(order[i]! > order[i - 1]!)) fail(`Landmarken nicht aufsteigend bei ${p.height} cm: ${order.map((v) => v.toFixed(2)).join(' ')}`);
  }
}
console.log('Landmarken aufsteigend bei 150/178/208 cm');

// --- Vorlagen halten sich an die Grenzen ---------------------------------
const preset = applyPreset({ ...DEFAULT_BODY, height: 205 }, 'kraeftig');
if (preset.chest > LIMITS.chest[1] || preset.chest < LIMITS.chest[0]) fail('Vorlage verlässt die Grenzen.');
console.log(`Vorlage kraeftig @205cm: Brust ${preset.chest}`);

// --- Schuhgröße --------------------------------------------------------
if (euShoeSize(26.5) !== 42) fail(`26,5 cm müsste EU 42 sein, war ${euShoeSize(26.5)}`);
if (!(euShoeSize(24) < euShoeSize(29))) fail('Schuhgröße steigt nicht mit der Fußlänge.');
console.log(`Schuh: 26,5 cm = EU ${euShoeSize(26.5)}`);

console.log('BODY_OK');
