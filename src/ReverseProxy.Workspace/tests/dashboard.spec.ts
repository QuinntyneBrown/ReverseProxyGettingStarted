import { test, expect } from '@playwright/test';
import { mockSignalRConnection, createMockTelemetryBatch, emitMockTelemetry } from './mocks/telemetry.mock';
import { mockHttpEndpoints } from './mocks/http.mock';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignalRConnection(page);
    await mockHttpEndpoints(page);
  });

  test('should display dashboard page', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('mat-toolbar')).toBeVisible();
    await expect(page.getByText('Telemetry Dashboard')).toBeVisible();
  });

  test('should show connection status indicator', async ({ page }) => {
    await page.goto('/dashboard');

    const connectionChip = page.locator('mat-chip');
    await expect(connectionChip).toBeVisible();
  });

  test('should display telemetry table', async ({ page }) => {
    await page.goto('/dashboard');

    const tableCard = page.locator('app-telemetry-table mat-card');
    await expect(tableCard).toBeVisible();

    await expect(page.getByText('Telemetry Data')).toBeVisible();
  });

  test('should display telemetry charts', async ({ page }) => {
    await page.goto('/dashboard');

    const chartCards = page.locator('app-telemetry-chart mat-card');
    await expect(chartCards.first()).toBeVisible();
  });

  test('should have filter input in telemetry table', async ({ page }) => {
    await page.goto('/dashboard');

    const filterInput = page.locator('app-telemetry-table input[matInput]');
    await expect(filterInput).toBeVisible();
    await expect(filterInput).toHaveAttribute('placeholder', 'Search telemetry...');
  });

  test('should have telemetry selector in charts', async ({ page }) => {
    await page.goto('/dashboard');

    const selectField = page.locator('app-telemetry-chart mat-select').first();
    await expect(selectField).toBeVisible();
  });
});
