import { expect, test, type Page } from '@playwright/test';

test.describe('Einstellungen und Tarif', () => {
  /**
   * An die Stelle der Palettenauswahl tritt der Hell/Dunkel-Schalter. Geprueft
   * wird nicht der Attributwert allein, sondern die gerenderte Farbe: dass
   * <html> ein Attribut traegt, sagt noch nicht, dass sich etwas geaendert hat.
   */
  test('Die Helligkeit laesst sich umstellen, wirkt sofort und bleibt erhalten', async ({ page }) => {
    await page.goto('/einstellungen');

    // Hell ist der Standard.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const hell = await grundfarbe(page);

    await page.getByRole('tab', { name: 'Dunkel' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const dunkel = await grundfarbe(page);
    expect(dunkel).not.toEqual(hell);
    expect(helligkeit(dunkel)).toBeLessThan(helligkeit(hell));

    // Ueber einen Neuladen hinweg.
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await grundfarbe(page)).toEqual(dunkel);

    // Und der Rueckweg.
    await page.getByRole('tab', { name: 'Hell' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await grundfarbe(page)).toEqual(hell);
  });

  /**
   * Der Kern des Stils: eine Karte hat DIESELBE Farbe wie der Untergrund und
   * ragt allein durch zwei Aussenschatten heraus. Faerbt jemand die Karte
   * wieder ein oder ergaenzt einen inneren Lichtstreifen, faellt dieser Test.
   */
  test('Die Flaechen sind aus dem Untergrund herausgeformt, nicht aufgelegt', async ({ page }) => {
    await page.goto('/einstellungen');

    const karte = page.locator('.ng').first();
    await expect(karte).toBeVisible();

    const messung = await karte.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        flaeche: s.backgroundColor,
        grund: getComputedStyle(document.body).backgroundColor,
        schatten: s.boxShadow,
      };
    });

    // Gleicher Werkstoff.
    expect(messung.flaeche).toEqual(messung.grund);
    // Kein Rahmen und kein innerer Lichtstreifen — nur Aussenschatten.
    expect(messung.schatten).not.toContain('inset');
    // Zwei davon: hell oben links, dunkel unten rechts. Jeder Schatten traegt
    // genau eine Farbangabe, also zaehlt die Zahl der rgb()-Werte die Schatten.
    expect(messung.schatten.match(/rgba?\(/g) ?? []).toHaveLength(2);
  });

  /**
   * Weiche Schatten koennen Fokus nicht zeigen. Ohne echtes outline waere die
   * Oberflaeche mit der Tastatur unbedienbar.
   */
  test('Bedienelemente tragen einen echten Fokusring', async ({ page }) => {
    await page.goto('/einstellungen');

    const knopf = page.getByRole('button', { name: 'Lokale Daten löschen' });
    await knopf.focus();

    const ring = await knopf.evaluate((el) => {
      const s = getComputedStyle(el);
      return { breite: s.outlineWidth, stil: s.outlineStyle, farbe: s.outlineColor };
    });
    expect(ring.stil).toBe('solid');
    expect(parseFloat(ring.breite)).toBeGreaterThanOrEqual(2);
    // Der Ring muss sich vom Untergrund abheben, sonst ist er Dekoration.
    const grund = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(ring.farbe).not.toEqual(grund);
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

/** Die Grundfarbe der Oberflaeche, wie sie der Browser tatsaechlich malt. */
async function grundfarbe(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

/** Grobe Helligkeit einer rgb()-Angabe — reicht, um hell von dunkel zu trennen. */
function helligkeit(rgb: string): number {
  const [r, g, b] = (rgb.match(/\d+/g) ?? ['0', '0', '0']).map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
