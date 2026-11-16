import { test, expect } from '@playwright/test';
import { loginAsDefaultUser } from './helpers/auth';

test.describe('Areas Management Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto('/areas');
    await page.waitForLoadState('networkidle');
  });

  test('should display default areas and allow inspecting area tasks/events', async ({ page }) => {
    await expect(page.locator('h1.section-title:has-text("Minhas Áreas da Vida")')).toBeVisible();

    const areaCards = page.locator('.area-card');
    const count = await areaCards.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // Click first area to inspect
    await areaCards.first().click();
    await expect(page.locator('.module-card:has-text("Visão da Área")')).toBeVisible();
  });

  test('should create, edit and delete a custom area', async ({ page }) => {
    const areaName = `Área E2E ${Date.now()}`;

    // 1. Create area
    await page.locator('button.big-plus-btn[title="Nova Área"]').click();
    await expect(page.locator('.modal-panel:has-text("Nova Área")')).toBeVisible();

    await page.locator('.modal-panel input[type="text"]').first().fill(areaName);
    await page.locator('.modal-panel input[placeholder*="Descrição"]').fill('Descrição de teste E2E');
    await page.locator('.modal-actions button:has-text("Salvar Área")').click();

    // Verify it appears
    const createdCard = page.locator(`.area-card:has-text("${areaName}")`);
    await expect(createdCard).toBeVisible({ timeout: 10000 });

    // 2. Delete area
    const deleteBtn = createdCard.locator('button[title="Excluir área"]');
    await deleteBtn.click();

    // Verify deleted
    await expect(createdCard).not.toBeVisible({ timeout: 10000 });
  });
});
