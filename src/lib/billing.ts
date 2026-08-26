import type { Plan } from '../types';
import { supabase } from './supabase';

/**
 * Abo-Anbindung.
 *
 * Es gibt noch keinen Zahlungsdienstleister. Angemeldet läuft das Umschalten
 * über die Datenbankfunktion `dev_activate_pro` (dort steht auch, dass sie mit
 * echtem Billing gelöscht wird); als Gast nur lokal in diesem Browser.
 *
 * Die Signatur ist bewusst die eines echten Checkouts — asynchron, kann
 * fehlschlagen, liefert den neuen Plan. So bleibt die Oberfläche unverändert,
 * wenn hier später Stripe eingehängt wird.
 */

export type Interval = 'monthly' | 'yearly';

export interface CheckoutResult {
  ok: boolean;
  plan: Plan;
  message: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function startCheckout(
  userId: string | null,
  interval: Interval,
): Promise<CheckoutResult> {
  if (userId && supabase) {
    const { error } = await supabase.rpc('dev_activate_pro', { p_interval: interval });
    if (error) {
      return { ok: false, plan: 'free', message: `Umstellung fehlgeschlagen: ${error.message}` };
    }
  } else {
    // Gastmodus: gilt nur in diesem Browser.
    await wait(700);
  }

  return {
    ok: true,
    plan: 'pro',
    message:
      interval === 'yearly' ? 'Pro ist aktiv — für ein Jahr.' : 'Pro ist aktiv — monatlich kündbar.',
  };
}

export async function cancelSubscription(userId: string | null): Promise<CheckoutResult> {
  if (userId && supabase) {
    const { error } = await supabase.rpc('dev_cancel_pro');
    if (error) {
      return { ok: false, plan: 'pro', message: `Kündigung fehlgeschlagen: ${error.message}` };
    }
  } else {
    await wait(400);
  }
  return { ok: true, plan: 'free', message: 'Zurück auf Free.' };
}
