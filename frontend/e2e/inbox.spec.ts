import { test, expect } from '@playwright/test';
import { loginAsDefaultUser } from './helpers/auth';

test.describe('Inbox and Quick Capture Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto('/inbox');
    await page.waitForLoadState('networkidle');
  });

  test('should display Inbox interface and add a new quick note', async ({ page }) => {
    await expect(page.locator('h1.section-title:has-text("Caixa de Entrada")')).toBeVisible();

    const noteContent = `Ideia de Artigo E2E ${Date.now()}`;
    const input = page.locator('input[placeholder*="Digite uma anotação"]');
    await input.fill(noteContent);

    await page.locator('button:has-text("+ Guardar na Caixa de Entrada")').click();

    // Verify note appears in the list
    await expect(page.locator(`.inbox-item-card:has-text("${noteContent}")`)).toBeVisible({ timeout: 10000 });
  });

  test('should convert note to task', async ({ page }) => {
    // Add unique note first
    const noteContent = `Converter em Tarefa Teste ${Date.now()}`;
    const input = page.locator('input[placeholder*="Digite uma anotação"]');
    await input.fill(noteContent);
    await page.locator('button:has-text("+ Guardar na Caixa de Entrada")').click();

    const noteCard = page.locator(`.inbox-item-card:has-text("${noteContent}")`);
    await expect(noteCard).toBeVisible({ timeout: 10000 });

    // Click Converter em Tarefa
    await noteCard.locator('button:has-text("Converter em Tarefa")').click();

    // Note should disappear from unprocessed list
    await expect(noteCard).not.toBeVisible({ timeout: 10000 });
  });
});
