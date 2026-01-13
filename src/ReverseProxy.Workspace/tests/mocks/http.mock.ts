import { Page, Route } from '@playwright/test';

export interface MockCommandResponse {
  success: boolean;
  message: string;
  command: number;
  utc: string;
}

export async function mockHttpEndpoints(page: Page): Promise<void> {
  // Mock command endpoint
  await page.route('**/api/command', async (route: Route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const body = request.postDataJSON();
      const response: MockCommandResponse = {
        success: true,
        message: `Command ${body.command} sent`,
        command: body.command,
        utc: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    } else {
      await route.continue();
    }
  });

  // Mock command types endpoint
  await page.route('**/api/command/types', async (route: Route) => {
    const commandTypes = [
      'Start',
      'Stop',
      'GoUp',
      'GoDown',
      'GoLeft',
      'GoRight',
      'GoForward',
      'GoBackward',
      'RotateClockwise',
      'RotateCounterClockwise',
      'Accelerate',
      'Decelerate',
      'EmergencyStop',
      'Reset',
      'Calibrate',
      'SetSpeed',
      'SetPosition',
      'Pause',
      'Resume',
      'Diagnostic',
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(commandTypes),
    });
  });

  // Mock telemetry definitions endpoint
  await page.route('**/api/telemetry/definitions', async (route: Route) => {
    const definitions = [
      { name: 'Speed', displayName: 'Current Speed', unit: 'm/s', minValue: 0, maxValue: 100 },
      { name: 'Temperature', displayName: 'Motor Temperature', unit: '°C', minValue: -40, maxValue: 150 },
      { name: 'Voltage', displayName: 'Battery Voltage', unit: 'V', minValue: 0, maxValue: 48 },
      { name: 'JointPressure', displayName: 'Joint Pressure', unit: 'PSI', minValue: 0, maxValue: 1000 },
      { name: 'Power', displayName: 'Power Consumption', unit: 'W', minValue: 0, maxValue: 5000 },
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(definitions),
    });
  });

  // Mock current telemetry endpoint
  await page.route('**/api/telemetry/current', async (route: Route) => {
    const currentTelemetry = {
      Speed: { name: 'Speed', value: 45.5, utc: new Date().toISOString(), type: 0 },
      Temperature: { name: 'Temperature', value: 72.3, utc: new Date().toISOString(), type: 0 },
      Voltage: { name: 'Voltage', value: 47.8, utc: new Date().toISOString(), type: 0 },
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentTelemetry),
    });
  });
}
