/**
 * Beweist den Zustand der Oberflaeche nach dem Umbau auf reinen Neumorphismus.
 *
 * Drei Dinge werden geprueft, und jedes kann fehlschlagen:
 *
 *  A) Anwesenheit — die neue Stildatei ist eingebunden, die Basisflaechen und
 *     alle im Code benutzten .ng-Klassen sind darin definiert, und
 *     prefers-reduced-motion wird respektiert.
 *  B) Abwesenheit — Neuro-Glass ist restlos weg: keine neuro-glass.css, keine
 *     Sicherungsdatei, kein backdrop-filter, kein .ng-field, keine Paletten
 *     und keine Intensitaetsstufen.
 *  C) Lesbarkeit — die Kontraste werden aus den Marken der Stildatei GERECHNET
 *     (nicht abgeschrieben) und muessen 4,5:1 fuer Text und 3:1 fuer den
 *     Fokusring halten, in beiden Helligkeiten.
 *
 * Am Ende steht eine Gegenprobe: dieselben Pruefroutinen werden gegen bekannte
 * Positiv- und Negativ-Faelle gefahren. Ohne sie waere eine Abwesenheitspruefung
 * nicht mehr wert als ein `true`.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const fail = (msg) => {
  console.error('FEHLER:', msg);
  process.exit(1);
};

// ------------------------------------------------------------ Werkzeuge

/** Alle Quelldateien unter src/ einsammeln. */
function sources(dir = join(root, 'src'), out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sources(full, out);
    else if (/\.(tsx?|css|html)$/.test(name)) out.push(full);
  }
  return out;
}

/** Wo taucht `needle` auf? Genau diese Routine traegt die Abwesenheitspruefungen. */
function findIn(files, needle) {
  const hits = [];
  for (const f of files) {
    if (readFileSync(f, 'utf8').includes(needle)) hits.push(relative(root, f));
  }
  return hits;
}

const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** Relative Leuchtdichte nach WCAG 2.1. */
function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Keine Hex-Farbe: ${hex}`);
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => srgb(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Kontrastverhaeltnis nach WCAG 2.1. */
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const round2 = (n) => Math.round(n * 100) / 100;

/** Die Marken aus einem :root-Block lesen. */
function tokens(css, selector) {
  const start = css.indexOf(selector);
  if (start < 0) fail(`Der Block ${selector} fehlt in neumorphism.css.`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const block = css.slice(open + 1, close);
  const map = {};
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) map[m[1]] = m[2].trim();
  return map;
}

// ============================================================== A) Anwesend

const files = sources();
const html = read('index.html');
const main = read('src/main.tsx');
const nm = read('src/styles/neumorphism.css');
const app = read('src/styles/app.css');

if (!/<html[^>]*\sdata-theme="(light|dark)"/.test(html)) {
  fail('index.html traegt kein data-theme — die Helligkeit haette keinen Startwert.');
}
if (!main.includes('styles/neumorphism.css')) fail('neumorphism.css wird in main.tsx nicht eingebunden.');
if (!main.includes('styles/app.css')) fail('app.css wird in main.tsx nicht eingebunden.');
console.log('Einbindung: neumorphism.css + app.css, data-theme auf <html>');

// Die Klassennamen stecken in fast allen Komponenten — jede muss definiert sein.
const NEEDED = [
  '.ng{', '.ng-inset', '.ng-btn', '.ng-input', '.ng-tabs', '.ng-tab',
  '.ng-toggle', '.ng-slider', '.ng-kpi', 'prefers-reduced-motion',
];
for (const needed of NEEDED) {
  if (!nm.includes(needed)) fail(`neumorphism.css fehlt: ${needed}`);
}
console.log(`neumorphism.css: ${NEEDED.length} Pflichtstuecke vorhanden`);

// Erhaben heisst: zwei Aussenschatten. Eine Hoehenstufe darf kein inset tragen.
for (const step of ['--ng-up-1', '--ng-up-2', '--ng-up-3', '--ng-up-4']) {
  const m = new RegExp(`${step}\\s*:\\s*([^;]+);`).exec(nm);
  if (!m) fail(`Die Hoehenstufe ${step} fehlt.`);
  if (m[1].includes('inset')) fail(`${step} enthaelt inset — eine erhabene Flaeche waere damit flach.`);
  if ((m[1].match(/var\(--ng-(light|shadow)\)/g) ?? []).length !== 2) {
    fail(`${step} hat nicht genau zwei Schatten (hell oben links, dunkel unten rechts).`);
  }
}
// Und die Tiefen umgekehrt: jede Lage muss inset sein.
for (const step of ['--ng-in-1', '--ng-in-2', '--ng-in-3']) {
  const m = new RegExp(`${step}\\s*:\\s*([^;]+);`).exec(nm);
  if (!m) fail(`Die Tiefenstufe ${step} fehlt.`);
  if ((m[1].match(/inset/g) ?? []).length !== 2) fail(`${step} ist nicht durchgehend inset.`);
}
console.log('Relief: 4 Hoehen ohne inset, 3 Tiefen durchgehend inset');

// Fokus braucht ein echtes outline — ein weicher Schatten kann ihn nicht zeigen.
if (!/:focus-visible[\s\S]{0,400}?\{[^}]*outline:\s*2px solid/.test(nm)) {
  fail('Kein echter Fokusring (outline) in neumorphism.css.');
}
if (!app.includes('prefers-reduced-motion')) fail('app.css respektiert prefers-reduced-motion nicht.');
console.log('Fokusring als outline, Bewegungsregel in beiden Dateien');

// ============================================================= B) Abwesend

for (const gone of ['src/styles/neuro-glass.css', 'src/styles/_app.glass.bak.css']) {
  if (existsSync(join(root, gone))) fail(`${gone} existiert noch — Neuro-Glass ist nicht entfernt.`);
}

const VERBOTEN = [
  ['backdrop-filter', 'Glas: backdrop-filter'],
  ['ng-field', 'das Blob-Feld'],
  ['neuro-glass', 'ein Verweis auf Neuro-Glass'],
  ['ng-p-', 'eine Palette-Klasse'],
  ['ng-i-', 'eine Intensitaets-Klasse'],
  ['PALETTES', 'das Palettensystem'],
  ['INTENSITIES', 'die Intensitaetsstufen'],
  ['--ng-glass', 'eine Glas-Marke'],
  ['--ng-rim', 'der innere Lichtstreifen an der Oberkante'],
];
for (const [needle, was] of VERBOTEN) {
  const hits = findIn(files, needle);
  if (hits.length > 0) fail(`Noch vorhanden — ${was} (${needle}) in: ${hits.join(', ')}`);
}
console.log(`Entfernt: ${VERBOTEN.length} Ueberreste, keiner mehr in ${files.length} Quelldateien`);

// ============================================================ C) Lesbarkeit

const hell = tokens(nm, ':root{');
const dunkel = tokens(nm, ':root[data-theme="dark"]{');

const MESSUNGEN = [
  ['Fliesstext hell', hell['--ng-txt'], hell['--ng-bg'], 4.5],
  ['gedaempfter Text hell', hell['--ng-txt-soft'], hell['--ng-bg'], 4.5],
  ['Akzent/Fokusring hell', hell['--ng-accent'], hell['--ng-bg'], 3],
  ['Schrift auf Akzent hell', hell['--ng-ink-on-accent'], hell['--ng-accent'], 4.5],
  ['Status "passt" hell', hell['--ng-ok'], hell['--ng-bg'], 4.5],
  ['Status "achtung" hell', hell['--ng-warn'], hell['--ng-bg'], 4.5],
  ['Status "passt nicht" hell', hell['--ng-bad'], hell['--ng-bg'], 4.5],
  ['Fliesstext dunkel', dunkel['--ng-txt'], dunkel['--ng-bg'], 4.5],
  ['gedaempfter Text dunkel', dunkel['--ng-txt-soft'], dunkel['--ng-bg'], 4.5],
  ['Akzent/Fokusring dunkel', dunkel['--ng-accent'], dunkel['--ng-bg'], 3],
  ['Schrift auf Akzent dunkel', dunkel['--ng-ink-on-accent'], dunkel['--ng-accent'], 4.5],
  ['Status "passt" dunkel', dunkel['--ng-ok'], dunkel['--ng-bg'], 4.5],
  ['Status "achtung" dunkel', dunkel['--ng-warn'], dunkel['--ng-bg'], 4.5],
  ['Status "passt nicht" dunkel', dunkel['--ng-bad'], dunkel['--ng-bg'], 4.5],
];

console.log('\nGemessene Kontraste (WCAG 2.1, aus den Marken der Stildatei gerechnet):');
for (const [name, fg, bg, min] of MESSUNGEN) {
  if (!fg || !bg) fail(`Eine Marke fuer "${name}" fehlt in neumorphism.css.`);
  const ratio = round2(contrast(fg, bg));
  const ok = ratio >= min;
  console.log(`  ${ok ? 'OK      ' : 'ZU WENIG'} ${name.padEnd(28)} ${fg} auf ${bg} = ${ratio}:1 (min ${min})`);
  if (!ok) fail(`${name}: ${ratio}:1 liegt unter ${min}:1.`);
}

// Untergrund und Flaeche muessen DIESELBE Farbe haben — sonst ist es kein
// Relief, sondern eine aufgelegte Scheibe.
if (!/\.ng\{[^}]*background:\s*var\(--ng-bg\)/.test(nm)) {
  fail('.ng traegt nicht die Grundfarbe — Untergrund und Flaeche waeren verschieden.');
}
if (!/body\{[^}]*background:\s*var\(--ng-bg\)/.test(nm)) {
  fail('body traegt nicht die Grundfarbe.');
}
console.log('\nUntergrund und Flaeche: beide var(--ng-bg)');

// ============================================================= Gegenprobe
// Ohne diesen Abschnitt koennte oben alles gruen sein, weil die Routinen nichts
// finden KOENNEN. Jede Routine wird darum einmal gegen einen bekannten Fall
// gefahren, in dem sie anschlagen MUSS.

{
  // 1. Die Anwesenheitspruefung darf keine erfundene Klasse finden.
  if (nm.includes('.ng-gibt-es-nicht')) fail('Gegenprobe: erfundene Klasse gilt als vorhanden.');

  // 2. Die Abwesenheitsroutine muss einen echten Treffer melden. Positivkontrolle:
  //    diese Datei selbst enthaelt "backdrop-filter" (in der Liste oben), also
  //    muss findIn hier genau einen Treffer liefern.
  const self = [join(root, 'scripts/verify-style.mjs')];
  if (findIn(self, 'backdrop-filter').length !== 1) {
    fail('Gegenprobe: findIn meldet keinen Treffer, wo einer ist — die Abwesenheitspruefung waere wertlos.');
  }
  // Der Suchbegriff wird zur Laufzeit zusammengesetzt, sonst stuende er als
  // Literal in dieser Datei und findIn wuerde sich selbst finden.
  const geistwort = ['xyzzy', 'kommt', 'nicht', 'vor'].join('-');
  if (findIn(self, geistwort).length !== 0) {
    fail('Gegenprobe: findIn meldet einen Treffer, wo keiner ist.');
  }

  // 3. Die Kontrastrechnung muss zwei bekannte Referenzwerte treffen und einen
  //    bekannt zu blassen Fall verwerfen.
  if (round2(contrast('#ffffff', '#000000')) !== 21) fail('Gegenprobe: Schwarz auf Weiss ergibt nicht 21:1.');
  if (round2(contrast('#e0e5ec', '#e0e5ec')) !== 1) fail('Gegenprobe: gleiche Farben ergeben nicht 1:1.');
  if (contrast('#9aa3b0', hell['--ng-bg']) >= 4.5) {
    fail('Gegenprobe: ein bekannt zu blasses Grau besteht die Kontrastschwelle.');
  }
}
console.log('Gegenprobe: alle vier Kontrollen wie erwartet');

console.log('STYLE_OK');
