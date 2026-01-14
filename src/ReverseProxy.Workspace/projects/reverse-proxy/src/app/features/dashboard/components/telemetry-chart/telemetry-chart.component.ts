import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input,
  AfterViewInit,
} from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { TelemetryService } from '../../../../core/services/telemetry.service';
import { TelemetryDataPoint } from '../../../../core/models/telemetry.model';

Chart.register(...registerables);

@Component({
    selector: 'app-telemetry-chart',
    imports: [
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    FormsModule
],
    template: `
    <mat-card class="chart-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>show_chart</mat-icon>
          {{ selectedTelemetry || 'Select Telemetry' }}
        </mat-card-title>
        <mat-form-field appearance="outline" class="telemetry-select">
          <mat-label>Telemetry</mat-label>
          <mat-select
            [(value)]="selectedTelemetry"
            (selectionChange)="onTelemetryChange()"
          >
            @for (name of telemetryNames; track name) {
            <mat-option [value]="name">{{ name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-card-header>
      <mat-card-content>
        <div class="chart-container">
          <canvas #chartCanvas></canvas>
        </div>
      </mat-card-content>
    </mat-card>
  `,
    styles: [
        `
      .chart-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--mat-card-background, #1e1e1e);
      }

      mat-card-header {
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 16px;
      }

      .telemetry-select {
        width: 200px;
        margin: 0;
      }

      mat-card-content {
        flex: 1;
        padding: 16px;
        overflow: hidden;
      }

      .chart-container {
        width: 100%;
        height: 100%;
        position: relative;
      }

      canvas {
        width: 100% !important;
        height: 100% !important;
      }
    `,
    ]
})
export class TelemetryChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() defaultTelemetry?: string;

  selectedTelemetry = '';
  telemetryNames: string[] = [];
  private chart: Chart | null = null;
  private destroy$ = new Subject<void>();

  constructor(private telemetryService: TelemetryService) {}

  ngOnInit(): void {
    this.telemetryService.telemetry$
      .pipe(takeUntil(this.destroy$))
      .subscribe((batch) => {
        this.updateTelemetryNames();
        if (this.selectedTelemetry) {
          this.updateChart();
        }
      });
  }

  ngAfterViewInit(): void {
    this.initChart();
    if (this.defaultTelemetry) {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.selectedTelemetry = this.defaultTelemetry!;
        this.onTelemetryChange();
      });
    }
  }

  private initChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Value',
            data: [],
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0,
        },
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            display: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              maxRotation: 0,
              maxTicksLimit: 5,
            },
          },
          y: {
            display: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }

  private updateTelemetryNames(): void {
    const currentValues = this.telemetryService.getAllCurrentValues();
    this.telemetryNames = Array.from(currentValues.keys()).sort();
  }

  onTelemetryChange(): void {
    this.updateChart();
  }

  private updateChart(): void {
    if (!this.chart || !this.selectedTelemetry) return;

    const history = this.telemetryService.getHistory(this.selectedTelemetry);
    const labels = history.map((p) =>
      p.timestamp.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    const data = history.map((p) => p.value);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.data.datasets[0].label = this.selectedTelemetry;
    this.chart.update('none');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chart?.destroy();
  }
}
