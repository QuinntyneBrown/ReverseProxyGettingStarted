import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import {
  TelemetryMessage,
  TelemetryBatch,
  TelemetryDefinition,
  TelemetryDataPoint,
} from '../models/telemetry.model';

@Injectable({
  providedIn: 'root',
})
export class TelemetryService implements OnDestroy {
  private hubConnection: signalR.HubConnection | null = null;
  private readonly hubUrl = 'http://localhost:5100/hubs/telemetry';

  private telemetrySubject = new Subject<TelemetryBatch>();
  private connectionStateSubject = new BehaviorSubject<signalR.HubConnectionState>(
    signalR.HubConnectionState.Disconnected
  );

  private telemetryCache = new Map<string, TelemetryMessage>();
  private telemetryHistory = new Map<string, TelemetryDataPoint[]>();
  private readonly maxHistoryLength = 100;

  telemetry$ = this.telemetrySubject.asObservable();
  connectionState$ = this.connectionStateSubject.asObservable();

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.onreconnecting(() => {
      this.connectionStateSubject.next(signalR.HubConnectionState.Reconnecting);
    });

    this.hubConnection.onreconnected(() => {
      this.connectionStateSubject.next(signalR.HubConnectionState.Connected);
      this.subscribeToAllTelemetry();
    });

    this.hubConnection.onclose(() => {
      this.connectionStateSubject.next(signalR.HubConnectionState.Disconnected);
    });

    this.hubConnection.on('ReceiveTelemetry', (batch: TelemetryBatch) => {
      this.processTelemetryBatch(batch);
    });

    this.hubConnection.on('ReceiveTelemetryItem', (item: TelemetryMessage) => {
      this.processTelemetryItem(item);
    });

    this.connect();
  }

  async connect(): Promise<void> {
    if (!this.hubConnection) return;

    try {
      await this.hubConnection.start();
      this.connectionStateSubject.next(signalR.HubConnectionState.Connected);
      await this.subscribeToAllTelemetry();
    } catch (error) {
      console.error('SignalR connection error:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async subscribeToAllTelemetry(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SubscribeToAllTelemetry');
    }
  }

  async subscribeToTelemetry(names: string[]): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SubscribeToTelemetry', names);
    }
  }

  private processTelemetryBatch(batch: TelemetryBatch): void {
    batch.items.forEach((item) => this.processTelemetryItem(item));
    this.telemetrySubject.next(batch);
  }

  private processTelemetryItem(item: TelemetryMessage): void {
    this.telemetryCache.set(item.name, item);

    let history = this.telemetryHistory.get(item.name);
    if (!history) {
      history = [];
      this.telemetryHistory.set(item.name, history);
    }

    history.push({
      timestamp: new Date(item.utc),
      value: item.value,
    });

    if (history.length > this.maxHistoryLength) {
      history.shift();
    }
  }

  getCurrentValue(name: string): TelemetryMessage | undefined {
    return this.telemetryCache.get(name);
  }

  getAllCurrentValues(): Map<string, TelemetryMessage> {
    return new Map(this.telemetryCache);
  }

  getHistory(name: string): TelemetryDataPoint[] {
    return this.telemetryHistory.get(name) || [];
  }

  ngOnDestroy(): void {
    this.hubConnection?.stop();
  }
}
