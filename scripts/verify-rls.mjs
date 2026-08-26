/**
 * Beweist Row Level Security — nicht, dass Policies existieren, sondern dass sie greifen.
 *
 * Zwei Identitäten, echte Tokens, echter Kreuzzugriff: A versucht die Zeilen von B
 * zu lesen, zu ändern und zu löschen. Alle drei müssen ins Leere laufen, und B muss
 * danach unverändert dastehen — "null Zeilen" allein ist kein Beweis, es kann auch
 * eine kaputte Abfrage sein. Deshalb hat jede Verneinung hier eine Positivkontrolle
 * daneben, die gelingen MUSS.
 *
 * Drei Betriebsarten, je nachdem was an Zugangsdaten da ist:
 *
 *   1. SUPABASE_SERVICE_ROLE_KEY gesetzt  → vollständig und in sich geschlossen.
 *      Das Skript legt beide Wegwerf-Konten selbst an, beweist alles und löscht
 *      sie mitsamt Daten wieder.
 *   2. RLS_TEST_A_EMAIL/_PASSWORD und RLS_TEST_B_EMAIL/_PASSWORD gesetzt
 *      → vollständig. Die Konten müssen vorher bestehen (z. B. über das
 *      Supabase-MCP angelegt); das Skript räumt nur die erzeugten Zeilen weg.
 *   3. Nichts davon → eingeschränkt. Geprüft wird alles, was ohne Anmeldung geht:
 *      anonym darf keine der vier Tabellen etwas herausgeben und nichts schreiben.
 *      Was NICHT geprüft werden konnte, steht dann ausdrücklich im Protokoll —
 *      lieber ein begrenzter echter Test als ein vorgetäuschter vollständiger.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ------------------------------------------------------------------ Umgebung

const SCHLUESSEL = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RLS_TEST_A_EMAIL',
  'RLS_TEST_A_PASSWORD',
  'RLS_TEST_B_EMAIL',
  'RLS_TEST_B_PASSWORD',
];

function ausDatei(pfad) {
  const werte = {};
  let text;
  try {
    text = readFileSync(pfad, 'utf8');
  } catch {
    return werte;
  }
  for (const zeile of text.split(/\r?\n/)) {
    const sauber = zeile.trim();
    if (!sauber || sauber.startsWith('#')) continue;
    const trenner = sauber.indexOf('=');
    if (trenner < 0) continue;
    werte[sauber.slice(0, trenner).trim()] = sauber.slice(trenner + 1).trim();
  }
  return werte;
}

const env = ausDatei(join(root, '.env.local'));
for (const k of SCHLUESSEL) if (process.env[k]) env[k] = process.env[k];

if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
  console.error('FEHLER: VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY fehlen (.env.local).');
  process.exit(1);
}

// -------------------------------------------------------------- Prüfmaschine

let bestanden = 0;
const nichtGeprueft = [];

const neuerClient = (key = env.VITE_SUPABASE_ANON_KEY) =>
  createClient(env.VITE_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

function scheitern(titel, detail) {
  console.error('');
  console.error(`  GESCHEITERT: ${titel}`);
  if (detail) console.error(`               ${detail}`);
  console.error('');
  console.error(`FEHLER: ${titel}`);
  process.exit(1);
}

/** Eine Prüfung, die auch scheitern können muss. */
function pruefe(bedingung, titel, detail = '') {
  if (!bedingung) scheitern(titel, detail);
  bestanden += 1;
  console.log(`  ok   ${titel}${detail ? ` — ${detail}` : ''}`);
}

const kopf = (text) => console.log(`\n${text}\n${'-'.repeat(text.length)}`);

/** PostgREST-Fehler lesbar machen. */
const fehlerText = (e) => (e ? `${e.code ?? '?'} ${e.message}` : 'kein Fehler');

/** `.eq()` für jede Spalte des Filters anhängen. */
function mitFilter(abfrage, filter) {
  let q = abfrage;
  for (const [spalte, wert] of Object.entries(filter)) q = q.eq(spalte, wert);
  return q;
}

const TABELLEN = ['profiles', 'body_profiles', 'outfits', 'favorites'];

// ============================================================================
// 1. Gegenprobe der Prüfmethode selbst
// ============================================================================
//
// Alles Folgende schließt aus leeren Ergebnissen auf Sicherheit. Das ist nur
// zulässig, wenn ein leeres Ergebnis etwas anderes ist als ein Fehlschlag der
// Abfrage. Also zuerst: eine Tabelle, die es nicht gibt, MUSS einen Fehler
// liefern — sonst kann dieses Skript zwischen "nichts da" und "geht nicht"
// nicht unterscheiden und jeder spätere Beweis wäre wertlos.

kopf('1. Gegenprobe: leeres Ergebnis ist nicht dasselbe wie ein Fehler');

{
  const anon = neuerClient();
  const erfunden = await anon.from('tabelle_die_es_nicht_gibt').select('*').limit(1);
  pruefe(
    erfunden.error !== null,
    'Eine erfundene Tabelle liefert einen Fehler, kein leeres Ergebnis',
    fehlerText(erfunden.error),
  );

  for (const tabelle of TABELLEN) {
    const echt = await anon.from(tabelle).select('*').limit(1);
    pruefe(
      echt.error === null,
      `Die Abfrage auf ${tabelle} erreicht die Tabelle wirklich`,
      'HTTP 200, kein Fehlerobjekt',
    );
  }
}

// ============================================================================
// 2. Ohne Anmeldung: nichts sehen, nichts schreiben
// ============================================================================

kopf('2. Anonym (nur anon-Key, keine Anmeldung)');

{
  const anon = neuerClient();

  for (const tabelle of TABELLEN) {
    const { data, error } = await anon.from(tabelle).select('*');
    pruefe(
      error === null && Array.isArray(data) && data.length === 0,
      `${tabelle}: anonym sind 0 Zeilen sichtbar`,
      error ? fehlerText(error) : `${data.length} Zeilen`,
    );
  }

  const schreibversuche = [
    ['profiles', { id: '00000000-0000-0000-0000-0000000000aa', display_name: 'anon' }],
    ['body_profiles', { user_id: '00000000-0000-0000-0000-0000000000aa', height: 180, shoulder: 45, chest: 100, waist: 85, hip: 100, inseam: 80, foot: 27 }],
    ['outfits', { user_id: '00000000-0000-0000-0000-0000000000aa', name: 'anon' }],
    ['favorites', { user_id: '00000000-0000-0000-0000-0000000000aa', garment_id: 'anon' }],
  ];
  for (const [tabelle, zeile] of schreibversuche) {
    const { error } = await anon.from(tabelle).insert(zeile);
    pruefe(error !== null, `${tabelle}: anonymes INSERT wird abgewiesen`, fehlerText(error));
  }

  for (const funktion of ['dev_activate_pro', 'dev_cancel_pro']) {
    const { error } = await anon.rpc(funktion, funktion === 'dev_activate_pro' ? { p_interval: 'monthly' } : {});
    pruefe(error !== null, `${funktion}: anonymer Aufruf wird abgewiesen`, fehlerText(error));
  }
}

// ============================================================================
// 3. Zwei Identitäten: Kreuzzugriff
// ============================================================================

const dienst = env.SUPABASE_SERVICE_ROLE_KEY ? neuerClient(env.SUPABASE_SERVICE_ROLE_KEY) : null;

/** Zugangsdaten der beiden Wegwerf-Konten beschaffen. */
async function kontenBesorgen() {
  if (dienst) {
    const stempel = Date.now().toString(36);
    const konten = [];
    for (const buchstabe of ['a', 'b']) {
      const email = `rls-test-${buchstabe}-${stempel}@fitroom.invalid`;
      const passwort = `RlsTest-${buchstabe}-${stempel}-!Aa9`;
      const { data, error } = await dienst.auth.admin.createUser({
        email,
        password: passwort,
        email_confirm: true,
        user_metadata: { display_name: `RLS Test ${buchstabe.toUpperCase()}` },
      });
      if (error) throw new Error(`Testkonto ${buchstabe} liess sich nicht anlegen: ${error.message}`);
      konten.push({ email, passwort, uid: data.user.id, selbstAngelegt: true });
    }
    return konten;
  }

  const a = { email: env.RLS_TEST_A_EMAIL, passwort: env.RLS_TEST_A_PASSWORD };
  const b = { email: env.RLS_TEST_B_EMAIL, passwort: env.RLS_TEST_B_PASSWORD };
  if (a.email && a.passwort && b.email && b.passwort) return [a, b];
  return null;
}

/**
 * Legt für ein Konto je eine Zeile in allen vier Tabellen an.
 *
 * Vorher wird geleert, was von einem früheren Lauf übrig ist. Ein abgebrochener
 * Durchgang hinterlässt sonst Zeilen, und `body_profiles` lässt pro Konto nur
 * einen Standard zu (`body_profiles_one_default`) — der zweite Lauf wäre am
 * eigenen Müll gescheitert statt an einem Sicherheitsproblem. Das trifft nur
 * die Wegwerf-Konten, deren Daten dieses Skript ohnehin selbst erzeugt.
 */
async function saeen(client, uid, marke) {
  for (const tabelle of ['favorites', 'outfits', 'body_profiles']) {
    const { error } = await client.from(tabelle).delete().eq('user_id', uid);
    if (error) scheitern(`${marke}: ${tabelle} liess sich nicht vorab leeren`, fehlerText(error));
  }

  const profil = await client
    .from('profiles')
    .update({ display_name: `${marke} Profil` })
    .eq('id', uid)
    .select('id, display_name, plan');
  if (profil.error || profil.data.length !== 1) {
    scheitern(`${marke}: kein eigenes Profil beschreibbar`, fehlerText(profil.error));
  }

  // Ein Lauf muss auf plan = free starten, sonst ist die Plan-Prüfung blind.
  const zurueck = await client.rpc('dev_cancel_pro');
  if (zurueck.error) scheitern(`${marke}: Plan liess sich nicht auf free zuruecksetzen`, fehlerText(zurueck.error));

  const koerper = await client
    .from('body_profiles')
    .insert({
      user_id: uid,
      name: `${marke} Maße`,
      height: 180, shoulder: 45, chest: 100, waist: 85, hip: 100, inseam: 80, foot: 27,
      is_default: true,
    })
    .select('id')
    .single();
  if (koerper.error) scheitern(`${marke}: body_profiles`, fehlerText(koerper.error));

  const outfit = await client
    .from('outfits')
    .insert({ user_id: uid, name: `${marke} Outfit`, worn: {}, body: {} })
    .select('id')
    .single();
  if (outfit.error) scheitern(`${marke}: outfits`, fehlerText(outfit.error));

  const kleidungsId = `${marke.toLowerCase()}-teil-1`;
  const favorit = await client
    .from('favorites')
    .insert({ user_id: uid, garment_id: kleidungsId })
    .select('garment_id')
    .single();
  if (favorit.error) scheitern(`${marke}: favorites`, fehlerText(favorit.error));

  return { uid, bodyId: koerper.data.id, outfitId: outfit.data.id, garmentId: kleidungsId };
}

/** Was A gegen B versucht — und woran man erkennt, dass es nicht gewirkt hat. */
function angriffsziele(saat) {
  return [
    { tabelle: 'profiles', filter: { id: saat.uid }, feld: 'display_name', gift: 'GEKAPERT' },
    { tabelle: 'body_profiles', filter: { id: saat.bodyId }, feld: 'name', gift: 'GEKAPERT' },
    { tabelle: 'outfits', filter: { id: saat.outfitId }, feld: 'name', gift: 'GEKAPERT' },
    { tabelle: 'favorites', filter: { user_id: saat.uid, garment_id: saat.garmentId }, feld: 'garment_id', gift: 'gekapert' },
  ];
}

async function aufraeumen(client, saat) {
  await client.from('favorites').delete().eq('user_id', saat.uid).eq('garment_id', saat.garmentId);
  await client.from('outfits').delete().eq('id', saat.outfitId);
  await client.from('body_profiles').delete().eq('id', saat.bodyId);
}

const konten = await kontenBesorgen();

if (!konten) {
  kopf('3. Kreuzzugriff — ÜBERSPRUNGEN');
  console.log('  Keine Testkonten verfügbar. Ohne Service-Key kann dieses Skript keine');
  console.log('  Konten anlegen: in diesem Projekt ist die E-Mail-Bestätigung aktiv, ein');
  console.log('  signUp() mit dem anon-Key liefert deshalb keine Sitzung.');
  console.log('');
  console.log('  Vollständig läuft der Beweis mit einem von beidem:');
  console.log('    SUPABASE_SERVICE_ROLE_KEY=...            (legt die Konten selbst an und löscht sie)');
  console.log('    RLS_TEST_A_EMAIL/_PASSWORD, RLS_TEST_B_* (bestehende Wegwerf-Konten)');
  nichtGeprueft.push(
    'Kreuzzugriff A→B (lesen, ändern, löschen) auf fremde Zeilen',
    'Positivkontrolle: A liest und ändert seine eigenen Zeilen',
    'Schutz von profiles.plan gegen einen angemeldeten Nutzer',
    'dev_activate_pro / dev_cancel_pro als angemeldeter Nutzer',
  );
} else {
  const [zugangA, zugangB] = konten;
  const clientA = neuerClient();
  const clientB = neuerClient();

  const anmeldenA = await clientA.auth.signInWithPassword({ email: zugangA.email, password: zugangA.passwort });
  if (anmeldenA.error) scheitern('Anmeldung Konto A', anmeldenA.error.message);
  const anmeldenB = await clientB.auth.signInWithPassword({ email: zugangB.email, password: zugangB.passwort });
  if (anmeldenB.error) scheitern('Anmeldung Konto B', anmeldenB.error.message);

  const uidA = anmeldenA.data.user.id;
  const uidB = anmeldenB.data.user.id;

  kopf('3. Zwei angemeldete Identitäten');
  console.log(`  A = ${zugangA.email}  (${uidA})`);
  console.log(`  B = ${zugangB.email}  (${uidB})`);
  pruefe(uidA !== uidB, 'A und B sind wirklich zwei verschiedene Konten');

  const saatA = await saeen(clientA, uidA, 'A');
  const saatB = await saeen(clientB, uidB, 'B');
  console.log(`  Je 4 Zeilen angelegt (profiles, body_profiles, outfits, favorites).`);

  // ---------------------------------------------------------- Positivkontrolle
  kopf('3a. Positivkontrolle: A darf seine eigenen Zeilen');

  for (const ziel of angriffsziele(saatA)) {
    const { data, error } = await mitFilter(clientA.from(ziel.tabelle).select('*'), ziel.filter);
    pruefe(
      error === null && data.length === 1,
      `${ziel.tabelle}: A liest seine eigene Zeile`,
      error ? fehlerText(error) : `${data.length} Zeile(n)`,
    );
  }

  {
    const neuerName = 'A Outfit umbenannt';
    const { data, error } = await clientA
      .from('outfits')
      .update({ name: neuerName })
      .eq('id', saatA.outfitId)
      .select('id, name');
    pruefe(
      error === null && data.length === 1 && data[0].name === neuerName,
      'outfits: A ändert seine eigene Zeile',
      error ? fehlerText(error) : `${data.length} Zeile(n) geändert`,
    );

    const nachher = await clientA.from('body_profiles').update({ height: 176 }).eq('id', saatA.bodyId).select('id, height');
    pruefe(
      nachher.error === null && nachher.data.length === 1 && Number(nachher.data[0].height) === 176,
      'body_profiles: A ändert seine eigene Zeile',
      nachher.error ? fehlerText(nachher.error) : `height = ${nachher.data?.[0]?.height}`,
    );
  }

  // --------------------------------------------------------------- Kreuzzugriff
  kopf('3b. Kreuzzugriff: A gegen die Zeilen von B');

  for (const ziel of angriffsziele(saatB)) {
    // Lesen
    const gelesen = await mitFilter(clientA.from(ziel.tabelle).select('*'), ziel.filter);
    pruefe(
      gelesen.error === null && gelesen.data.length === 0,
      `${ziel.tabelle}: A liest 0 Zeilen von B`,
      gelesen.error ? fehlerText(gelesen.error) : `${gelesen.data.length} Zeilen`,
    );

    // Vorher-Wert bei B holen, um danach zu beweisen, dass nichts passiert ist.
    const vorher = await mitFilter(clientB.from(ziel.tabelle).select('*'), ziel.filter).single();
    if (vorher.error) scheitern(`${ziel.tabelle}: B findet seine eigene Zeile nicht`, fehlerText(vorher.error));

    // Ändern
    const geaendert = await mitFilter(
      clientA.from(ziel.tabelle).update({ [ziel.feld]: ziel.gift }),
      ziel.filter,
    ).select('*');
    pruefe(
      geaendert.error === null && geaendert.data.length === 0,
      `${ziel.tabelle}: A ändert 0 Zeilen von B`,
      geaendert.error ? fehlerText(geaendert.error) : `${geaendert.data.length} Zeilen geändert`,
    );

    const nachAenderung = await mitFilter(clientB.from(ziel.tabelle).select('*'), ziel.filter).maybeSingle();
    pruefe(
      nachAenderung.data !== null && nachAenderung.data[ziel.feld] === vorher.data[ziel.feld],
      `${ziel.tabelle}: B steht danach unverändert da`,
      `${ziel.feld} = ${JSON.stringify(nachAenderung.data?.[ziel.feld])}`,
    );

    // Löschen
    const geloescht = await mitFilter(clientA.from(ziel.tabelle).delete(), ziel.filter).select('*');
    pruefe(
      geloescht.error === null && geloescht.data.length === 0,
      `${ziel.tabelle}: A löscht 0 Zeilen von B`,
      geloescht.error ? fehlerText(geloescht.error) : `${geloescht.data.length} Zeilen gelöscht`,
    );

    const nachLoeschen = await mitFilter(clientB.from(ziel.tabelle).select('*'), ziel.filter);
    pruefe(
      nachLoeschen.error === null && nachLoeschen.data.length === 1,
      `${ziel.tabelle}: die Zeile von B ist noch da`,
      `${nachLoeschen.data?.length} Zeile(n)`,
    );
  }

  // Fremde Zeilen unterschieben ist genauso wenig erlaubt wie fremde ändern.
  kopf('3c. A schreibt auf fremden Namen');

  const unterschieben = [
    ['body_profiles', { user_id: uidB, name: 'untergeschoben', height: 180, shoulder: 45, chest: 100, waist: 85, hip: 100, inseam: 80, foot: 27 }],
    ['outfits', { user_id: uidB, name: 'untergeschoben' }],
    ['favorites', { user_id: uidB, garment_id: 'untergeschoben' }],
  ];
  for (const [tabelle, zeile] of unterschieben) {
    const { error } = await clientA.from(tabelle).insert(zeile);
    pruefe(error !== null, `${tabelle}: INSERT mit user_id von B wird abgewiesen`, fehlerText(error));
  }

  // ------------------------------------------------------------- Plan-Schutz
  kopf('3d. profiles.plan lässt sich vom Client nicht auf pro setzen');

  {
    const start = await clientA.from('profiles').select('plan, plan_until').eq('id', uidA).single();
    pruefe(start.data.plan === 'free', 'A startet auf plan = free', `plan = ${start.data.plan}`);

    // Ein einziges UPDATE, zwei Spalten: display_name muss ankommen (sonst wäre
    // "plan unverändert" nur der Beweis, dass das UPDATE gar nichts erreicht hat),
    // plan muss abprallen.
    const marke = `Kontrolle ${Date.now()}`;
    const angriff = await clientA
      .from('profiles')
      .update({ plan: 'pro', plan_until: '2099-01-01T00:00:00Z', display_name: marke })
      .eq('id', uidA)
      .select('plan, plan_until, display_name');
    pruefe(
      angriff.error === null && angriff.data.length === 1,
      'Das UPDATE auf das eigene Profil erreicht die Zeile',
      angriff.error ? fehlerText(angriff.error) : `${angriff.data.length} Zeile(n)`,
    );

    const nachher = await clientA.from('profiles').select('plan, plan_until, display_name').eq('id', uidA).single();
    pruefe(
      nachher.data.display_name === marke,
      'Positivkontrolle: display_name wurde tatsächlich geschrieben',
      nachher.data.display_name,
    );
    pruefe(
      nachher.data.plan === 'free' && nachher.data.plan_until === null,
      'plan bleibt free und plan_until bleibt leer',
      `plan = ${nachher.data.plan}, plan_until = ${nachher.data.plan_until}`,
    );
  }

  // ---------------------------------------------- Der Dev-Schalter selbst
  kopf('3e. Der Entwicklungs-Schalter wirkt — und nur auf den Aufrufer');

  {
    const ein = await clientA.rpc('dev_activate_pro', { p_interval: 'yearly' });
    pruefe(
      ein.error === null && ein.data?.plan === 'pro',
      'dev_activate_pro setzt den Plan wirklich auf pro',
      ein.error ? fehlerText(ein.error) : `plan = ${ein.data?.plan}`,
    );

    const gelesen = await clientA.from('profiles').select('plan').eq('id', uidA).single();
    pruefe(gelesen.data.plan === 'pro', 'Der neue Plan steht auch in der Tabelle', `plan = ${gelesen.data.plan}`);

    const fremd = await clientB.from('profiles').select('plan').eq('id', uidB).single();
    pruefe(fremd.data.plan === 'free', 'B bleibt davon unberührt', `plan von B = ${fremd.data.plan}`);

    const quatsch = await clientA.rpc('dev_activate_pro', { p_interval: 'lebenslang' });
    pruefe(quatsch.error !== null, 'Ein unbekanntes Intervall wird abgewiesen', fehlerText(quatsch.error));

    const aus = await clientA.rpc('dev_cancel_pro');
    pruefe(
      aus.error === null && aus.data?.plan === 'free',
      'dev_cancel_pro setzt den Plan zurück auf free',
      aus.error ? fehlerText(aus.error) : `plan = ${aus.data?.plan}`,
    );
  }

  // ----------------------------------------------------------- Aufräumen
  kopf('4. Aufräumen');

  await aufraeumen(clientA, saatA);
  await aufraeumen(clientB, saatB);

  for (const [client, saat, name] of [[clientA, saatA, 'A'], [clientB, saatB, 'B']]) {
    let uebrig = 0;
    for (const tabelle of ['body_profiles', 'outfits', 'favorites']) {
      const { count } = await client.from(tabelle).select('*', { count: 'exact', head: true }).eq('user_id', saat.uid);
      uebrig += count ?? 0;
    }
    pruefe(uebrig === 0, `Konto ${name}: eigene Daten restlos gelöscht`, `${uebrig} Zeilen übrig`);
  }

  await clientA.auth.signOut();
  await clientB.auth.signOut();

  if (dienst && konten[0].selbstAngelegt) {
    for (const konto of konten) {
      const { error } = await dienst.auth.admin.deleteUser(konto.uid, false);
      if (error) scheitern(`Testkonto ${konto.email} liess sich nicht löschen`, error.message);
    }
    for (const konto of konten) {
      const { data } = await dienst.from('profiles').select('id').eq('id', konto.uid);
      pruefe((data ?? []).length === 0, `Testkonto ${konto.email} ist samt Profil weg`);
    }
  } else {
    console.log('  Die Konten selbst bleiben bestehen (kein Service-Key) — sie werden');
    console.log('  außerhalb dieses Skripts entfernt.');
    nichtGeprueft.push('Löschen der Testkonten selbst (braucht den Service-Key)');
  }
}

// ============================================================================
// Ergebnis
// ============================================================================

kopf('Ergebnis');
console.log(`  ${bestanden} Prüfungen bestanden.`);

if (nichtGeprueft.length > 0) {
  console.log('');
  console.log('  EINGESCHRÄNKT — folgendes konnte dieser Lauf NICHT belegen:');
  for (const punkt of nichtGeprueft) console.log(`    · ${punkt}`);
  console.log('');
  console.log('  Bestätigt ist damit nur, was oben mit "ok" steht.');
}

console.log('');
console.log('RLS_OK');
