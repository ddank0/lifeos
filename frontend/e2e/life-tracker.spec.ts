import { test, expect } from '@playwright/test';
import { loginAsDefaultUser } from './helpers/auth';

test.describe('Life Tracker Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto('/life-tracker');
    await page.waitForLoadState('networkidle');
  });

  test('should display metric cards and adjust value with step buttons', async ({ page }) => {
    await expect(page.locator('h1.section-title:has-text("Life Tracker")')).toBeVisible();

    const metricCard = page.locator('.kpi-grid article.card').first();
    await expect(metricCard).toBeVisible({ timeout: 10000 });

    const stepPlusBtn = metricCard.locator('button.step-btn[title="Aumentar valor"]');
    await expect(stepPlusBtn).toBeVisible();

    // Click + to increase
    await stepPlusBtn.click();
    await page.waitForTimeout(500);

    // Click - to decrease
    const stepMinusBtn = metricCard.locator('button.step-btn[title="Diminuir valor"]');
    await stepMinusBtn.click();
    await page.waitForTimeout(500);
  });

  test('should open modal and create a new life metric', async ({ page }) => {
    const metricName = `Métrica E2E ${Date.now()}`;
    await page.locator('button:has-text("+ Nova Métrica")').click();
    await expect(page.locator('.modal-panel:has-text("Nova Métrica")')).toBeVisible();

    await page.locator('.modal-panel input[type="text"]').first().fill(metricName);
    await page.locator('.modal-panel textarea').fill('Métrica quantitativa de testes E2E');
    await page.locator('.modal-actions button:has-text("Salvar")').click();

    await expect(page.locator(`.kpi-grid article.card:has-text("${metricName}")`)).toBeVisible({ timeout: 10000 });
  });
});
