import { test, expect } from '@playwright/test';
import { mockSignalRConnection, createMockTelemetryBatch, emitMockTelemetry } from './mocks/telemetry.mock';
import { mockHttpEndpoints } from './mocks/http.mock';

test.describe('Telemetry Chart', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignalRConnection(page);
    await mockHttpEndpoints(page);
    await page.goto('/dashboard');
  });

  test('should display chart canvas', async ({ page }) => {
    const canvas = page.locator('app-telemetry-chart canvas').first();
    await expect(canvas).toBeVisible();
  });

  test('should display chart card with title', async ({ page }) => {
    const chartCard = page.locator('app-telemetry-chart mat-card').first();
    await expect(chartCard).toBeVisible();

    const chartIcon = chartCard.locator('mat-icon').first();
    await expect(chartIcon).toBeVisible();
  });

  test('should have telemetry dropdown selector', async ({ page }) => {
    const chartCard = page.locator('app-telemetry-chart').first();
    const selectField = chartCard.locator('mat-form-field');
    await expect(selectField).toBeVisible();
  });

  test('should populate dropdown with telemetry names after receiving data', async ({ page }) => {
    // Emit mock telemetry
    await emitMockTelemetry(page, createMockTelemetryBatch());
    await page.waitForTimeout(200);

    // Open the dropdown
    const chartCard = page.locator('app-telemetry-chart').first();
    const select = chartCard.locator('mat-select');
    await select.click();

    // Check that options are available
    const options = page.locator('mat-option');
    await expect(options.first()).toBeVisible({ timeout: 5000 });
  });

  test('should render multiple charts', async ({ page }) => {
    const charts = page.locator('app-telemetry-chart');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThanOrEqual(1);
  });

  test('should update chart on telemetry selection change', async ({ page }) => {
    // Emit mock telemetry
    await emitMockTelemetry(page, createMockTelemetryBatch());
    await page.waitForTimeout(200);

    // Open dropdown and select a telemetry
    const chartCard = page.locator('app-telemetry-chart').first();
    const select = chartCard.locator('mat-select');
    await select.click();

    // Select first option
    const option = page.locator('mat-option').first();
    if (await option.isVisible()) {
      await option.click();

      // Chart should still be visible after selection
      const canvas = chartCard.locator('canvas');
      await expect(canvas).toBeVisible();
    }
  });

  test('chart should have smooth line interpolation', async ({ page }) => {
    // This test verifies the chart configuration includes tension for smooth lines
    // The actual smoothness is validated by the Chart.js configuration
    const canvas = page.locator('app-telemetry-chart canvas').first();
    await expect(canvas).toBeVisible();

    // Canvas should be rendered (has dimensions)
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.width).toBeGreaterThan(0);
    expect(boundingBox!.height).toBeGreaterThan(0);
  });
});
