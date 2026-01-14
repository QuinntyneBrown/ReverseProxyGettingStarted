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

  test('should display edit mode toggle', async ({ page }) => {
    await page.goto('/dashboard');

    const editToggle = page.locator('mat-slide-toggle');
    await expect(editToggle).toBeVisible();
    await expect(page.getByText('Edit')).toBeVisible();
  });
});

test.describe('Dashboard GridStack Tiles', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignalRConnection(page);
    await mockHttpEndpoints(page);
  });

  test('should display grid stack container', async ({ page }) => {
    await page.goto('/dashboard');

    const gridStack = page.locator('.grid-stack');
    await expect(gridStack).toBeVisible();
  });

  test('should display multiple grid items', async ({ page }) => {
    await page.goto('/dashboard');

    const gridItems = page.locator('.grid-stack-item');
    await expect(gridItems).toHaveCount(6);
  });

  test('should have correct default tile layout', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for components to render
    await page.waitForSelector('app-telemetry-table', { timeout: 10000 });

    // Check that we have 1 table and 5 charts
    const tableComponents = page.locator('app-telemetry-table');
    const chartComponents = page.locator('app-telemetry-chart');

    await expect(tableComponents).toHaveCount(1);
    await expect(chartComponents).toHaveCount(5);
  });
});

test.describe('Dashboard Telemetry Table', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignalRConnection(page);
    await mockHttpEndpoints(page);
  });

  test('should display telemetry table with title', async ({ page }) => {
    await page.goto('/dashboard');

    const tableCard = page.locator('app-telemetry-table mat-card');
    await expect(tableCard).toBeVisible();
    await expect(page.getByText('Telemetry Data')).toBeVisible();
  });

  test('should have filter input in telemetry table', async ({ page }) => {
    await page.goto('/dashboard');

    const filterInput = page.locator('app-telemetry-table input[matInput]');
    await expect(filterInput).toBeVisible();
    await expect(filterInput).toHaveAttribute('placeholder', 'Search telemetry...');
  });

  test('should display table headers', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('app-telemetry-table th').filter({ hasText: 'Name' })).toBeVisible();
    await expect(page.locator('app-telemetry-table th').filter({ hasText: 'Value' })).toBeVisible();
    await expect(page.locator('app-telemetry-table th').filter({ hasText: 'Timestamp' })).toBeVisible();
  });

  test('should display paginator', async ({ page }) => {
    await page.goto('/dashboard');

    const paginator = page.locator('app-telemetry-table mat-paginator');
    await expect(paginator).toBeVisible();
  });

  test('should display telemetry data after receiving telemetry', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for the mock telemetry to be received (sent automatically on SubscribeToAllTelemetry)
    // Check that at least one row with data appears
    const tableRows = page.locator('app-telemetry-table tr[mat-row]');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter telemetry data', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for data to load
    const tableRows = page.locator('app-telemetry-table tr[mat-row]');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });

    // Type in filter
    const filterInput = page.locator('app-telemetry-table input[matInput]');
    await filterInput.fill('Speed');
    await page.waitForTimeout(300);

    // Check that filtered results show Speed
    const speedCell = page.locator('app-telemetry-table td[mat-cell]').filter({ hasText: 'Speed' });
    await expect(speedCell).toBeVisible();
  });
});

test.describe('Dashboard Telemetry Charts', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignalRConnection(page);
    await mockHttpEndpoints(page);
  });

  test('should display telemetry charts', async ({ page }) => {
    await page.goto('/dashboard');

    const chartCards = page.locator('app-telemetry-chart mat-card');
    await expect(chartCards.first()).toBeVisible();
  });

  test('should have telemetry selector in charts', async ({ page }) => {
    await page.goto('/dashboard');

    const selectField = page.locator('app-telemetry-chart mat-select').first();
    await expect(selectField).toBeVisible();
  });

  test('should display chart canvas elements', async ({ page }) => {
    await page.goto('/dashboard');

    const canvasElements = page.locator('app-telemetry-chart canvas');
    await expect(canvasElements.first()).toBeVisible();
    await expect(canvasElements).toHaveCount(5);
  });

  test('should display default telemetry names in chart titles', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for default telemetry names in chart cards
    await expect(page.locator('app-telemetry-chart').filter({ hasText: 'Speed' }).first()).toBeVisible();
    await expect(page.locator('app-telemetry-chart').filter({ hasText: 'Temperature' }).first()).toBeVisible();
    await expect(page.locator('app-telemetry-chart').filter({ hasText: 'Voltage' }).first()).toBeVisible();
  });

  test('should show chart icon in chart headers', async ({ page }) => {
    await page.goto('/dashboard');

    const chartIcons = page.locator('app-telemetry-chart mat-icon').filter({ hasText: 'show_chart' });
    await expect(chartIcons.first()).toBeVisible();
  });

  test('should populate telemetry selector after receiving data', async ({ page }) => {
    await page.goto('/dashboard');

    // Emit mock telemetry data
    const mockBatch = createMockTelemetryBatch();
    await emitMockTelemetry(page, mockBatch);
    await page.waitForTimeout(500);

    // Click on the first telemetry selector
    const selectField = page.locator('app-telemetry-chart mat-select').first();
    await selectField.click();

    // Check that options are populated
    const options = page.locator('mat-option');
    await expect(options.first()).toBeVisible();
  });
});

test.describe('Dashboard Edit Mode', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignalRConnection(page);
    await mockHttpEndpoints(page);
  });

  test('should not show add/reset buttons when edit mode is off', async ({ page }) => {
    await page.goto('/dashboard');

    // Add button should not be visible when edit mode is off
    const addButton = page.locator('button[mattooltip="Add tile"]');
    await expect(addButton).not.toBeVisible();

    // Reset button should not be visible
    const resetButton = page.locator('button[mattooltip="Reset layout"]');
    await expect(resetButton).not.toBeVisible();
  });

  test('should show add button when edit mode is enabled', async ({ page }) => {
    await page.goto('/dashboard');

    // Enable edit mode
    const editToggle = page.locator('mat-slide-toggle');
    await editToggle.click();

    // Add button should now be visible
    const addButton = page.locator('button').filter({ has: page.locator('mat-icon:text("add")') });
    await expect(addButton).toBeVisible();
  });

  test('should show reset button when edit mode is enabled', async ({ page }) => {
    await page.goto('/dashboard');

    // Enable edit mode
    const editToggle = page.locator('mat-slide-toggle');
    await editToggle.click();

    // Reset button should now be visible
    const resetButton = page.locator('button').filter({ has: page.locator('mat-icon:text("restart_alt")') });
    await expect(resetButton).toBeVisible();
  });

  test('should show remove buttons on tiles when edit mode is enabled', async ({ page }) => {
    await page.goto('/dashboard');

    // Enable edit mode
    const editToggle = page.locator('mat-slide-toggle');
    await editToggle.click();

    // Remove buttons should be visible
    const removeButtons = page.locator('.remove-btn');
    await expect(removeButtons.first()).toBeVisible();
  });

  test('should hide remove buttons when edit mode is disabled', async ({ page }) => {
    await page.goto('/dashboard');

    // Remove buttons should not be visible initially
    const removeButtons = page.locator('.remove-btn');
    await expect(removeButtons.first()).not.toBeVisible();
  });

  test('should open add menu when clicking add button', async ({ page }) => {
    await page.goto('/dashboard');

    // Enable edit mode
    const editToggle = page.locator('mat-slide-toggle');
    await editToggle.click();

    // Click add button
    const addButton = page.locator('button').filter({ has: page.locator('mat-icon:text("add")') });
    await addButton.click();

    // Menu should be visible with options
    await expect(page.getByText('Add Table')).toBeVisible();
    await expect(page.getByText('Add Chart')).toBeVisible();
  });

  test('should add a new table tile', async ({ page }) => {
    await page.goto('/dashboard');

    // Enable edit mode
    const editToggle = page.locator('mat-slide-toggle');
    await editToggle.click();

    // Initial count
    const initialTableCount = await page.locator('app-telemetry-table').count();

    // Click add button and select table
    const addButton = page.locator('button').filter({ has: page.locator('mat-icon:text("add")') });
    await addButton.click();
    await page.getByText('Add Table').click();

    // Should have one more table
    await expect(page.locator('app-telemetry-table')).toHaveCount(initialTableCount + 1);
  });

  test('should add a new chart tile', async ({ page }) => {
    await page.goto('/dashboard');

    // Enable edit mode
    const editToggle = page.locator('mat-slide-toggle');
    await editToggle.click();

    // Initial count
    const initialChartCount = await page.locator('app-telemetry-chart').count();

    // Click add button and select chart
    const addButton = page.locator('button').filter({ has: page.locator('mat-icon:text("add")') });
    await addButton.click();
    await page.getByText('Add Chart').first().click();

    // Should have one more chart
    await expect(page.locator('app-telemetry-chart')).toHaveCount(initialChartCount + 1);
  });

  test('should remove a tile when clicking remove button', async ({ page }) => {
    await page.goto('/dashboard');

    // Enable edit mode
    const editToggle = page.locator('mat-slide-toggle');
    await editToggle.click();

    // Initial count
    const initialItemCount = await page.locator('.grid-stack-item').count();

    // Click the first remove button
    const removeButtons = page.locator('.remove-btn');
    await removeButtons.first().click();

    // Should have one less item
    await expect(page.locator('.grid-stack-item')).toHaveCount(initialItemCount - 1);
  });

  test('should reset layout to default', async ({ page }) => {
    await page.goto('/dashboard');

    // Enable edit mode
    const editToggle = page.locator('mat-slide-toggle');
    await editToggle.click();

    // Remove a tile
    const removeButtons = page.locator('.remove-btn');
    await removeButtons.first().click();

    // Verify one is removed
    await expect(page.locator('.grid-stack-item')).toHaveCount(5);

    // Click reset button
    const resetButton = page.locator('button').filter({ has: page.locator('mat-icon:text("restart_alt")') });
    await resetButton.click();

    // Should be back to 6 tiles
    await expect(page.locator('.grid-stack-item')).toHaveCount(6);
  });
});
