/**
 * Beweist, dass die Passform-Rechnung unterscheidet statt immer dasselbe zu
 * sagen: dieselbe Person, drei Größen, drei verschiedene Urteile.
 */
import { checkFit, checkFitWithHint, bestSize, outfitScore } from '../src/lib/fit.ts';
import { DEFAULT_BODY } from '../src/lib/body.ts';
import { garmentById } from '../src/data/catalog.ts';
import type { BodyParams } from '../src/types.ts';

const fail = (msg: string): never => {
  console.error('FEHLER:', msg);
  process.exit(1);
};

const body: BodyParams = { ...DEFAULT_BODY, chest: 106, waist: 94, hip: 104, inseam: 84, foot: 27.3 };

const tee = garmentById('ns-tee-basic') ?? fail('Testteil ns-tee-basic fehlt');
const jeans = garmentById('ut-jeans-slim') ?? fail('Testteil ut-jeans-slim fehlt');

// --- Oberteil: XS ist zu klein, L passt, XXL ist zu weit ------------------
const small = checkFit(tee, tee.sizes.find((s) => s.label === 'XS')!, body);
const right = checkFit(tee, tee.sizes.find((s) => s.label === 'L')!, body);
const large = checkFit(tee, tee.sizes.find((s) => s.label === 'XXL')!, body);

console.log(`XS  -> ${small.verdict} (${small.score})`);
console.log(`L   -> ${right.verdict} (${right.score})`);
console.log(`XXL -> ${large.verdict} (${large.score})`);

if (!['zu-eng', 'eng'].includes(small.verdict)) fail(`XS hätte eng sein müssen, war: ${small.verdict}`);
if (right.verdict !== 'passt') fail(`L hätte passen müssen, war: ${right.verdict}`);
if (!['locker', 'zu-weit'].includes(large.verdict)) fail(`XXL hätte weit sein müssen, war: ${large.verdict}`);
if (!(right.score > small.score && right.score > large.score)) {
  fail('Die passende Größe muss die beste Note haben.');
}

// --- Die Empfehlung muss die beste Größe finden -------------------------
const best = bestSize(tee, body) ?? fail('bestSize lieferte nichts');
if (best.report.score < right.score) fail('bestSize fand nicht die beste Größe.');
console.log(`Empfehlung: ${best.size.label}`);

// --- Der Hinweis auf die bessere Größe muss erscheinen ------------------
const hinted = checkFitWithHint(tee, 'XS', body);
if (!hinted.betterSize) fail('Bei XS hätte eine bessere Größe vorgeschlagen werden müssen.');
console.log(`Hinweis bei XS: ${hinted.betterSize}`);

// --- Zonen: eine Hose muss Taille, Hüfte und Innenbein prüfen -----------
const pants = checkFit(jeans, jeans.sizes[2]!, body);
const zones = pants.zones.map((z) => z.zone).sort().join(',');
if (zones !== 'Hüfte,Innenbein,Taille') fail(`Hosen-Zonen unerwartet: ${zones}`);
console.log(`Hosen-Zonen: ${zones}`);

// --- Material macht einen Unterschied ------------------------------------
// Denim (kaum Dehnung) darf bei gleichem Mass nicht besser abschneiden als
// Strick (viel Dehnung).
const knit = garmentById('ns-longsleeve') ?? fail('ns-longsleeve fehlt');
const tightBody: BodyParams = { ...DEFAULT_BODY, chest: 112 };
const knitFit = checkFit(knit, knit.sizes.find((s) => s.label === 'M')!, tightBody);
const denimFit = checkFit(jeans, { label: 'test', waist: 84, hip: 100, inseam: 84 }, { ...tightBody, waist: 100 });
if (knitFit.score <= 0 && denimFit.score <= 0) fail('Beide Materialien fielen auf 0 — kein Unterschied messbar.');
console.log(`Strick eng: ${knitFit.verdict} / Denim eng: ${denimFit.verdict}`);

// --- Gesamtnote: ein Ausreißer muss ziehen ------------------------------
const good = outfitScore([right, right, right]);
const mixed = outfitScore([right, right, small]);
if (!(mixed < good)) fail('Ein schlecht sitzendes Teil muss die Gesamtnote senken.');
console.log(`Outfit gut: ${good}, mit Ausreißer: ${mixed}`);

console.log('FIT_OK');
