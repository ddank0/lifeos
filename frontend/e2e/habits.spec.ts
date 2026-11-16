import { test, expect } from '@playwright/test';
import { loginAsDefaultUser } from './helpers/auth';

test.describe('Habits and Routines Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto('/habits');
    await page.waitForLoadState('networkidle');
  });

  test('should display habits page and allow toggling day check-in', async ({ page }) => {
    await expect(page.locator('h1.section-title:has-text("Hábitos e Rotinas")')).toBeVisible();

    const habitCards = page.locator('.habit-row-card');
    if ((await habitCards.count()) > 0) {
      const firstCard = habitCards.first();
      const todayDot = firstCard.locator('.habit-day-btn.today');
      if (await todayDot.isVisible()) {
        const wasDone = await todayDot.evaluate(el => el.classList.contains('done'));
        await todayDot.click();

        // Check if toggled with auto-retry
        if (wasDone) {
          await expect(todayDot).not.toHaveClass(/done/);
          await todayDot.click();
          await expect(todayDot).toHaveClass(/done/);
        } else {
          await expect(todayDot).toHaveClass(/done/);
          await todayDot.click();
          await expect(todayDot).not.toHaveClass(/done/);
        }
      }
    }
  });

  test('should create a new habit via + Novo Hábito modal', async ({ page }) => {
    const habitName = `Hábito E2E ${Date.now()}`;
    await page.locator('button:has-text("+ Novo Hábito")').click();
    await expect(page.locator('.modal-panel:has-text("Novo Hábito")')).toBeVisible();

    await page.locator('.modal-panel input[type="text"]').fill(habitName);
    await page.locator('.modal-panel textarea').fill('Gatilho de consistência diária');
    await page.locator('.modal-actions button:has-text("Salvar")').click();

    await expect(page.locator(`.habit-row-card:has-text("${habitName}")`)).toBeVisible({ timeout: 10000 });
  });
});
