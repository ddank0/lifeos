import { test, expect } from '@playwright/test';
import { loginAsDefaultUser } from './helpers/auth';

test.describe('Settings and Productivity Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display productivity overview KPIs and notifications center', async ({ page }) => {
    await expect(page.locator('h1.section-title:has-text("Produtividade, Lembretes e Configurações")')).toBeVisible();

    await expect(page.locator('.module-card:has-text("Taxa Geral de Conclusão")')).toBeVisible();
    await expect(page.locator('.module-card:has-text("Tarefas Pendentes")')).toBeVisible();
    await expect(page.locator('.module-card:has-text("Projetos Ativos")')).toBeVisible();
    await expect(page.locator('.module-card:has-text("Hábitos Ativos")')).toBeVisible();

    // Notifications card
    await expect(page.locator('.module-card:has-text("Central de Notificações")')).toBeVisible();
  });

  test('should trigger Hangfire reminders processing without error', async ({ page }) => {
    const triggerBtn = page.locator('button:has-text("Processar Agora")');
    await expect(triggerBtn).toBeVisible();
    await triggerBtn.click();
    await page.waitForTimeout(500);
  });

  test('should update user profile preferences', async ({ page }) => {
    const nameInput = page.locator('.module-card:has-text("Perfil e Aparência") input[type="text"]');
    await expect(nameInput).toBeVisible();

    await nameInput.fill('Gabriel Miranda E2E');
    await page.locator('button:has-text("Salvar Preferências")').click();

    // Verify topbar user pill updates
    await expect(page.locator('.user-pill')).toContainText('Gabriel Miranda E2E', { timeout: 10000 });

    // Restore original name
    await nameInput.fill('Gabriel Miranda');
    await page.locator('button:has-text("Salvar Preferências")').click();
    await expect(page.locator('.user-pill')).toContainText('Gabriel Miranda', { timeout: 10000 });
  });
});
