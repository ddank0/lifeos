import { test, expect } from '@playwright/test';
import { loginAsDefaultUser } from './helpers/auth';

test.describe('Projects Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
  });

  test('should display projects page and create a new project', async ({ page }) => {
    await expect(page.locator('h1.section-title:has-text("Projetos")')).toBeVisible();

    const projectName = `Projeto E2E ${Date.now()}`;
    await page.locator('button:has-text("+ Novo Projeto")').click();
    await expect(page.locator('.modal-panel:has-text("Novo Projeto")')).toBeVisible();

    await page.locator('.modal-panel input[type="text"]').fill(projectName);
    await page.locator('.modal-panel textarea').fill('Escopo do projeto de testes E2E');
    await page.locator('.modal-actions button:has-text("Salvar")').click();

    // Verify created project card
    const projectCard = page.locator(`.project-card:has-text("${projectName}")`);
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    await expect(projectCard.locator('.progress-track')).toBeVisible();
  });
});
