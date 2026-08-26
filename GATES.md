# GATES — FitRoom Basis-App (ohne 3D)

SCOPE: Web-App unter D:\FitRoom. Navigation und alle Seiten, Konten und Daten
über Supabase, Katalog mehrerer Anbieter, Passform-Rechnung, Free/Pro-Schranke.
Die 3D-Ansicht ist bewusst NICHT Teil dieser Runde — an ihrer Stelle steht ein
beschrifteter Platzhalter (`src/components/studio/Stage.tsx`).

OWNS: D:/FitRoom/**

Jede Prüfung hat einen eigenen Erfolgs-Token und eine Gegenprobe, damit sie
auch fehlschlagen kann.

---

- [x] G1 — TypeScript ist im ganzen Projekt fehlerfrei
    CHECK: npm run typecheck
    EXPECT: TYPECHECK_OK
- [x] G2 — Produktions-Build läuft durch und erzeugt ein Bundle
    CHECK: npm run build
    EXPECT: BUILD_OK
- [x] G3 — Das Körpermodell reagiert messbar auf jedes Mass
    CHECK: npm run verify:body
    EXPECT: BODY_OK
- [x] G4 — Die Passform unterscheidet: zu klein, passend und zu groß ergeben verschiedene Urteile
    CHECK: npm run verify:fit
    EXPECT: FIT_OK
- [x] G5 — Free-Grenzen greifen, Pro hebt sie auf
    CHECK: npm run verify:plan
    EXPECT: PLAN_OK
- [x] G6 — Katalog ist vollständig: alle Kategorien belegt, jeder Anbieter hat Ware, Größenläufe steigen
    CHECK: npm run verify:catalog
    EXPECT: CATALOG_OK
- [x] G7 — Jede geplante Route ist registriert und ihre Seite existiert als Datei
    CHECK: npm run verify:routes
    EXPECT: ROUTES_OK
- [x] G8 — Reiner Neumorphismus: neue Stildatei eingebunden, .ng/.ng-inset definiert,
      Neuro-Glass restlos entfernt (kein backdrop-filter, kein Blob-Feld, keine Paletten),
      prefers-reduced-motion respektiert, und alle Kontraste gemessen ueber 4,5:1 bzw. 3:1
    CHECK: npm run verify:style
    EXPECT: STYLE_OK
- [x] G9 — Der Dev-Server startet und liefert die App samt Einstiegspunkt aus
    CHECK: npm run verify:serve
    EXPECT: SERVE_OK
- [x] G10 — Die Ende-zu-Ende-Tests laufen vollständig durch: jede Seite wird im
      echten Browser bedient, und was der Nutzer zusammenstellt, überlebt einen Neuladen
    CHECK: npm run verify:e2e
    EXPECT: E2E_OK

## Ausserhalb der Befehlsprüfung

- **RLS in Supabase** — über das Supabase-MCP geprüft: alle vier Tabellen haben
  Row Level Security aktiv, und `profiles.plan` ist für angemeldete Nutzer nicht
  beschreibbar (Trigger `profiles_protect_plan`). Belegt im Abschlussbericht.
- **Sichtprüfung der Seiten** — die Routen werden im Browser durchgegangen.

## Bewusst offen (kein Gate, sondern Handoff)

- **Bezahlung** ist nicht echt. `dev_activate_pro` / `dev_cancel_pro` schalten den
  Plan ohne Zahlung um; sie sind vom Client aufrufbar und damit keine Sicherheit.
  Mit Stripe werden beide Funktionen gelöscht und durch einen Webhook mit
  Service-Key ersetzt.
- **3D-Ansicht** folgt in einer eigenen Runde.

---

## Runde "Neumorphismus pur" (Branch stil/neumorphismus-pur)

Der Umbau von Neuro-Glass auf reinen Neumorphismus wurde mitten in den
Testanpassungen abgebrochen. G1-G9 stehen, G10 ist offen. Zusaetzlich zu den
zehn Gates gilt fuer diese Runde:

- [x] G11 — Die Flaechen ragen sichtbar aus dem Untergrund heraus.
      MANUELL: /, /studio, /katalog, /masse und /preise als Screenshot
      gerendert (chrome --headless=new) und mit dem Read-Werkzeug angesehen.
      Erwartet: zwei kraeftige Aussenschatten, kein diffuser Schimmer an der
      Oberkante, keine flach aufliegende Flaeche.
- [x] G12 — Kein Test wurde abgeschwaecht, um ihn gruen zu bekommen. Die drei
      Stil-Tests (gleiche Farbe wie Untergrund, kein inset am Aussenschatten,
      echter Fokusring) bleiben in voller Schaerfe.
      MANUELL: der Vergleich gegen main zeigt fuer diese drei Tests nur die
      Reparatur kaputter regulaerer Ausdruecke, keine gelockerte Erwartung.
- [x] G13 — Die Umstellung ist vollstaendig: kein backdrop-filter, kein
      Blob-Feld, keine Palettenklassen (ng-p-*, ng-i-*) und keine Reste von
      neuro-glass.css.
      MANUELL: Volltextsuche ueber das ganze Arbeitsverzeichnis (ohne
      node_modules, dist, .git) statt nur ueber src/ wie in G8.

---

## Ergebnis der Stil-Runde (gemessen am 26.08.2026, Branch stil/neumorphismus-pur)

`npm run verify:all` laeuft in einem Durchgang durch, Exit-Code 0, alle zehn
Token gesetzt. G11 bis G13 sind manuell belegt.

| Gate | Token | Belegte Zahl |
|------|-------|--------------|
| G1 | TYPECHECK_OK | 0 Fehler — und `tests/` ist jetzt mit drin (siehe unten) |
| G2 | BUILD_OK | Bundle gebaut |
| G3 | BODY_OK | Hoehe, Umfaenge, Beinlaenge, Statur wirken messbar |
| G4 | FIT_OK | XS = zu-eng (16), L = passt (100), XXL = zu-weit (24) |
| G5 | PLAN_OK | 5 Funktionen, Free 3 Outfits / 3 Anbieter, Pro unbegrenzt / 6 |
| G6 | CATALOG_OK | 42 Teile, 6 Anbieter, alle 6 Kategorien belegt |
| G7 | ROUTES_OK | 12 Routen registriert, 11 Seiten-Dateien |
| G8 | STYLE_OK | 10 Pflichtstuecke, 9 Ueberreste in 39 Quelldateien nicht mehr auffindbar, 14 Kontraste gerechnet |
| G9 | SERVE_OK | GET / = 200, main.tsx und App.tsx werden uebersetzt |
| G10 | E2E_OK | 33 Tests, 33 bestanden, 0 gescheitert (Chrome, 17,0 s) |

### Was in dieser Runde noch zu tun war

1. **Zwei zerschossene regulaere Ausdruecke** in `tests/e2e/einstellungen.spec.ts`.
   Beiden fehlte der Rueckstrich: `/rgba?(/g` statt `/rgba?\(/g` (unbalancierte
   Gruppe, Playwright brach beim Laden der Datei ab, bevor irgendein Test lief)
   und `/d+/g` statt `/\d+/g` in `helligkeit()`. Danach liefen alle 33 Tests
   ohne weitere Aenderung durch — inhaltlich war die Datei fertig.
2. **Das Relief war zu schwach und leuchtete oben.** Siehe unten.
3. **Drei tote Verweise** auf das entfernte Design-System: `README.md` (Tabelle
   und Gate-Zahl) und die Ausnahme in `scripts/fix-umlauts.mjs`.

### G11 — Sichtpruefung (manuell, erfuellt)

`/`, `/studio`, `/katalog`, `/masse`, `/preise`, `/einstellungen` als Screenshot
gerendert (`chrome --headless=new`, 1600x1150), dazu `/preise`, `/masse`,
`/studio` in Dunkel und `/studio`, `/masse` bei 390px Breite. Angesehen wurde
jedes Bild einzeln, mehrere zusaetzlich in zweifacher Vergroesserung.

**Befund im Ausgangszustand:** die Flaechen lagen auf dem Grund statt in ihm.
Der helle Schatten (`-12px -12px 18px #ffffff`) streute rund 20px weit und
bildete ueber jeder Karte ein breites Leuchten; der dunkle Schatten
(`13px 13px 20px #9aa9c0`) war so blass, dass er die Hoehe nicht trug. Das ist
genau die Beschwerde "das Helle oben an den Boxen passt nicht".

**Aenderung:** die zwei Aussenschatten sind nicht mehr symmetrisch. Das Licht
ist kurz und straff (halber Versatz des Schattens, kleiner Weichzeichner) und
markiert die beleuchtete Facette; der Schatten faellt doppelt so weit, ist
weicher und mit `#8697b5` deutlich dunkler. Sechs Varianten wurden zum Vergleich
nebeneinander gerendert, bevor eine gewaehlt wurde. Zusaetzlich faellt die
Hoehenleiter unter 760px Breite um rund ein Drittel: in festen Pixeln notiertes
Relief traegt sonst auf einer 130px-Kachel einen Schatten wie einen Umhang.

### G12 — Keine abgeschwaechten Tests (manuell, erfuellt)

Gegen `main` verglichen enthaelt `tests/` genau zwei geaenderte Zeilen, beide
Reparaturen kaputter regulaerer Ausdruecke. Keine Erwartung wurde gelockert.
Die drei Stil-Tests wurden stattdessen einzeln gegen einen bekannten Fehlerfall
gefahren, in dem sie anschlagen MUESSEN:

| Eingriff | erwartet gescheitert | tatsaechlich |
|---|---|---|
| `.ng` auf `#eef1f6` eingefaerbt | "herausgeformt, nicht aufgelegt" | genau dieser, 5 andere gruen |
| `inset 0 1px 0 rgba(255,255,255,.8)` an `.ng` ergaenzt | "herausgeformt, nicht aufgelegt" | genau dieser, 5 andere gruen |
| Fokus-`outline` auf `0` gesetzt | "echter Fokusring" | genau dieser, 5 andere gruen |
| dunkles `--ng-bg` auf den hellen Wert gesetzt | "Helligkeit laesst sich umstellen" | genau dieser, 5 andere gruen |

### G13 — Umstellung vollstaendig (manuell, erfuellt)

Volltextsuche ueber das ganze Arbeitsverzeichnis (ohne `node_modules`, `dist`,
`.git`, `test-results`, `assets`, `package-lock.json`) nach `backdrop-filter`,
`ng-field`, `neuro-glass`, `ng-p-`, `ng-i-`, `PALETTES`, `INTENSITIES`,
`--ng-glass`, `--ng-rim`: **kein Treffer** ausserhalb von `GATES.md` und
`scripts/verify-style.mjs`, die die Begriffe als Suchdaten fuehren. Damit ist
die Suche breiter als G8, das nur `src/` abklopft. `src/styles/` enthaelt genau
zwei Dateien: `neumorphism.css` und `app.css`. `index.html` traegt nur noch
`data-theme="light"`, keine Palettenklasse. Der Migrationsschritt in
`src/state/ui.ts` (Version 3) nennt `palette` noch — absichtlich: er muss den
alten Wert aus dem Browserspeicher lesen koennen, um ihn abzuloesen.

### Nebenbefund: typecheck sah die Tests gar nicht

`tsconfig.json` schloss nur `src` ein. Ein Syntaxfehler in einer Testdatei kam
so an G1 und G2 vorbei und fiel erst im Browserlauf auf — genau das war hier
passiert. `include` steht jetzt auf `["src", "tests"]`. Gegenprobe: mit
zurueckgedrehtem Rueckstrich meldet `npm run typecheck`
`einstellungen.spec.ts(60,42): error TS1005` und endet mit Exit 1; reparariert
meldet es wieder `TYPECHECK_OK`.

### Weiterhin offen (Handoff, unveraendert)

- **Bezahlung** ist nicht echt; `dev_activate_pro` / `dev_cancel_pro` sind vom
  Client aufrufbar.
- **3D-Ansicht** folgt in einer eigenen Runde.
- **Die Hoehenleiter kennt zwei Massstaebe** (ab und unter 760px). Fuer sehr
  grosse Bildschirme fehlt ein dritter; dort wirkt das Relief eher zu klein.
