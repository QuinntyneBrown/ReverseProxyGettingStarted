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
  // Mock the SignalR negotiate endpoint
  await page.route('**/hubs/telemetry/negotiate**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        negotiateVersion: 1,
        connectionId: 'mock-connection-id',
        connectionToken: 'mock-token',
        availableTransports: [
          { transport: 'WebSockets', transferFormats: ['Text', 'Binary'] },
          { transport: 'ServerSentEvents', transferFormats: ['Text'] },
          { transport: 'LongPolling', transferFormats: ['Text', 'Binary'] },
        ],
      }),
    });
  });

  // Store telemetry callbacks for later use
  await page.addInitScript(() => {
    (window as any).__telemetryCallbacks = [];
    (window as any).__connectionState = 'Connected';
  });

  // Mock WebSocket connections to SignalR hub
  await page.addInitScript(() => {
    const OriginalWebSocket = window.WebSocket;

    class MockWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = MockWebSocket.OPEN;
      url: string;
      onopen: ((ev: Event) => any) | null = null;
      onclose: ((ev: CloseEvent) => any) | null = null;
      onmessage: ((ev: MessageEvent) => any) | null = null;
      onerror: ((ev: Event) => any) | null = null;

      constructor(url: string) {
        this.url = url;

        // Only mock SignalR hub connections
        if (url.includes('/hubs/telemetry')) {
          setTimeout(() => {
            if (this.onopen) {
              this.onopen(new Event('open'));
            }
            // Send handshake response
            if (this.onmessage) {
              this.onmessage(new MessageEvent('message', { data: '{}' + String.fromCharCode(0x1e) }));
            }
          }, 10);

          // Store reference for sending mock data
          (window as any).__mockWebSocket = this;
        } else {
          // For non-SignalR connections, use real WebSocket
          return new OriginalWebSocket(url) as any;
        }
      }

      send(data: string) {
        // Handle SignalR invocations
        if (data.includes('SubscribeToAllTelemetry')) {
          // Send initial telemetry data
          setTimeout(() => {
            this.sendMockTelemetry();
          }, 50);
        }
      }

      sendMockTelemetry() {
        const now = new Date().toISOString();
        const batch = {
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

        // SignalR message format: {"type":1,"target":"ReceiveTelemetry","arguments":[batch]}
        const message = JSON.stringify({
          type: 1,
          target: 'ReceiveTelemetry',
          arguments: [batch],
        }) + String.fromCharCode(0x1e);

        if (this.onmessage) {
          this.onmessage(new MessageEvent('message', { data: message }));
        }
      }

      close() {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
          this.onclose(new CloseEvent('close'));
        }
      }

      addEventListener(type: string, listener: EventListener) {
        if (type === 'open') this.onopen = listener as any;
        if (type === 'close') this.onclose = listener as any;
        if (type === 'message') this.onmessage = listener as any;
        if (type === 'error') this.onerror = listener as any;
      }

      removeEventListener() {}
    }

    (window as any).WebSocket = MockWebSocket;
  });
}

export async function emitMockTelemetry(
  page: Page,
  batch: MockTelemetryBatch
): Promise<void> {
  await page.evaluate((data) => {
    const ws = (window as any).__mockWebSocket;
    if (ws && ws.onmessage) {
      const message = JSON.stringify({
        type: 1,
        target: 'ReceiveTelemetry',
        arguments: [data],
      }) + String.fromCharCode(0x1e);
      ws.onmessage(new MessageEvent('message', { data: message }));
    }
  }, batch);
}
