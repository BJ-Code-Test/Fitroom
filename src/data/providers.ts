import type { Garment, Provider } from '../types';

/**
 * Anbieter-Anbindung.
 *
 * Der Katalog kommt im MVP aus einer lokalen Datei. Damit später echte Shops
 * dazukommen können, läuft jeder Zugriff über diesen Adapter: ein Anbieter
 * ist alles, was `fetchGarments()` beantworten kann. Ein echter Shop bekommt
 * hier eine Implementierung mit fetch() und einer Übersetzung seiner Artikel
 * in `Garment` — die Oberfläche merkt davon nichts.
 */
export interface ProviderAdapter {
  provider: Provider;
  fetchGarments(): Promise<Garment[]>;
}

export const PROVIDERS: Provider[] = [
  { id: 'nordstil',  name: 'Nordstil',        tag: 'NS', tier: 'free', hue: '#5a7396' },
  { id: 'urban',     name: 'Urban Thread',    tag: 'UT', tier: 'free', hue: '#a5697f' },
  { id: 'basiq',     name: 'Basiq',           tag: 'BQ', tier: 'free', hue: '#4f8b80' },
  { id: 'atelier',   name: 'Atelier Vion',    tag: 'AV', tier: 'pro',  hue: '#7d6a99' },
  { id: 'terra',     name: 'Terra Supply',    tag: 'TS', tier: 'pro',  hue: '#9a8259' },
  { id: 'koban',     name: 'Koban Tokyo',     tag: 'KT', tier: 'pro',  hue: '#a86a55' },
];

export const providerById = (id: string): Provider | undefined =>
  PROVIDERS.find((p) => p.id === id);

/** Adapter für den mitgelieferten Katalog. */
export function localAdapter(provider: Provider, all: Garment[]): ProviderAdapter {
  return {
    provider,
    fetchGarments: async () => all.filter((g) => g.providerId === provider.id),
  };
}
