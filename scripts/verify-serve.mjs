/**
 * Startet den Dev-Server, ruft ihn ab und fährt ihn wieder herunter.
 * Der Build allein beweist noch nicht, dass die App ausgeliefert wird.
 *
 * Vite läuft hier über seine Node-API statt als Kind-Prozess: das Beenden
 * eines per Shell gestarteten Kind-Prozesses bringt libuv unter Windows zum
 * Absturz, nachdem die Prüfung eigentlich schon durch war.
 */
import { createServer } from 'vite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5199;

let server;

const fail = async (msg) => {
  console.error('FEHLER:', msg);
  await server?.close();
  process.exit(1);
};

server = await createServer({
  root,
  configFile: join(root, 'vite.config.ts'),
  logLevel: 'error',
  server: { port: PORT, strictPort: true },
});
await server.listen();

const base = `http://localhost:${PORT}`;

// --- Die Startseite muss die App-Hülle liefern --------------------------
const res = await fetch(`${base}/`);
if (!res.ok) await fail(`Startseite antwortete mit ${res.status}`);
const html = await res.text();
if (!html.includes('id="root"')) await fail('Die Antwort enthält kein #root.');
if (!/ng-p-\w+/.test(html)) await fail('Die Antwort trägt keine Palette-Klasse.');
console.log(`GET / -> ${res.status}, ${html.length} Zeichen`);

// --- Der Einstiegspunkt muss als Modul ausgeliefert werden ---------------
const mod = await fetch(`${base}/src/main.tsx`);
if (!mod.ok) await fail(`main.tsx wurde nicht ausgeliefert (${mod.status})`);
const modText = await mod.text();
if (!modText.includes('createRoot')) await fail('main.tsx kam ohne createRoot zurück.');
console.log(`GET /src/main.tsx -> ${mod.status}, ${modText.length} Zeichen`);

// --- App.tsx muss ebenfalls übersetzt werden (fängt Importfehler) ------
const app = await fetch(`${base}/src/App.tsx`);
const appText = await app.text();
if (!app.ok || !appText.includes('Routes')) await fail(`App.tsx wurde nicht übersetzt (${app.status}).`);
console.log(`GET /src/App.tsx -> ${app.status}, ${appText.length} Zeichen`);

// --- Gegenprobe ----------------------------------------------------------
// Vite beantwortet unbekannte Pfade absichtlich mit der Startseite
// (SPA-Fallback) — der Statuscode sagt hier also nichts aus. Aussagekräftig
// ist, dass die Modul-Abrufe oben echten Modulcode geliefert haben und nicht
// denselben Fallback; sonst würde diese Prüfung alles durchwinken.
const ghost = await fetch(`${base}/src/gibt-es-nicht.tsx`);
const ghostText = await ghost.text();
if (ghostText.includes('createRoot')) {
  await fail('Auch ein erfundenes Modul liefert createRoot — die Prüfung wäre wertlos.');
}
if (ghostText === modText) await fail('Erfundenes Modul und main.tsx liefern dasselbe.');
console.log(`GET /src/gibt-es-nicht.tsx -> ${ghost.status}, kein Modulcode (erwartet)`);

await server.close();
console.log('SERVE_OK');
