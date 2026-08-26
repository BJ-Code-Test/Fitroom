import { expect, test } from '@playwright/test';

test.describe('Einstellungen und Tarif', () => {
  test('Ein Palettenwechsel wirkt sofort und bleibt erhalten', async ({ page }) => {
    await page.goto('/einstellungen');

    // Standard ist die ruhige helle Palette.
    await expect(page.locator('html')).toHaveClass(/ng-p-papier/);

    await page.getByRole('button', { name: /Graphit/ }).click();
    await expect(page.locator('html')).toHaveClass(/ng-p-graphit/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/ng-p-graphit/);
  });

  test('Die Farbintensität lässt sich umstellen', async ({ page }) => {
    await page.goto('/einstellungen');
    await expect(page.locator('html')).toHaveClass(/ng-i-1/);

    await page.getByRole('tab', { name: 'Mono' }).click();
    await expect(page.locator('html')).toHaveClass(/ng-i-0/);
  });

  test('Lokale Daten löschen fragt nach und räumt danach auf', async ({ page }) => {
    // Erst etwas anlegen, das gelöscht werden kann.
    await page.goto('/studio');
    await page.getByRole('tab', { name: /Oberteil/ }).click();
    await page.getByRole('button', { name: /Everyday T-Shirt/ }).first().click();
    await page.getByRole('button', { name: 'Outfit speichern' }).click();
    const speichern = page.getByRole('dialog', { name: 'Outfit speichern' });
    await speichern.getByRole('textbox').fill('Wegwerflook');
    await speichern.getByRole('button', { name: 'Speichern' }).click();

    await page.goto('/kleiderschrank');
    await expect(page.getByRole('heading', { name: '1 gespeicherte Outfits' })).toBeVisible();

    await page.goto('/einstellungen');
    await page.getByRole('button', { name: 'Lokale Daten löschen' }).click();

    const dialog = page.getByRole('dialog', { name: 'Lokale Daten löschen' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Endgültig löschen' }).click();

    await page.goto('/kleiderschrank');
    await expect(page.getByRole('heading', { name: 'Noch nichts im Schrank' })).toBeVisible();
  });

  test('Der Tarif lässt sich aktivieren und wieder beenden', async ({ page }) => {
    await page.goto('/preise');
    await expect(page.getByText('Free').first()).toBeVisible();

    await page.getByRole('button', { name: 'Pro aktivieren' }).click();
    const paywall = page.getByRole('dialog', { name: 'FitRoom Pro' });
    await paywall.getByRole('button', { name: 'Pro aktivieren' }).click();
    await expect(paywall).toBeHidden({ timeout: 15_000 });

    // Das Abzeichen in der Kopfzeile muss den neuen Tarif zeigen.
    await page.goto('/studio');
    await expect(page.getByText('Pro', { exact: true }).first()).toBeVisible();

    // Und der Rückweg muss ebenfalls funktionieren.
    await page.goto('/preise');
    await page.getByRole('button', { name: 'Auf Free zurück' }).click();
    await expect(page.getByRole('button', { name: 'Pro aktivieren' })).toBeVisible({ timeout: 15_000 });
  });

  test('Das Jahresabo wird als günstiger ausgewiesen', async ({ page }) => {
    await page.goto('/preise');
    await page.getByRole('button', { name: 'Pro aktivieren' }).click();

    const paywall = page.getByRole('dialog', { name: 'FitRoom Pro' });
    await paywall.getByRole('tab', { name: /Jährlich/ }).click();
    await expect(paywall.getByText(/69,00 €/)).toBeVisible();
  });
});
