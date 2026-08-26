import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Supabase-Client.
 *
 * Fehlen die Umgebungsvariablen, läuft die App bewusst weiter — nur eben als
 * Gast mit lokaler Speicherung. So ist ein frisch geklontes Projekt ohne
 * `.env.local` benutzbar, statt mit einem weißen Bildschirm zu enden.
 *
 * Der Client trägt das Schema der Datenbank (`database.types.ts`, erzeugt aus
 * dem laufenden Projekt). Damit wird ein Tippfehler in einem Spaltennamen zum
 * Übersetzungsfehler statt zu einer Überraschung zur Laufzeit. Die Datei wird
 * nicht von Hand gepflegt — nach jeder Migration neu erzeugen.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

/** Übersetzt die englischen Auth-Fehler in etwas, das man lesen kann. */
export function authErrorText(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-Mail oder Passwort stimmt nicht.';
  if (m.includes('email not confirmed')) return 'Bitte bestätige zuerst die E-Mail, die wir dir geschickt haben.';
  if (m.includes('user already registered')) return 'Für diese E-Mail gibt es schon ein Konto. Melde dich an.';
  if (m.includes('password should be at least')) return 'Das Passwort braucht mindestens 6 Zeichen.';
  if (m.includes('unable to validate email')) return 'Diese E-Mail-Adresse sieht nicht gültig aus.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Zu viele Versuche. Warte einen Moment.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Keine Verbindung zum Server.';
  return message;
}
