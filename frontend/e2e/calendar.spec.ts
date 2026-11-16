import { test, expect } from '@playwright/test';
import { loginAsDefaultUser } from './helpers/auth';

test.describe('Calendar Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
  });

  test('should display calendar and switch views between Monthly, Weekly, and Daily', async ({ page }) => {
    await expect(page.locator('h1.section-title:has-text("Calendário Integrado")')).toBeVisible();

    // Switch to Weekly view
    const weekBtn = page.locator('.calendar-view-switcher button:has-text("Semanal")');
    await weekBtn.click();
    await expect(weekBtn).toHaveClass(/active/);

    // Switch to Daily view
    const dayBtn = page.locator('.calendar-view-switcher button:has-text("Diária")');
    await dayBtn.click();
    await expect(dayBtn).toHaveClass(/active/);

    // Switch back to Monthly view
    const monthBtn = page.locator('.calendar-view-switcher button:has-text("Mensal")');
    await monthBtn.click();
    await expect(monthBtn).toHaveClass(/active/);
  });

  test('should navigate between periods (Next, Previous, Today)', async ({ page }) => {
    const periodTitleLocator = page.locator('.calendar-period-title');
    const initialTitle = await periodTitleLocator.textContent();

    await page.locator('.calendar-toolbar-card button:has-text("Próximo")').click();
    const nextTitle = await periodTitleLocator.textContent();
    expect(nextTitle?.trim()).not.toBe(initialTitle?.trim());

    await page.locator('.calendar-toolbar-card button:has-text("Hoje")').click();
    const todayTitle = await periodTitleLocator.textContent();
    expect(todayTitle?.trim()).toBe(initialTitle?.trim());
  });

  test('should open and cancel New Event modal', async ({ page }) => {
    await page.locator('button:has-text("+ Novo Evento")').click();
    await expect(page.locator('.modal-panel:has-text("Novo Registro no Calendário")')).toBeVisible();

    await page.locator('.modal-panel input[type="text"]').first().fill('Reunião E2E Teste');
    await page.locator('.modal-actions button:has-text("Cancelar")').click();
    await expect(page.locator('.modal-panel')).not.toBeVisible();
  });
});
