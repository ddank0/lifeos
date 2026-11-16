import { test, expect } from '@playwright/test';

test.describe('Auth and User Profile Menu', () => {
  test('should validate empty inputs and display error message', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('');
    await page.locator('input[type="password"]').fill('');
    await page.locator('button:has-text("Acessar Workspace")').click();

    await expect(page.locator('.auth-error')).toBeVisible();
    await expect(page.locator('.auth-error')).toContainText('Informe seu e-mail e senha');
  });

  test('should login successfully, open profile dropdown and logout cleanly', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('gabriel@lifeos.dev');
    await page.locator('input[type="password"]').fill('LifeOs@2026');
    await page.locator('button:has-text("Acessar Workspace")').click();

    await page.waitForURL('**/dashboard');
    await expect(page.locator('.user-pill')).toBeVisible();

    // Clicking profile pill opens dropdown menu (does NOT directly log out!)
    await page.locator('.user-pill').click();
    await expect(page.locator('.user-dropdown-menu')).toBeVisible();
    await expect(page.locator('.user-dropdown-name')).toContainText('Gabriel');
    await expect(page.locator('.user-dropdown-email')).toContainText('gabriel@lifeos.dev');

    // Check dropdown options
    await expect(page.locator('.user-dropdown-item:has-text("Configurações & Perfil")')).toBeVisible();
    await expect(page.locator('.user-dropdown-item:has-text("Life Tracker")')).toBeVisible();
    await expect(page.locator('.user-dropdown-item:has-text("Sair da conta")')).toBeVisible();

    // Clicking outside closes dropdown
    await page.locator('.brand-logo').click();
    await expect(page.locator('.user-dropdown-menu')).not.toBeVisible();

    // Re-open and click Sair da conta
    await page.locator('.user-pill').click();
    await expect(page.locator('.user-dropdown-menu')).toBeVisible();
    await page.locator('.user-dropdown-item.logout-item').click();

    // Must be on /login and stay there without auto-logging back in
    await page.waitForURL('**/login');
    await expect(page.locator('h1.modal-title')).toHaveText('Entrar no LIFEOS');
    await expect(page.locator('button:has-text("Acessar Workspace")')).toBeVisible();
  });
});
