import { Page } from '@playwright/test';

export interface MockTelemetryMessage {
  name: string;
  value: number;
  utc: string;
  type: number;
}

export interface MockTelemetryBatch {
  items: MockTelemetryMessage[];
  batchTimestamp: string;
  sourceId: string;
}

export function createMockTelemetryBatch(): MockTelemetryBatch {
  const now = new Date().toISOString();
  return {
    items: [
      { name: 'Speed', value: 45.5, utc: now, type: 0 },
      { name: 'Temperature', value: 72.3, utc: now, type: 0 },
      { name: 'Voltage', value: 47.8, utc: now, type: 0 },
      { name: 'JointPressure', value: 125.4, utc: now, type: 0 },
      { name: 'Power', value: 1250.0, utc: now, type: 0 },
      { name: 'Status', value: 4, utc: now, type: 1 },
      { name: 'RPM', value: 4500, utc: now, type: 0 },
      { name: 'BatteryLevel', value: 85.0, utc: now, type: 0 },
      { name: 'Current', value: 26.1, utc: now, type: 0 },
      { name: 'Torque', value: 245.7, utc: now, type: 0 },
    ],
    batchTimestamp: now,
    sourceId: 'MockVehicle',
  };
}

export async function mockSignalRConnection(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Mock SignalR HubConnection
    (window as any).__mockSignalR = {
      connected: false,
      callbacks: new Map<string, Function[]>(),
    };

    const mockHubConnection = {
      state: 1, // Connected
      start: () => Promise.resolve(),
      stop: () => Promise.resolve(),
      on: (event: string, callback: Function) => {
        const callbacks =
          (window as any).__mockSignalR.callbacks.get(event) || [];
        callbacks.push(callback);
        (window as any).__mockSignalR.callbacks.set(event, callbacks);
      },
      off: () => {},
      invoke: () => Promise.resolve(),
      onreconnecting: () => {},
      onreconnected: () => {},
      onclose: () => {},
    };

    // Mock the SignalR library
    (window as any).signalR = {
      HubConnectionBuilder: class {
        withUrl() {
          return this;
        }
        withAutomaticReconnect() {
          return this;
        }
        configureLogging() {
          return this;
        }
        build() {
          return mockHubConnection;
        }
      },
      HubConnectionState: {
        Disconnected: 0,
        Connecting: 1,
        Connected: 2,
        Disconnecting: 3,
        Reconnecting: 4,
      },
      LogLevel: {
        Information: 2,
      },
    };
  });
}

export async function emitMockTelemetry(
  page: Page,
  batch: MockTelemetryBatch
): Promise<void> {
  await page.evaluate((data) => {
    const callbacks = (window as any).__mockSignalR?.callbacks?.get(
      'ReceiveTelemetry'
    );
    if (callbacks) {
      callbacks.forEach((cb: Function) => cb(data));
    }
  }, batch);
}
