import { expect, test } from '@playwright/test';
import { proAktivieren, teileAnzahl } from './helpers';

test.describe('Katalog', () => {
  test('Filter grenzen die Auswahl tatsächlich ein', async ({ page }) => {
    await page.goto('/katalog');
    const alle = await teileAnzahl(page);
    expect(alle).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Schuhe', exact: true }).click();
    const nurSchuhe = await teileAnzahl(page);
    expect(nurSchuhe).toBeLessThan(alle);
    expect(nurSchuhe).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Alles', exact: true }).click();
    expect(await teileAnzahl(page)).toBe(alle);
  });

  test('Die Suche findet ein bestimmtes Teil', async ({ page }) => {
    await page.goto('/katalog');
    await page.getByPlaceholder('Suchen nach Name oder Marke').fill('Denim');

    await expect(page.getByRole('button', { name: /Slim Denim Stretch/ })).toBeVisible();
    expect(await teileAnzahl(page)).toBeLessThan(10);
  });

  test('Eine Filterkombination ohne Treffer erklärt sich und lässt sich zurücksetzen', async ({ page }) => {
    await page.goto('/katalog');
    await page.getByPlaceholder('Suchen nach Name oder Marke').fill('gibtesnichtxyz');

    await expect(page.getByRole('heading', { name: 'Nichts gefunden' })).toBeVisible();
    await page.getByRole('button', { name: 'Filter zurücksetzen' }).click();
    expect(await teileAnzahl(page)).toBeGreaterThan(0);
  });

  test('Pro-Anbieter sind bei Free gesperrt und öffnen die Paywall', async ({ page }) => {
    await page.goto('/katalog');

    const gesperrt = page.getByRole('button', { name: 'Atelier Vion' });
    await expect(gesperrt).toBeVisible();
    await gesperrt.click();

    const paywall = page.getByRole('dialog', { name: 'FitRoom Pro' });
    await expect(paywall).toBeVisible();
    await expect(paywall.getByText(/Atelier Vion gehört zu den Pro-Anbietern/)).toBeVisible();
  });

  test('Die Teil-Detailseite zeigt eine Empfehlung und sperrt die Tabelle bei Free', async ({ page }) => {
    await page.goto('/katalog/ut-jeans-slim');

    await expect(page.getByRole('heading', { name: 'Slim Denim Stretch' })).toBeVisible();
    await expect(page.getByText(/Empfohlene Größe:/)).toBeVisible();

    // Die Größentabelle gehört zu Pro und muss als gesperrt erkennbar sein.
    await expect(page.getByRole('button', { name: 'Tabelle freischalten' })).toBeVisible();
  });

  test('Anprobieren führt das Teil in die Ankleide', async ({ page }) => {
    await page.goto('/katalog/ut-jeans-slim');
    await page.getByRole('button', { name: 'Anprobieren' }).click();

    await expect(page).toHaveURL(/\/studio$/);
    await expect(page.getByText('1 von 6 Plätzen')).toBeVisible();
  });

  test('Mit Pro wächst der Katalog und die Sperren fallen', async ({ page }) => {
    await page.goto('/katalog');
    const vorher = await teileAnzahl(page);

    await proAktivieren(page);

    await page.goto('/katalog');
    const nachher = await teileAnzahl(page);
    expect(nachher).toBeGreaterThan(vorher);

    // Der vorher gesperrte Anbieter filtert jetzt, statt die Paywall zu öffnen.
    await page.getByRole('button', { name: 'Atelier Vion' }).click();
    await expect(page.getByRole('dialog', { name: 'FitRoom Pro' })).toHaveCount(0);
    expect(await teileAnzahl(page)).toBeGreaterThan(0);

    // Und die Größentabelle ist offen.
    await page.goto('/katalog/ut-jeans-slim');
    await expect(page.getByRole('button', { name: 'Tabelle freischalten' })).toHaveCount(0);
  });
});
