# FitRoom

Virtuelles Ankleidezimmer: Körpermaße eintragen, Outfits aus mehreren Anbietern
zusammenstellen, vor dem Kauf sehen, ob es passt. Free und Pro.

**Stand:** Basis-App fertig, 3D-Ansicht folgt. An der Stelle, wo der Körper
stehen wird, steht ein beschrifteter Platzhalter — alles andere funktioniert.

## Starten

```bash
npm install
npm run dev          # http://localhost:5183
```

Für Konten und Cloud-Speicherung `.env.local` anlegen (Vorlage: `.env.example`).
Ohne diese Datei läuft die App im Gastmodus mit localStorage — vollständig
benutzbar, nur nicht geräteübergreifend.

## Prüfen

```bash
npm run verify:all   # alle neun Gates am Stück
```

Einzeln: `typecheck`, `build`, `verify:body`, `verify:fit`, `verify:plan`,
`verify:catalog`, `verify:routes`, `verify:style`, `verify:serve`.
Jede Prüfung endet mit einem eigenen Token und hat eine Gegenprobe, damit sie
auch fehlschlagen kann. Was sie belegen, steht in `GATES.md`.

## Aufbau

| Ort | Inhalt |
|---|---|
| `src/lib/body.ts` | Körpermodell: Maße in cm → Höhen und Radien in Metern. Reine Funktionen, später von der 3D-Szene unverändert genutzt. |
| `src/lib/fit.ts` | Passform: Schnitt-Zugabe + Materialdehnung → Urteil je Zone, Gesamtnote, bessere Größe. |
| `src/lib/plan.ts` | Alle Free/Pro-Grenzen an einer Stelle. Die Oberfläche entscheidet nie selbst, sie fragt. |
| `src/lib/billing.ts` | Checkout in der Form eines echten Checkouts — dahinter steckt noch keine Zahlung. |
| `src/data/providers.ts` | `ProviderAdapter`: hier docken später echte Shop-APIs an. |
| `src/data/catalog.ts` | 42 Teile, 6 Anbieter, echte Größenläufe. |
| `src/data/repo.ts` | Die einzige Stelle, die Supabase kennt. Ohne Anmeldung schreibt dieselbe Schnittstelle in den localStorage. |
| `src/state/` | `app` (Maße, Outfit, Plan), `auth` (Anmeldung), `ui` (Palette, Einheit), `catalog` (was der Plan sehen darf). |
| `src/components/studio/Stage.tsx` | **Der Platzhalter.** Wird in der 3D-Runde ersetzt; die Seite drumherum bleibt unangetastet. |
| `src/styles/neuro-glass.css` | Design-System. Nicht direkt editieren — es kommt aus der neuro-glass-Skill. |

## Datenbank

Supabase-Projekt `FitRoom` (`tjqojhbdjjgftwyqpkmx`, eu-west-1).
Tabellen `profiles`, `body_profiles`, `outfits`, `favorites` — alle mit Row Level
Security, jeder sieht nur seine eigenen Zeilen.

`profiles.plan` ist für angemeldete Nutzer **nicht** beschreibbar (Trigger
`profiles_protect_plan`), sonst wäre Pro ein Konsolen-Einzeiler.

## Offene Punkte

1. **3D-Ansicht** — parametrischer Körper aus `body.ts`, prozedurale
   Kleidungsstücke je `GarmentShape`, Studio-Licht, Bild-Export.
   `three`, `@react-three/fiber` und `@react-three/drei` sind installiert.
2. **Echte Bezahlung** — `dev_activate_pro` / `dev_cancel_pro` in der Datenbank
   schalten den Plan ohne Zahlung um und sind vom Client aufrufbar. Mit Stripe
   werden beide gelöscht und durch einen Webhook mit Service-Key ersetzt;
   Pro-Inhalte gehören dann serverseitig gefiltert statt nur ausgeblendet.
3. **Echte Anbieter** — die sechs Shops sind erfunden. Eine Implementierung von
   `ProviderAdapter` mit `fetch()` reicht, die Oberfläche merkt nichts davon.
4. **Sichtprüfung** — die Seiten wurden noch nicht im Browser durchgeklickt.
