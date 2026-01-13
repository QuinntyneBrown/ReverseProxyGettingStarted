import { Component, OnInit, OnDestroy } from '@angular/core';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { TelemetryService } from '../../core/services/telemetry.service';
import { TelemetryTableComponent } from './components/telemetry-table/telemetry-table.component';
import { TelemetryChartComponent } from './components/telemetry-chart/telemetry-chart.component';

@Component({
    selector: 'app-dashboard',
    imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    TelemetryTableComponent,
    TelemetryChartComponent
],
    template: `
    <div class="dashboard-layout">
      <mat-toolbar color="primary" class="dashboard-toolbar">
        <mat-icon>dashboard</mat-icon>
        <span>Telemetry Dashboard</span>
        <span class="spacer"></span>
        <mat-chip-set>
          <mat-chip
            [class.connected]="connectionState === 'Connected'"
            [class.disconnected]="connectionState === 'Disconnected'"
            [class.reconnecting]="connectionState === 'Reconnecting'"
          >
            <mat-icon matChipAvatar>
              {{
                connectionState === 'Connected'
                  ? 'wifi'
                  : connectionState === 'Reconnecting'
                    ? 'sync'
                    : 'wifi_off'
              }}
            </mat-icon>
            {{ connectionState }}
          </mat-chip>
        </mat-chip-set>
      </mat-toolbar>

      <div class="dashboard-content">
        <div class="dashboard-grid">
          <div class="grid-item table-widget">
            <app-telemetry-table></app-telemetry-table>
          </div>
          <div class="grid-item chart-widget">
            <app-telemetry-chart
              [defaultTelemetry]="'Speed'"
            ></app-telemetry-chart>
          </div>
          <div class="grid-item chart-widget">
            <app-telemetry-chart
              [defaultTelemetry]="'Temperature'"
            ></app-telemetry-chart>
          </div>
          <div class="grid-item chart-widget">
            <app-telemetry-chart
              [defaultTelemetry]="'Voltage'"
            ></app-telemetry-chart>
          </div>
          <div class="grid-item chart-widget">
            <app-telemetry-chart
              [defaultTelemetry]="'JointPressure'"
            ></app-telemetry-chart>
          </div>
          <div class="grid-item chart-widget">
            <app-telemetry-chart
              [defaultTelemetry]="'Power'"
            ></app-telemetry-chart>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [
        `
      .dashboard-layout {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #121212;
      }

      .dashboard-toolbar {
        display: flex;
        gap: 12px;
        background: #1e1e1e !important;
      }

      .spacer {
        flex: 1;
      }

      .connected {
        background: #4caf50 !important;
        color: white !important;
      }

      .disconnected {
        background: #f44336 !important;
        color: white !important;
      }

      .reconnecting {
        background: #ff9800 !important;
        color: white !important;
      }

      .dashboard-content {
        flex: 1;
        padding: 16px;
        overflow: auto;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 16px;
        height: 100%;
        min-height: 600px;
      }

      .grid-item {
        min-height: 300px;
      }

      .table-widget {
        grid-column: span 1;
        grid-row: span 2;
      }

      .chart-widget {
        min-height: 280px;
      }

      @media (max-width: 1200px) {
        .dashboard-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .table-widget {
          grid-column: span 2;
          grid-row: span 1;
        }
      }

      @media (max-width: 768px) {
        .dashboard-grid {
          grid-template-columns: 1fr;
        }

        .table-widget {
          grid-column: span 1;
        }
      }
    `,
    ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  connectionState = 'Disconnected';
  private destroy$ = new Subject<void>();

  constructor(private telemetryService: TelemetryService) {}

  ngOnInit(): void {
    this.telemetryService.connectionState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.connectionState = signalR.HubConnectionState[state];
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
