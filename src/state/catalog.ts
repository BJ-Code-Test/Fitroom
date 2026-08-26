import { useMemo } from 'react';
import { CATALOG } from '../data/catalog';
import { PROVIDERS } from '../data/providers';
import { visibleProviders } from '../lib/plan';
import { useApp } from './app';
import type { Garment, Provider } from '../types';

/**
 * Welcher Teil des Katalogs zu diesem Plan gehört.
 *
 * Free bekommt die Anbieter der Stufe "free". Die gesperrten Teile werden
 * nicht verschwiegen, sondern getrennt zurückgegeben — der Katalog zeigt sie
 * als Anreiz, statt so zu tun, als gäbe es sie nicht.
 */
export function useCatalog(): {
  allowed: Garment[];
  locked: Garment[];
  allowedProviders: Provider[];
  lockedProviders: Provider[];
} {
  const plan = useApp((s) => s.plan);

  return useMemo(() => {
    const allowedProviders = visibleProviders(plan, PROVIDERS);
    const allowedIds = new Set(allowedProviders.map((p) => p.id));
    return {
      allowed: CATALOG.filter((g) => allowedIds.has(g.providerId)),
      locked: CATALOG.filter((g) => !allowedIds.has(g.providerId)),
      allowedProviders,
      lockedProviders: PROVIDERS.filter((p) => !allowedIds.has(p.id)),
    };
  }, [plan]);
}
