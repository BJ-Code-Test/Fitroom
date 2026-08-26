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
- [x] G8 — Neuro-Glass ist korrekt eingebunden: Palette, Intensität, Blob-Feld, Fallback
    CHECK: npm run verify:style
    EXPECT: STYLE_OK
- [x] G9 — Der Dev-Server startet und liefert die App samt Einstiegspunkt aus
    CHECK: npm run verify:serve
    EXPECT: SERVE_OK

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

## Ergebnis (gemessen am 26.08.2026)

Alle neun Gates erfüllt, jeweils mit Exit-Code 0 und passendem Token.
`npm run verify:all` läuft in einem Durchgang durch.

| Gate | Token | Belegte Zahl |
|------|-------|--------------|
| G1 | TYPECHECK_OK | 0 Fehler |
| G2 | BUILD_OK | 115 Module, 476 kB JS / 29 kB CSS |
| G3 | BODY_OK | Höhe, Umfänge, Beinlänge, Statur wirken messbar |
| G4 | FIT_OK | XS = zu-eng (16), L = passt (100), XXL = zu-weit (24) |
| G5 | PLAN_OK | 5 Funktionen, Free 3 Outfits / 3 Anbieter, Pro unbegrenzt / 6 |
| G6 | CATALOG_OK | 42 Teile, 6 Anbieter, alle 6 Kategorien belegt |
| G7 | ROUTES_OK | 12 Routen registriert (11 + 404), 11 Seiten-Dateien |
| G8 | STYLE_OK | Palette, Intensität, Blob-Feld, Fallback vorhanden |
| G9 | SERVE_OK | GET / = 200, main.tsx und App.tsx werden übersetzt |

**RLS:** alle vier Tabellen `rls_aktiv = true` (profiles 2 Policies, die drei
anderen je 1 für alle Operationen). Supabase-Advisor: von 8 Sicherheitshinweisen
auf 2 reduziert; die verbleibenden zwei betreffen ausschließlich
`dev_activate_pro` / `dev_cancel_pro` und sind der bekannte, oben beschriebene
Übergang bis zum echten Billing.

**NICHT erledigt — Sichtprüfung im Browser (HANDOFF):** Die Chrome-Erweiterung
war nicht verbunden ("Browser extension is not connected"), die Seiten wurden
also nicht mit eigenen Augen geprüft. Belegt ist nur, dass der Server sie
ausliefert und der Code übersetzt. Die Oberfläche gehört vor der nächsten
Runde einmal durchgeklickt.

### Nachtrag Sichtprüfung (26.08.2026)

Die Chrome-Erweiterung blieb nicht verbunden. Stattdessen wurden alle Seiten mit
`chrome --headless=new --screenshot` gerendert und angesehen. Dabei gefunden und
behoben:

1. **Fehlende Umlaute** — die gesamte Oberfläche war in Ersatzschreibweise
   gesetzt ("Koerpermasse", "Groesse"). 45 + 36 Dateien umgeschrieben
   (`scripts/fix-umlauts.mjs`, 659 Treffer). Der Preset-Schlüssel `kraeftig`
   blieb bewusst unangetastet, weil er Typ und Datenwert ist.
2. **Kachel-Rumpf plattgedrückt** — in der schmalen Studio-Spalte verlor
   `aspect-ratio` gegen die Zeilenhöhe des Rasters, Name und Preis fielen auf
   null. Feste Bildhöhe statt Seitenverhältnis (`.grid--mini`).

Danach `npm run verify:all` erneut vollständig grün.

**Weiterhin offen:** geprüft ist der gerenderte Zustand, nicht das Verhalten beim
Klicken (Anziehen, Speichern, Anmelden, Paywall). Das braucht eine Sitzung mit
verbundener Browser-Erweiterung oder einen Playwright-Durchlauf.
