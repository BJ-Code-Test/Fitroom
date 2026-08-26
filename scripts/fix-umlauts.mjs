/**
 * Einmalige Umschreibung: die Oberflaeche war in Ersatzschreibweise (ae/oe/ue/ss)
 * getippt. Deutscher Text gehoert mit echten Umlauten gesetzt.
 *
 * Bewusst NICHT ersetzt wird das kleingeschriebene `kraeftig`: das ist der
 * Schluessel des Koerper-Presets (BodyPreset) und steckt in Typen und Daten.
 * Nur die Beschriftung 'Kraeftig' wird umgestellt.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Reihenfolge zaehlt: laengere Woerter zuerst, sonst zerlegt das kurze das lange. */
const PAIRS = [
  ['Koerpermasse', 'Körpermaße'],
  ['Koerperhoehe', 'Körperhöhe'],
  ['Koerperzone', 'Körperzone'],
  ['Koerpermass', 'Körpermaß'],
  ['Koerper', 'Körper'],
  ['Groessentabelle', 'Größentabelle'],
  ['Groessenlaeufe', 'Größenläufe'],
  ['Groessenlauf', 'Größenlauf'],
  ['Einheitsgroesse', 'Einheitsgröße'],
  ['Konfektionsgroesse', 'Konfektionsgröße'],
  ['Schuhgroesse', 'Schuhgröße'],
  ['Groessen', 'Größen'],
  ['Groesse', 'Größe'],
  ['groesser', 'größer'],
  ['grosszuegig', 'großzügig'],
  ['Grossen', 'Großen'],
  ['gross', 'groß'],
  ['Fusslaenge', 'Fußlänge'],
  ['Fusslaengen', 'Fußlängen'],
  ['Fuss', 'Fuß'],
  ['Innenbeinlaenge', 'Innenbeinlänge'],
  ['Beinlaenge', 'Beinlänge'],
  ['Armlaenge', 'Armlänge'],
  ['laenge', 'länge'],
  ['Laenge', 'Länge'],
  ['laengere', 'längere'],
  ['laenger', 'länger'],
  ['Hueftumfang', 'Hüftumfang'],
  ['Huefte', 'Hüfte'],
  ['Hueft', 'Hüft'],
  ['Massen', 'Maßen'],
  ['Masse', 'Maße'],
  ['Umfaenge', 'Umfänge'],
  ['Verhaeltnis', 'Verhältnis'],
  ['Unterwaesche', 'Unterwäsche'],
  ['Waehrung', 'Währung'],
  ['auswaehlen', 'auswählen'],
  ['gewaehlt', 'gewählt'],
  ['waehlen', 'wählen'],
  ['waehlt', 'wählt'],
  ['Plaetze', 'Plätze'],
  ['Plaetzen', 'Plätzen'],
  ['naechste', 'nächste'],
  ['Naechste', 'Nächste'],
  ['spaeter', 'später'],
  ['Spaeter', 'Später'],
  ['zurueck', 'zurück'],
  ['Zurueck', 'Zurück'],
  ['rueckgaengig', 'rückgängig'],
  ['Ruecksendung', 'Rücksendung'],
  ['ueber', 'über'],
  ['Ueber', 'Über'],
  ['fuer', 'für'],
  ['Fuer', 'Für'],
  ['muessen', 'müssen'],
  ['muesste', 'müsste'],
  ['koennen', 'können'],
  ['koennte', 'könnte'],
  ['moechte', 'möchte'],
  ['oeffnen', 'öffnen'],
  ['loeschen', 'löschen'],
  ['Loeschen', 'Löschen'],
  ['geloescht', 'gelöscht'],
  ['endgueltig', 'endgültig'],
  ['aendern', 'ändern'],
  ['Aendern', 'Ändern'],
  ['aendert', 'ändert'],
  ['Schliessen', 'Schließen'],
  ['schliesst', 'schließt'],
  ['fliessen', 'fließen'],
  ['bestaetige', 'bestätige'],
  ['Bestaetigung', 'Bestätigung'],
  ['gehoeren', 'gehören'],
  ['gehoert', 'gehört'],
  ['Ausserdem', 'Außerdem'],
  ['ausserhalb', 'außerhalb'],
  ['Kuendigung', 'Kündigung'],
  ['kuendbar', 'kündbar'],
  ['guenstiger', 'günstiger'],
  ['uebernommen', 'übernommen'],
  ['uebernehmen', 'übernehmen'],
  ['Pruefung', 'Prüfung'],
  ['pruefen', 'prüfen'],
  ['prueft', 'prüft'],
  ['haengt', 'hängt'],
  ['laesst', 'lässt'],
  ['Faellt', 'Fällt'],
  ['faellt', 'fällt'],
  ['Zaehler', 'Zähler'],
  ['Restzaehler', 'Restzähler'],
  ['Aufloesung', 'Auflösung'],
  ['Vorschlaege', 'Vorschläge'],
  ['Stilvorschlaege', 'Stilvorschläge'],
  ['Ausreisser', 'Ausreißer'],
  ['Aufschluesselung', 'Aufschlüsselung'],
  ['Schluessel', 'Schlüssel'],
  ['Waldgruen', 'Waldgrün'],
  ['Signalorange', 'Signalorange'],
  ['Naturweiss', 'Naturweiß'],
  ['Weiss', 'Weiß'],
  ['weiss', 'weiß'],
  ['regulaer', 'regulär'],
  ['Oberflaeche', 'Oberfläche'],
  ['Flaeche', 'Fläche'],
  ['Flaechen', 'Flächen'],
  ['naemlich', 'nämlich'],
  ['taeglich', 'täglich'],
  ['jaehrlich', 'jährlich'],
  ['Jaehrlich', 'Jährlich'],
  ['haelt', 'hält'],
  ['erhaelt', 'erhält'],
  ['Anhaengen', 'Anhängen'],
  ['angehaengt', 'angehängt'],
  ['eingehaengt', 'eingehängt'],
  ['Erweiterung', 'Erweiterung'],
  ['Kraeftig', 'Kräftig'],
  ['Verfuegung', 'Verfügung'],
  ['verfuegbar', 'verfügbar'],
  ['duerfen', 'dürfen'],
  ['duerfte', 'dürfte'],
  ['darueber', 'darüber'],
  ['wuerde', 'würde'],
  ['wuerden', 'würden'],
  ['Stueck', 'Stück'],
  ['Kleidungsstueck', 'Kleidungsstück'],
  ['Kleidungsstuecke', 'Kleidungsstücke'],
  ['zusaetzlich', 'zusätzlich'],
  ['Anschliessend', 'Anschließend'],
  ['schliesslich', 'schließlich'],

  // Zweiter Durchgang: was der erste stehen gelassen hat.
  // `Hoehe` kollidiert nicht mit `euShoeSize` — dort steht 'Shoe', nicht 'hoehe'.
  ['Aussagekraeftig', 'Aussagekräftig'],
  ['Basisflaechen', 'Basisflächen'],
  ['Glasflaechen', 'Glasflächen'],
  ['Befehlspruefung', 'Befehlsprüfung'],
  ['Sitzungspruefung', 'Sitzungsprüfung'],
  ['Sichtpruefung', 'Sichtprüfung'],
  ['Begruendung', 'Begründung'],
  ['Buehne', 'Bühne'],
  ['Buero', 'Büro'],
  ['Datensaetze', 'Datensätze'],
  ['Endgueltig', 'Endgültig'],
  ['Farbintensitaet', 'Farbintensität'],
  ['Intensitaets', 'Intensitäts'],
  ['Intensitaet', 'Intensität'],
  ['Fuellgrad', 'Füllgrad'],
  ['Gehoert', 'Gehört'],
  ['Geraeten', 'Geräten'],
  ['geraeteübergreifend', 'geräteübergreifend'],
  ['Grundgeruest', 'Grundgerüst'],
  ['Hoechstpreis', 'Höchstpreis'],
  ['Schulterhoehe', 'Schulterhöhe'],
  ['Hoehen', 'Höhen'],
  ['Hoehe', 'Höhe'],
  ['Huelle', 'Hülle'],
  ['Kleidungsplaetze', 'Kleidungsplätze'],
  ['Speicherplaetzen', 'Speicherplätzen'],
  ['Knoepfe', 'Knöpfe'],
  ['Laedt', 'Lädt'],
  ['Laeuft', 'Läuft'],
  ['Leerzustaende', 'Leerzustände'],
  ['Pruefen', 'Prüfen'],
  ['Prueft', 'Prüft'],
  ['Rahmengenaeht', 'Rahmengenäht'],
  ['Rippmuetze', 'Rippmütze'],
  ['Roecke', 'Röcke'],
  ['erfuellt', 'erfüllt'],
  ['ergaenzt', 'ergänzt'],
  ['faehrt', 'fährt'],
  ['faengt', 'fängt'],
  ['gefuellt', 'gefüllt'],
  ['fuellt', 'füllt'],
  ['gaebe', 'gäbe'],
  ['gedaempft', 'gedämpft'],
  ['gegenlaeufig', 'gegenläufig'],
  ['ungueltige', 'ungültige'],
  ['gueltig', 'gültig'],
  ['haengen', 'hängen'],
  ['haette', 'hätte'],
  ['huefthoch', 'hüfthoch'],
  ['kuerzer', 'kürzer'],
  ['verkuerzen', 'verkürzen'],
  ['laessig', 'lässig'],
  ['laeuft', 'läuft'],
  ['noetig', 'nötig'],
  ['oeffentlichen', 'öffentlichen'],
  ['staerker', 'stärker'],
  ['tatsaechlich', 'tatsächlich'],
  ['traegt', 'trägt'],
  ['vollstaendig', 'vollständig'],
  ['waeren', 'wären'],
  ['waere', 'wäre'],
];

const exts = new Set(['.ts', '.tsx', '.mts', '.mjs', '.css', '.html', '.md']);
const skipDirs = new Set(['node_modules', 'dist', '.git']);

let files = 0;
let hits = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (skipDirs.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!exts.has(extname(entry))) continue;
    // Diese Datei selbst enthaelt beide Schreibweisen als Daten.
    if (entry === 'fix-umlauts.mjs') continue;
    // Die Stildatei ist bewusst durchgehend in ASCII gehalten: ihre Kommentare
    // erklaeren das Relief und sollen in jeder Werkzeugkette lesbar bleiben.
    if (entry === 'neumorphism.css') continue;

    const before = readFileSync(full, 'utf8');
    let after = before;
    for (const [from, to] of PAIRS) {
      after = after.split(from).join(to);
    }
    if (after !== before) {
      writeFileSync(full, after, 'utf8');
      files += 1;
      for (const [from] of PAIRS) {
        hits += before.split(from).length - 1;
      }
    }
  }
}

// Vom Projektwurzelverzeichnis aus — src, scripts und die Dokumente sind darin.
walk(root);

console.log(`Dateien geaendert: ${files}, Treffer: ${hits}`);
