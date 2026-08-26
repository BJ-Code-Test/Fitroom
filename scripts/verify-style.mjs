/**
 * Beweist, dass Neuro-Glass richtig eingebunden ist. Der Stil steht und fällt
 * mit dem Blob-Feld: ohne farbige Flächen im Hintergrund hat backdrop-filter
 * nichts zu brechen.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const fail = (msg) => {
  console.error('FEHLER:', msg);
  process.exit(1);
};

const html = read('index.html');
if (!/class="[^"]*ng-p-\w+/.test(html)) fail('index.html trägt keine Palette-Klasse (ng-p-...).');
if (!/class="[^"]*ng-i-[0-3]/.test(html)) fail('index.html trägt keine Intensitäts-Klasse (ng-i-...).');
console.log('index.html: Palette und Intensität gesetzt');

const main = read('src/main.tsx');
if (!main.includes('neuro-glass.css')) fail('neuro-glass.css wird nicht eingebunden.');
if (!main.includes('app.css')) fail('app.css wird nicht eingebunden.');
console.log('main.tsx: beide Stylesheets eingebunden');

const css = read('src/styles/neuro-glass.css');
for (const needed of ['.ng-field', '.ng{', '.ng-inset', 'backdrop-filter', '@supports not', 'prefers-reduced-motion']) {
  if (!css.includes(needed)) fail(`neuro-glass.css fehlt: ${needed}`);
}
console.log('neuro-glass.css: Basisflächen, Fallback und Bewegungsregel vorhanden');

const shell = read('src/components/layout/Shell.tsx');
if (!shell.includes('ng-field')) fail('Das Blob-Feld wird nirgends gerendert — ohne es kein Neuro-Glass.');

const app = read('src/App.tsx');
if (!app.includes('<NgField />')) fail('NgField ist nicht in App.tsx eingehängt.');
console.log('Blob-Feld wird gerendert');

// Gegenprobe: die Prüfung darf nicht alles durchwinken.
if (css.includes('.ng-gibt-es-nicht')) fail('Die Prüfung erkennt erfundene Klassen als vorhanden.');

console.log('STYLE_OK');
