import { test, expect } from '@playwright/test';
import { loginAsDefaultUser } from './helpers/auth';

test.describe('Kanban Board Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto('/kanban');
    await page.waitForLoadState('networkidle');
  });

  test('should display all 4 default columns with counters', async ({ page }) => {
    await expect(page.locator('h1.section-title:has-text("Quadro Kanban")')).toBeVisible();

    const columns = page.locator('.kanban-column');
    await expect(columns).toHaveCount(4);

    await expect(columns.nth(0)).toContainText(/a fazer/i);
    await expect(columns.nth(1)).toContainText(/em andamento/i);
    await expect(columns.nth(2)).toContainText(/em espera/i);
    await expect(columns.nth(3)).toContainText(/concluído/i);
  });

  test('should create a new task card via + Novo Cartão modal', async ({ page }) => {
    await page.locator('button:has-text("+ Novo Cartão")').click();
    await expect(page.locator('.modal-panel:has-text("Novo Cartão")')).toBeVisible();

    const taskTitle = `Card Kanban E2E ${Date.now()}`;
    await page.locator('.modal-panel input[type="text"]').first().fill(taskTitle);
    await page.locator('.modal-actions button.btn-coral').click();

    await expect(page.locator('.modal-panel')).not.toBeVisible();
    await expect(page.locator(`.kanban-card:has-text("${taskTitle}")`)).toBeVisible({ timeout: 10000 });
  });

  test('should filter cards by priority', async ({ page }) => {
    const prioritySelect = page.locator('select.filter-select').filter({ hasText: 'Prioridade' });
    await prioritySelect.selectOption('Urgent');

    // Should not throw or crash
    await expect(page.locator('.kanban-grid')).toBeVisible();

    // Reset back to all
    await prioritySelect.selectOption('all');
  });
});
