import { expect, test } from '@playwright/test';
import { anziehen } from './helpers';

test.describe('Ankleide', () => {
  test('Ein Teil anziehen füllt Slot, Bühne und Passform', async ({ page }) => {
    await page.goto('/studio');

    // Vorher: nichts belegt, keine Passform.
    await expect(page.getByText('0 von 6 Plätzen')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Noch keine Passform' })).toBeVisible();

    await anziehen(page, 'Oberteil', /Everyday T-Shirt/);

    // Nachher: Slot belegt, Zähler hoch, Passform gerechnet.
    await expect(page.getByText('1 von 6 Plätzen')).toBeVisible();
    await expect(page.getByRole('tab', { name: /Oberteil.*Everyday T-Shirt/s })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Passform', exact: true })).toBeVisible();
  });

  test('Ein Urteil zur Passform wird tatsächlich angezeigt', async ({ page }) => {
    await page.goto('/studio');
    await anziehen(page, 'Oberteil', /Everyday T-Shirt/);

    // Irgendein gültiges Urteil muss stehen — welches, hängt von den Maßen ab.
    await expect(
      page.getByText(/^(passt|eng|locker|zu eng|zu weit)$/).first(),
    ).toBeVisible();

    // Und eine Note zwischen 0 und 100.
    await expect(page.getByText(/\d+ \/ 100/)).toBeVisible();
  });

  test('Farbe und Größe lassen sich wechseln', async ({ page }) => {
    await page.goto('/studio');
    await anziehen(page, 'Oberteil', /Everyday T-Shirt/);

    // Farbe: der zweite Farbtupfer wird gewählt und meldet das zurück.
    const farben = page.getByRole('button', { name: 'Nebelgrau' });
    await farben.click();
    await expect(farben).toHaveAttribute('aria-pressed', 'true');

    // Größe: die Auswahl übernimmt den neuen Wert.
    const groesse = page.getByRole('combobox');
    await groesse.selectOption('XL');
    await expect(groesse).toHaveValue('XL');
  });

  test('Mehrere Slots lassen sich gleichzeitig belegen und wieder leeren', async ({ page }) => {
    await page.goto('/studio');

    await anziehen(page, 'Oberteil', /Everyday T-Shirt/);
    await anziehen(page, 'Unterteil', /Chino Tapered/);
    await anziehen(page, 'Schuhe', /Court Sneaker/);

    await expect(page.getByText('3 von 6 Plätzen')).toBeVisible();

    await page.getByRole('button', { name: 'Alles ausziehen' }).click();
    await expect(page.getByText('0 von 6 Plätzen')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Noch keine Passform' })).toBeVisible();
  });

  test('Das zusammengestellte Outfit überlebt einen Neuladen', async ({ page }) => {
    await page.goto('/studio');
    await anziehen(page, 'Oberteil', /Everyday T-Shirt/);
    await anziehen(page, 'Schuhe', /Court Sneaker/);
    await expect(page.getByText('2 von 6 Plätzen')).toBeVisible();

    // Ein Neuladen ist kein Grund, die Arbeit wegzuwerfen.
    await page.reload();

    await expect(page.getByText('2 von 6 Plätzen')).toBeVisible();
    await expect(page.getByRole('tab', { name: /Oberteil.*Everyday T-Shirt/s })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Schuhe.*Court Sneaker/s })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Passform', exact: true })).toBeVisible();

    // Und was ausgezogen wurde, bleibt ausgezogen.
    await page.getByRole('button', { name: 'Alles ausziehen' }).click();
    await page.reload();
    await expect(page.getByText('0 von 6 Plätzen')).toBeVisible();
  });

  test('Ein einzelnes Teil lässt sich wieder ausziehen', async ({ page }) => {
    await page.goto('/studio');
    await anziehen(page, 'Oberteil', /Everyday T-Shirt/);
    await expect(page.getByText('1 von 6 Plätzen')).toBeVisible();

    // "Alles ausziehen" enthält "ausziehen" — ohne exact treffen beide Knöpfe.
    await page.getByRole('button', { name: 'ausziehen', exact: true }).click();
    await expect(page.getByText('0 von 6 Plätzen')).toBeVisible();
  });
});
