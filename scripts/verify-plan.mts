/** Beweist, dass die Free-Grenzen greifen und Pro sie aufhebt. */
import { PLAN_LIMITS, can, canSaveMore, remainingSaves, visibleProviders, isProviderLocked } from '../src/lib/plan.ts';
import { PROVIDERS } from '../src/data/providers.ts';

const fail = (msg: string): never => {
  console.error('FEHLER:', msg);
  process.exit(1);
};

// --- Funktionen ----------------------------------------------------------
for (const feature of Object.keys(PLAN_LIMITS.free.features) as (keyof typeof PLAN_LIMITS.free.features)[]) {
  if (can('free', feature)) fail(`Free dürfte "${feature}" nicht können.`);
  if (!can('pro', feature)) fail(`Pro müsste "${feature}" können.`);
}
console.log(`Funktionen geprüft: ${Object.keys(PLAN_LIMITS.free.features).length}`);

// --- Speichergrenze ------------------------------------------------------
const limit = PLAN_LIMITS.free.savedOutfits;
if (!canSaveMore('free', limit - 1)) fail('Free muss unterhalb der Grenze speichern dürfen.');
if (canSaveMore('free', limit)) fail('Free darf an der Grenze nicht mehr speichern.');
if (canSaveMore('free', limit + 5)) fail('Free darf oberhalb der Grenze nicht speichern.');
if (!canSaveMore('pro', 9999)) fail('Pro muss unbegrenzt speichern dürfen.');
if (remainingSaves('free', limit) !== 0) fail('Restzähler muss an der Grenze 0 sein.');
if (remainingSaves('free', 0) !== limit) fail('Restzähler muss ohne Outfits die volle Grenze zeigen.');
console.log(`Speichergrenze free=${limit}, pro=unbegrenzt`);

// --- Anbieter ------------------------------------------------------------
const free = visibleProviders('free', PROVIDERS);
const pro = visibleProviders('pro', PROVIDERS);
if (free.length >= pro.length) fail('Pro muss mehr Anbieter sehen als Free.');
if (free.some((p) => p.tier === 'pro')) fail('Free darf keinen Pro-Anbieter sehen.');
if (pro.length !== PROVIDERS.length) fail('Pro muss alle Anbieter sehen.');
const proOnly = PROVIDERS.filter((p) => p.tier === 'pro');
if (proOnly.length === 0) fail('Es gibt keinen einzigen Pro-Anbieter — die Schranke wäre wirkungslos.');
for (const p of proOnly) {
  if (!isProviderLocked('free', p)) fail(`${p.name} müsste für Free gesperrt sein.`);
  if (isProviderLocked('pro', p)) fail(`${p.name} darf für Pro nicht gesperrt sein.`);
}
console.log(`Anbieter: free=${free.length}, pro=${pro.length}`);

console.log('PLAN_OK');
