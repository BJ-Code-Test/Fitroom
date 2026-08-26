import type { Plan, Provider } from '../types';

/**
 * Free gegen Pro.
 *
 * Alle Grenzen stehen hier an einer Stelle, damit die Oberfläche nirgends
 * selbst entscheidet, was erlaubt ist — sie fragt nur.
 */

export type Feature =
  | 'hdExport'      // Bild in hoher Auflösung speichern
  | 'fitDetails'    // Passform je Zone statt nur Gesamturteil
  | 'allProviders'  // Anbieter der Stufe "pro"
  | 'styleAdvisor'  // Stilvorschläge
  | 'unlimitedSaves';

export interface PlanLimits {
  savedOutfits: number;
  features: Record<Feature, boolean>;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    savedOutfits: 3,
    features: { hdExport: false, fitDetails: false, allProviders: false, styleAdvisor: false, unlimitedSaves: false },
  },
  pro: {
    savedOutfits: Number.POSITIVE_INFINITY,
    features: { hdExport: true, fitDetails: true, allProviders: true, styleAdvisor: true, unlimitedSaves: true },
  },
};

export const FEATURE_LABEL: Record<Feature, string> = {
  hdExport: 'Bild in 4K exportieren',
  fitDetails: 'Passform je Körperzone',
  allProviders: 'Alle Anbieter im Katalog',
  styleAdvisor: 'Stilvorschläge zum Outfit',
  unlimitedSaves: 'Unbegrenzt Outfits speichern',
};

export const can = (plan: Plan, feature: Feature): boolean => PLAN_LIMITS[plan].features[feature];

export const canSaveMore = (plan: Plan, savedCount: number): boolean =>
  savedCount < PLAN_LIMITS[plan].savedOutfits;

export const remainingSaves = (plan: Plan, savedCount: number): number =>
  Math.max(0, PLAN_LIMITS[plan].savedOutfits - savedCount);

/** Anbieter, die dieser Plan sehen darf. */
export const visibleProviders = (plan: Plan, all: Provider[]): Provider[] =>
  can(plan, 'allProviders') ? all : all.filter((p) => p.tier === 'free');

export const isProviderLocked = (plan: Plan, provider: Provider): boolean =>
  provider.tier === 'pro' && !can(plan, 'allProviders');

export const PRO_PRICE = { monthly: 7.99, yearly: 69.0, currency: '€' };

export const PRO_PITCH: string[] = [
  'Alle Anbieter statt nur der Basis-Auswahl',
  'Passform-Analyse für jede Körperzone statt Gesamturteil',
  'Unbegrenzt viele Outfits speichern',
  'Look als 4K-Bild exportieren',
  'Stilvorschläge, die zu deinen Maßen passen',
];
