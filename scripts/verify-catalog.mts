/** Beweist, dass der Katalog vollständig und in sich stimmig ist. */
import { CATALOG, catalogIntegrity, garmentById, garmentsBySlot, PRICE_RANGE } from '../src/data/catalog.ts';
import { PROVIDERS } from '../src/data/providers.ts';
import { SLOTS } from '../src/types.ts';

const fail = (msg: string): never => {
  console.error('FEHLER:', msg);
  process.exit(1);
};

const problems = catalogIntegrity();
if (problems.length > 0) fail(`Katalog-Prüfung: ${problems.join(' | ')}`);

// --- Jede Kategorie muss belegt sein -------------------------------------
for (const slot of SLOTS) {
  const items = garmentsBySlot(slot);
  if (items.length === 0) fail(`Kategorie "${slot}" ist leer.`);
}
console.log(`Kategorien belegt: ${SLOTS.map((s) => `${s}=${garmentsBySlot(s).length}`).join(' ')}`);

// --- Jeder Anbieter muss etwas anbieten ----------------------------------
for (const p of PROVIDERS) {
  const n = CATALOG.filter((g) => g.providerId === p.id).length;
  if (n === 0) fail(`Anbieter ${p.name} hat kein einziges Teil.`);
}
if (PROVIDERS.length < 2) fail('Ein Katalog mit einem Anbieter ist kein Katalog.');
console.log(`Anbieter mit Ware: ${PROVIDERS.length}`);

// --- Größenläufe müssen aufsteigend sein -----------------------------
for (const g of CATALOG) {
  const chests = g.sizes.map((s) => s.chest).filter((v): v is number => v !== undefined);
  for (let i = 1; i < chests.length; i++) {
    if (chests[i]! <= chests[i - 1]!) fail(`${g.id}: Brustmasse steigen nicht (${chests.join(',')})`);
  }
  const feet = g.sizes.map((s) => s.foot).filter((v): v is number => v !== undefined);
  for (let i = 1; i < feet.length; i++) {
    if (feet[i]! <= feet[i - 1]!) fail(`${g.id}: Fußlängen steigen nicht`);
  }
  if (g.price <= 0) fail(`${g.id}: Preis ist ${g.price}`);
}
console.log('Größenläufe aufsteigend');

// --- Zugriffe müssen funktionieren --------------------------------------
const first = CATALOG[0]!;
if (garmentById(first.id)?.id !== first.id) fail('garmentById findet das erste Teil nicht.');
if (garmentById('gibt-es-nicht')) fail('garmentById liefert etwas für eine erfundene ID.');
if (!(PRICE_RANGE[0] < PRICE_RANGE[1])) fail(`Preisspanne unsinnig: ${PRICE_RANGE.join('-')}`);

console.log(`Teile gesamt: ${CATALOG.length}, Preise ${PRICE_RANGE[0]}-${PRICE_RANGE[1]} EUR`);
console.log('CATALOG_OK');
