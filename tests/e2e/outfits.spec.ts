import { expect, test } from '@playwright/test';
import { anziehen, outfitSpeichern } from './helpers';

test.describe('Outfits speichern und die Free-Grenze', () => {
  test('Ein gespeichertes Outfit taucht im Kleiderschrank auf', async ({ page }) => {
    await page.goto('/studio');
    await anziehen(page, 'Oberteil', /Everyday T-Shirt/);
    await outfitSpeichern(page, 'Testlook Eins');

    await page.goto('/kleiderschrank');
    await expect(page.getByRole('heading', { name: 'Testlook Eins' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '1 gespeicherte Outfits' })).toBeVisible();
  });

  test('Ein gespeichertes Outfit lässt sich wieder anziehen', async ({ page }) => {
    await page.goto('/studio');
    await anziehen(page, 'Oberteil', /Everyday T-Shirt/);
    await outfitSpeichern(page, 'Wiederholung');

    await page.goto('/studio');
    await page.getByRole('button', { name: 'Alles ausziehen' }).click();
    await expect(page.getByText('0 von 6 Plätzen')).toBeVisible();

    await page.goto('/kleiderschrank');
    await page.getByRole('button', { name: 'Anziehen' }).click();

    await expect(page).toHaveURL(/\/studio$/);
    await expect(page.getByText('1 von 6 Plätzen')).toBeVisible();
  });

  test('Umbenennen und Löschen wirken', async ({ page }) => {
    await page.goto('/studio');
    await anziehen(page, 'Oberteil', /Everyday T-Shirt/);
    await outfitSpeichern(page, 'Alter Name');

    await page.goto('/kleiderschrank');
    await page.getByRole('button', { name: 'Umbenennen' }).click();

    const dialog = page.getByRole('dialog', { name: 'Outfit umbenennen' });
    await dialog.getByRole('textbox').fill('Neuer Name');
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByRole('heading', { name: 'Neuer Name' })).toBeVisible();

    // Löschen fragt nach und entfernt danach.
    await page.getByRole('button', { name: 'Löschen', exact: true }).first().click();
    const loeschen = page.getByRole('dialog', { name: 'Outfit löschen' });
    await expect(loeschen).toBeVisible();
    await loeschen.getByRole('button', { name: 'Löschen' }).click();

    await expect(page.getByRole('heading', { name: 'Noch nichts im Schrank' })).toBeVisible();
  });

  test('Das vierte Outfit stößt bei Free an die Grenze und öffnet die Paywall', async ({ page }) => {
    await page.goto('/studio');
    await anziehen(page, 'Oberteil', /Everyday T-Shirt/);

    await expect(page.getByText('Noch 3 von 3 Speicherplätzen frei.')).toBeVisible();

    await outfitSpeichern(page, 'Eins');
    await outfitSpeichern(page, 'Zwei');
    await outfitSpeichern(page, 'Drei');

    await expect(page.getByText('Noch 0 von 3 Speicherplätzen frei.')).toBeVisible();

    // Der vierte Versuch darf nicht speichern, sondern muss erklären, warum.
    await page.getByRole('button', { name: 'Outfit speichern' }).click();
    const paywall = page.getByRole('dialog', { name: 'FitRoom Pro' });
    await expect(paywall).toBeVisible();
    await expect(paywall.getByText(/Free speichert 3 Outfits/)).toBeVisible();

    // Und es darf kein viertes Outfit entstanden sein.
    await paywall.getByRole('button', { name: 'Später' }).click();
    await page.goto('/kleiderschrank');
    await expect(page.getByRole('heading', { name: '3 gespeicherte Outfits' })).toBeVisible();
  });
});
