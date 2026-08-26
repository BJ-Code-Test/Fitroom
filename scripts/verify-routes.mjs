/**
 * Beweist, dass jede geplante Route auch registriert ist und die Seite dahinter
 * als Datei existiert.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');

const fail = (msg) => {
  console.error('FEHLER:', msg);
  process.exit(1);
};

// Die erwartete Liste steht in App.tsx selbst (Konstante ROUTES).
const listBlock = app.match(/export const ROUTES = \[([\s\S]*?)\] as const;/);
if (!listBlock) fail('Die Konstante ROUTES fehlt in App.tsx.');
const expected = [...listBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

// Was tatsächlich als <Route path="..."> registriert ist.
const registered = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);

const missing = expected.filter((r) => !registered.includes(r));
if (missing.length > 0) fail(`Nicht registriert: ${missing.join(', ')}`);

if (!registered.includes('*')) fail('Es fehlt eine 404-Route.');

const extra = registered.filter((r) => r !== '*' && !expected.includes(r));
if (extra.length > 0) fail(`Registriert, aber nicht in ROUTES gelistet: ${extra.join(', ')}`);

console.log(`Routen: ${registered.length} registriert, ${expected.length} erwartet`);

// Jede importierte Seite muss es als Datei geben.
const imports = [...app.matchAll(/from '(\.\/pages\/[^']+)'/g)].map((m) => m[1]);
if (imports.length === 0) fail('App.tsx importiert keine einzige Seite.');
for (const rel of imports) {
  const file = join(root, 'src', `${rel.replace('./', '')}.tsx`);
  if (!existsSync(file)) fail(`Seite fehlt auf der Platte: ${file}`);
}
console.log(`Seiten-Dateien vorhanden: ${imports.length}`);

// Gegenprobe: eine erfundene Route darf nicht als registriert gelten.
if (registered.includes('/gibt-es-nicht')) fail('Die Prüfung erkennt erfundene Routen als vorhanden.');

console.log('ROUTES_OK');
