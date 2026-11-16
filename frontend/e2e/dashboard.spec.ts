import { test, expect } from '@playwright/test';
import { loginAsDefaultUser } from './helpers/auth';

test.describe('Dashboard and Bento Grid', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
  });

  test('should display all bento cards and topbar navigation', async ({ page }) => {
    await expect(page.locator('.bento-grid')).toBeVisible();
    await expect(page.locator('.diary-card')).toBeVisible();
    await expect(page.locator('.requests-card')).toBeVisible();
    await expect(page.locator('.habit-card')).toBeVisible();
    await expect(page.locator('.today-tasks-card')).toBeVisible();
    await expect(page.locator('.calendar-panel')).toBeVisible();

    // Verify clean topbar links matching visual reference
    await expect(page.locator('.nav-item:has-text("Home")')).toBeVisible();
    await expect(page.locator('.nav-item:has-text("Módulos")')).toBeVisible();
    await expect(page.locator('.nav-item:has-text("Add")')).toBeVisible();

    // Opening Módulos dropdown reveals all modules
    await page.locator('.nav-item:has-text("Módulos")').click();
    await expect(page.locator('.modules-dropdown-menu')).toBeVisible();
    await expect(page.locator('.modules-dropdown-item:has-text("Calendário")')).toBeVisible();
    await expect(page.locator('.modules-dropdown-item:has-text("Quadro Kanban")')).toBeVisible();
    await expect(page.locator('.modules-dropdown-item:has-text("Caixa de Entrada")')).toBeVisible();
    await expect(page.locator('.modules-dropdown-item:has-text("Áreas da Vida")')).toBeVisible();
    await expect(page.locator('.modules-dropdown-item:has-text("Projetos")')).toBeVisible();
    await expect(page.locator('.modules-dropdown-item:has-text("Hábitos & Rotinas")')).toBeVisible();
    await expect(page.locator('.modules-dropdown-item:has-text("Life Tracker")')).toBeVisible();

    // Click outside closes modules menu
    await page.locator('.brand-logo').click();
    await expect(page.locator('.modules-dropdown-menu')).not.toBeVisible();
  });

  test('should toggle theme between light and dark', async ({ page }) => {
    const themeBtn = page.locator('.theme-btn');
    const body = page.locator('body');

    const wasLight = await body.evaluate(el => el.classList.contains('light-theme'));
    await themeBtn.click();

    if (wasLight) {
      await expect(body).not.toHaveClass(/light-theme/);
      await themeBtn.click();
      await expect(body).toHaveClass(/light-theme/);
    } else {
      await expect(body).toHaveClass(/light-theme/);
      await themeBtn.click();
      await expect(body).not.toHaveClass(/light-theme/);
    }
  });

  test('should open and close Quick Capture modal with Ctrl+K shortcut', async ({ page }) => {
    // Press Ctrl+K
    await page.keyboard.press('Control+k');
    await expect(page.locator('.modal-panel:has-text("Captura Rápida")')).toBeVisible();

    // Type a test note
    await page.locator('.modal-panel input[type="text"]').fill('Nota E2E Quick Capture');

    // Close with Cancel button
    await page.locator('.modal-actions button:has-text("Cancelar")').click();
    await expect(page.locator('.modal-panel:has-text("Captura Rápida")')).not.toBeVisible();
  });

  test('should filter tasks by clicking area pills', async ({ page }) => {
    const workPill = page.locator('.area-pills button.area-pill:has-text("Trabalho")');
    if (await workPill.isVisible()) {
      await workPill.click();
      await expect(workPill).toHaveClass(/active/);

      // Click "Todas" to reset
      const allPill = page.locator('.area-pills button.area-pill:has-text("Todas")');
      await allPill.click();
      await expect(allPill).toHaveClass(/active/);
    }
  });

  test('should toggle task completion when clicking task item', async ({ page }) => {
    const firstTask = page.locator('.today-tasks-card .task-row').first();
    await expect(firstTask).toBeVisible();
    const wasDone = await firstTask.evaluate((el) => el.classList.contains('done'));

    await firstTask.click();
    if (wasDone) {
      await expect(firstTask).not.toHaveClass(/done/);
      await page.waitForTimeout(300);
      await firstTask.click();
      await expect(firstTask).toHaveClass(/done/);
    } else {
      await expect(firstTask).toHaveClass(/done/);
      await page.waitForTimeout(300);
      await firstTask.click();
      await expect(firstTask).not.toHaveClass(/done/);
    }
  });

  test('should switch calendar active day when clicking day-tab in week-strip', async ({ page }) => {
    const dayTabs = page.locator('.calendar-panel .week-strip .day-tab');
    await expect(dayTabs).toHaveCount(7);

    // Initial active tab exists
    const initialActive = page.locator('.calendar-panel .week-strip .day-tab.active');
    await expect(initialActive).toHaveCount(1);

    // Click the first day tab (Domingo)
    const firstTab = dayTabs.first();
    await firstTab.click();
    await expect(firstTab).toHaveClass(/active/);

    // Click the last day tab (Sábado)
    const lastTab = dayTabs.last();
    await lastTab.click();
    await expect(lastTab).toHaveClass(/active/);
    await expect(firstTab).not.toHaveClass(/active/);
  });

  test('should toggle event completion when clicking event check-circle', async ({ page }) => {
    // Navigate to a day with events (or today)
    const dayTabs = page.locator('.calendar-panel .week-strip .day-tab');
    const todayTab = page.locator('.calendar-panel .week-strip .day-tab.active');
    await todayTab.click();

    // Check if an event card exists
    const eventCard = page.locator('.calendar-panel .event-card').first();
    if (await eventCard.isVisible()) {
      const toggleBtn = eventCard.locator('.event-toggle-area');
      const wasDone = await eventCard.evaluate(el => el.classList.contains('is-done'));

      await toggleBtn.click();
      if (wasDone) {
        await expect(eventCard).not.toHaveClass(/is-done/);
        await page.waitForTimeout(300);
        await toggleBtn.click();
        await expect(eventCard).toHaveClass(/is-done/);
      } else {
        await expect(eventCard).toHaveClass(/is-done/);
        await page.waitForTimeout(300);
        await toggleBtn.click();
        await expect(eventCard).not.toHaveClass(/is-done/);
      }
    }
  });
});
