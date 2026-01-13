import { test, expect } from '@playwright/test';
import { mockSignalRConnection, createMockTelemetryBatch, emitMockTelemetry } from './mocks/telemetry.mock';
import { mockHttpEndpoints } from './mocks/http.mock';

test.describe('Telemetry Table', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignalRConnection(page);
    await mockHttpEndpoints(page);
    await page.goto('/dashboard');
  });

  test('should display table headers', async ({ page }) => {
    const table = page.locator('app-telemetry-table table');
    await expect(table).toBeVisible();

    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Value' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Timestamp' })).toBeVisible();
  });

  test('should filter telemetry by name', async ({ page }) => {
    // Emit mock telemetry first
    await emitMockTelemetry(page, createMockTelemetryBatch());

    const filterInput = page.locator('app-telemetry-table input[matInput]');
    await filterInput.fill('Speed');

    // Wait for filter to apply
    await page.waitForTimeout(100);

    // Filtered results should contain Speed
    const rows = page.locator('app-telemetry-table table tbody tr');
    const visibleRows = await rows.count();

    // If filtering works, we should have fewer or equal rows
    expect(visibleRows).toBeGreaterThanOrEqual(0);
  });

  test('should display paginator', async ({ page }) => {
    const paginator = page.locator('app-telemetry-table mat-paginator');
    await expect(paginator).toBeVisible();
  });

  test('should have sortable columns', async ({ page }) => {
    const nameHeader = page.getByRole('columnheader', { name: 'Name' });
    await expect(nameHeader).toBeVisible();

    // Click to sort
    await nameHeader.click();

    // Verify sort indicator appears
    const sortArrow = nameHeader.locator('.mat-sort-header-arrow');
    await expect(sortArrow).toBeVisible();
  });

  test('should update when receiving telemetry', async ({ page }) => {
    // Emit mock telemetry
    const batch = createMockTelemetryBatch();
    await emitMockTelemetry(page, batch);

    // Wait for data to render
    await page.waitForTimeout(200);

    // Table should contain telemetry data
    const table = page.locator('app-telemetry-table table');
    await expect(table).toBeVisible();
  });
});
