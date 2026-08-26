import { expect, test } from '@playwright/test';
import { massGespeichert } from './helpers';

test.describe('Maße', () => {
  test('Ein Regler ändert den Wert und die Änderung überlebt den Neuladen', async ({ page }) => {
    await page.goto('/masse');

    const regler = page.locator('#m-chest');
    const vorher = await regler.inputValue();

    // Über die Tastatur schieben — das prüft nebenbei die Bedienbarkeit
    // ohne Maus, die bei Reglern gern vergessen wird.
    await regler.focus();
    for (let i = 0; i < 6; i++) await regler.press('ArrowRight');

    const nachher = await regler.inputValue();
    expect(Number(nachher)).toBeGreaterThan(Number(vorher));

    await massGespeichert(page);
    await page.reload();
    await expect(page.locator('#m-chest')).toHaveValue(nachher);
  });

  test('Eine Vorlage setzt mehrere Maße auf einmal', async ({ page }) => {
    await page.goto('/masse');
    const vorher = await page.locator('#m-chest').inputValue();

    await page.getByRole('button', { name: 'Athletisch' }).click();

    const nachher = await page.locator('#m-chest').inputValue();
    expect(nachher).not.toBe(vorher);
  });

  test('Die abgeleiteten Werte folgen den Maßen', async ({ page }) => {
    await page.goto('/masse');

    // Fußlänge hoch — die Schuhgröße muss mitgehen.
    const vorher = await page.getByText(/Schuh EU \d+/).textContent();

    const fuss = page.locator('#m-foot');
    await fuss.focus();
    for (let i = 0; i < 8; i++) await fuss.press('ArrowRight');

    await expect(page.getByText(/Schuh EU \d+/)).not.toHaveText(vorher ?? '');
  });

  test('Die Umstellung auf Zoll ändert die Anzeige, nicht die Daten', async ({ page }) => {
    await page.goto('/masse');
    const cmWert = await page.locator('#m-height').inputValue();

    await page.getByRole('tab', { name: 'inch' }).click();
    await expect(page.getByText(/"/).first()).toBeVisible();

    // Der gespeicherte Wert bleibt metrisch.
    await expect(page.locator('#m-height')).toHaveValue(cmWert);
  });

  test('Geänderte Maße wirken sich auf die Passform aus', async ({ page }) => {
    await page.goto('/studio');
    await page.getByRole('tab', { name: /Oberteil/ }).click();
    await page.getByRole('button', { name: /Fitted Tee/ }).first().click();

    const ersteNote = await page.getByText(/\d+ \/ 100/).textContent();

    // Brustumfang deutlich hoch — bei einem schmal geschnittenen Teil
    // muss das die Note verschlechtern.
    await page.goto('/masse');
    const brust = page.locator('#m-chest');
    await brust.focus();
    for (let i = 0; i < 40; i++) await brust.press('ArrowRight');
    await massGespeichert(page);

    await page.goto('/studio');
    const zweiteNote = await page.getByText(/\d+ \/ 100/).textContent();
    expect(zweiteNote).not.toBe(ersteNote);
  });
});
