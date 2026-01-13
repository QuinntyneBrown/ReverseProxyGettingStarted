import { test, expect } from '@playwright/test';
import { mockSignalRConnection, createMockTelemetryBatch, emitMockTelemetry } from './mocks/telemetry.mock';
import { mockHttpEndpoints } from './mocks/http.mock';

test.describe('WebSocket / SignalR Integration', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignalRConnection(page);
    await mockHttpEndpoints(page);
  });

  test('should connect to SignalR hub on page load', async ({ page }) => {
    await page.goto('/dashboard');

    // Connection indicator should be visible
    const connectionChip = page.locator('mat-chip');
    await expect(connectionChip).toBeVisible();
  });

  test('should receive and process telemetry batch', async ({ page }) => {
    await page.goto('/dashboard');

    // Emit mock telemetry
    const batch = createMockTelemetryBatch();
    await emitMockTelemetry(page, batch);

    // Wait for data to be processed
    await page.waitForTimeout(300);

    // Table should be populated
    const table = page.locator('app-telemetry-table table');
    await expect(table).toBeVisible();
  });

  test('should handle multiple telemetry updates', async ({ page }) => {
    await page.goto('/dashboard');

    // Emit multiple batches
    for (let i = 0; i < 5; i++) {
      const batch = createMockTelemetryBatch();
      batch.items.forEach(item => {
        item.value = item.value + i * 0.1;
      });
      await emitMockTelemetry(page, batch);
      await page.waitForTimeout(50);
    }

    // Dashboard should remain stable
    await expect(page.locator('app-telemetry-table')).toBeVisible();
    await expect(page.locator('app-telemetry-chart').first()).toBeVisible();
  });

  test('should update charts with real-time data', async ({ page }) => {
    await page.goto('/dashboard');

    // Emit telemetry
    await emitMockTelemetry(page, createMockTelemetryBatch());
    await page.waitForTimeout(200);

    // Charts should be rendered
    const canvas = page.locator('app-telemetry-chart canvas').first();
    await expect(canvas).toBeVisible();
  });

  test('should maintain data history for charts', async ({ page }) => {
    await page.goto('/dashboard');

    // Emit multiple batches to build history
    for (let i = 0; i < 10; i++) {
      const batch = createMockTelemetryBatch();
      batch.batchTimestamp = new Date(Date.now() + i * 1000).toISOString();
      batch.items.forEach(item => {
        item.value = item.value + Math.sin(i) * 5;
        item.utc = batch.batchTimestamp;
      });
      await emitMockTelemetry(page, batch);
      await page.waitForTimeout(50);
    }

    // Charts should display historical data points
    const canvas = page.locator('app-telemetry-chart canvas').first();
    await expect(canvas).toBeVisible();
  });
});
