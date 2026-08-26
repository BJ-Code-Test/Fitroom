import { expect, type Page } from '@playwright/test';

/**
 * Gemeinsame Handgriffe der E2E-Tests.
 *
 * Die Wähler greifen bewusst über Rollen und sichtbaren Text, nicht über
 * CSS-Klassen: der Stil der App wird gerade umgebaut, und Tests, die an
 * Klassennamen hängen, wären danach alle rot, ohne dass ein Fehler vorliegt.
 */

/** Ein Kleidungsstück im Studio anziehen. */
export async function anziehen(page: Page, slot: string, name: RegExp): Promise<void> {
  await page.getByRole('tab', { name: new RegExp(slot) }).click();
  await expect(page.getByRole('heading', { name: `${slot} wählen` })).toBeVisible();
  await page.getByRole('button', { name }).first().click();
}

/** Das aktuelle Outfit unter diesem Namen speichern. */
export async function outfitSpeichern(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Outfit speichern' }).click();
  const dialog = page.getByRole('dialog', { name: 'Outfit speichern' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox').fill(name);
  await dialog.getByRole('button', { name: 'Speichern' }).click();
  await expect(dialog).toBeHidden();
}

/** Pro im Gastmodus freischalten (kein Zahlungsdienst dahinter). */
export async function proAktivieren(page: Page): Promise<void> {
  await page.goto('/preise');
  await page.getByRole('button', { name: 'Pro aktivieren' }).click();

  const dialog = page.getByRole('dialog', { name: 'FitRoom Pro' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Pro aktivieren' }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

/** Wartet, bis der verzögerte Schreibvorgang der Maße durch ist. */
export async function massGespeichert(page: Page): Promise<void> {
  await page.waitForTimeout(900);
}

/** Liest die Anzahl der Teile aus der Katalog-Überschrift ("24 Teile"). */
export async function teileAnzahl(page: Page): Promise<number> {
  const text = await page.getByRole('heading', { name: /\d+ Teile/ }).textContent();
  const match = text?.match(/(\d+)/);
  if (!match) throw new Error(`Konnte die Teile-Anzahl nicht lesen: ${text}`);
  return Number(match[1]);
}
