import { expect, test } from '@playwright/test';

test.describe('Landing-Page', () => {
  test('Kopfzeile trägt Logo, Namen und beide Konto-Wege', async ({ page }) => {
    await page.goto('/');

    // Marke führt zurück zur Startseite.
    const marke = page.getByRole('link', { name: /FitRoom/ }).first();
    await expect(marke).toBeVisible();
    await expect(marke).toHaveAttribute('href', '/');

    // Abgemeldet müssen beide Wege sichtbar sein — anmelden und neu anlegen.
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Konto anlegen' })).toBeVisible();

    // Kein Konto-Menü ohne Anmeldung.
    await expect(page.getByRole('button', { name: 'Abmelden' })).toHaveCount(0);
  });

  test('Motto steht unter der Kopfzeile', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Erst sehen, ob es passt. Dann bestellen.')).toBeVisible();
  });

  test('Die Links der Kopfzeile führen an ihr Ziel', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('navigation', { name: 'Bereiche' }).getByRole('link', { name: 'Katalog' }).click();
    await expect(page).toHaveURL(/\/katalog$/);

    await page.goBack();
    await page.getByRole('navigation', { name: 'Bereiche' }).getByRole('link', { name: 'Preise' }).click();
    await expect(page).toHaveURL(/\/preise$/);
  });

  test('Anmelden führt zur Anmeldeseite, Konto anlegen zur Registrierung', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/');
    await page.getByRole('button', { name: 'Konto anlegen' }).click();
    await expect(page).toHaveURL(/\/registrieren$/);
    await expect(page.getByRole('heading', { name: 'Konto anlegen' })).toBeVisible();
  });

  test('Eine unbekannte Adresse landet auf der 404-Seite', async ({ page }) => {
    await page.goto('/gibt-es-nicht');
    await expect(page.getByRole('heading', { name: 'Diese Seite gibt es nicht' })).toBeVisible();
  });
});
