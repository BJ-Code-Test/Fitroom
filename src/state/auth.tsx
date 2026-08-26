import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authErrorText, isSupabaseConfigured, supabase } from '../lib/supabase';
import { migrateLocalToCloud } from '../data/repo';

/**
 * Anmeldung.
 *
 * Ohne Supabase-Konfiguration bleibt `user` null und die App läuft im
 * Gastmodus weiter — deshalb prüft die Oberfläche nie auf "Supabase da?",
 * sondern nur auf "angemeldet?".
 */

interface AuthValue {
  user: User | null;
  session: Session | null;
  /** true, solange die erste Sitzungsprüfung läuft */
  loading: boolean;
  available: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ needsConfirm: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoading(false);
      // Nach dem Anmelden einmalig übernehmen, was als Gast entstanden ist.
      if (event === 'SIGNED_IN' && next?.user) {
        void migrateLocalToCloud(next.user.id);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Anmeldung ist gerade nicht eingerichtet.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(authErrorText(error.message));
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (!supabase) throw new Error('Registrierung ist gerade nicht eingerichtet.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw new Error(authErrorText(error.message));
    // Ist die E-Mail-Bestätigung aktiv, gibt es noch keine Sitzung.
    return { needsConfirm: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Nicht eingerichtet.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profil`,
    });
    if (error) throw new Error(authErrorText(error.message));
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      available: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }),
    [session, loading, signIn, signUp, signOut, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth außerhalb von <AuthProvider>');
  return ctx;
}
