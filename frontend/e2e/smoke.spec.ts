import { test, expect } from '@playwright/test';

test.describe('LIFEOS Initial Smoke Test', () => {
  test('should load login page and display brand', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.brand-logo')).toBeVisible();
    await expect(page.locator('h1.modal-title')).toHaveText('Entrar no LIFEOS');
  });
});
