import { Page, expect } from '@playwright/test';

export async function loginAsDefaultUser(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // If already authenticated, will redirect to /dashboard
  if (page.url().includes('/dashboard')) {
    return;
  }

  // Fill credentials if not already populated
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.fill('demo@lifeos.dev');
  await passwordInput.fill('LifeOs@2026');

  await page.locator('button:has-text("Acessar Workspace")').click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await expect(page.locator('.bento-grid')).toBeVisible({ timeout: 10000 });
}
