import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { GridStack, GridStackWidget } from 'gridstack';
import { TelemetryTableComponent } from '../telemetry-table/telemetry-table.component';
import { TelemetryChartComponent } from '../telemetry-chart/telemetry-chart.component';

@Component({
  selector: 'app-dashboard-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TelemetryTableComponent,
    TelemetryChartComponent,
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-toolbar">
        <h1>Telemetry Dashboard</h1>
        <div class="toolbar-actions">
          <button mat-icon-button [matMenuTriggerFor]="addMenu">
            <mat-icon>add</mat-icon>
          </button>
          <mat-menu #addMenu="matMenu">
            <button mat-menu-item (click)="addTableWidget()">
              <mat-icon>table_chart</mat-icon>
              <span>Add Table</span>
            </button>
            <button mat-menu-item (click)="addChartWidget()">
              <mat-icon>show_chart</mat-icon>
              <span>Add Chart</span>
            </button>
          </mat-menu>
          <button mat-icon-button (click)="resetLayout()">
            <mat-icon>restart_alt</mat-icon>
          </button>
        </div>
      </div>

      <div #gridContainer class="grid-stack"></div>

      <div class="widget-templates" style="display: none">
        <div #tableTemplate>
          <app-telemetry-table></app-telemetry-table>
        </div>
        <div #chartTemplate>
          <app-telemetry-chart></app-telemetry-chart>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #121212;
      }

      .dashboard-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      }

      .dashboard-toolbar h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.87);
      }

      .toolbar-actions {
        display: flex;
        gap: 8px;
      }

      .grid-stack {
        flex: 1;
        padding: 16px;
        overflow: auto;
      }

      :host ::ng-deep .grid-stack-item-content {
        background: #1e1e1e;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }

      :host ::ng-deep .grid-stack > .grid-stack-item > .grid-stack-item-content {
        inset: 8px;
      }

      :host ::ng-deep .gs-id-table .grid-stack-item-content,
      :host ::ng-deep .gs-id-chart .grid-stack-item-content {
        display: flex;
        flex-direction: column;
      }

      :host ::ng-deep .grid-stack-item-content > * {
        flex: 1;
        height: 100%;
      }
    `,
  ],
})
export class DashboardGridComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gridContainer') gridContainer!: ElementRef;

  private grid: GridStack | null = null;
  private widgetCounter = 0;

  ngAfterViewInit(): void {
    this.initGrid();
    this.loadDefaultLayout();
  }

  private initGrid(): void {
    this.grid = GridStack.init(
      {
        column: 10,
        row: 30,
        cellHeight: 40,
        margin: 8,
        float: true,
        resizable: {
          handles: 'e,se,s,sw,w',
        },
        draggable: {
          handle: 'mat-card-header',
        },
      },
      this.gridContainer.nativeElement
    );
  }

  private loadDefaultLayout(): void {
    this.addTableWidget(0, 0, 5, 10);
    this.addChartWidget(5, 0, 5, 10, 'Speed');
    this.addChartWidget(0, 10, 5, 10, 'Temperature');
    this.addChartWidget(5, 10, 5, 10, 'Voltage');
  }

  addTableWidget(x = 0, y = 0, w = 5, h = 10): void {
    if (!this.grid) return;

    const id = `table-${this.widgetCounter++}`;
    this.grid.addWidget({
      id,
      x,
      y,
      w,
      h,
      content: `<app-telemetry-table></app-telemetry-table>`,
    });

    this.renderAngularComponent(id, 'table');
  }

  addChartWidget(
    x = 0,
    y = 0,
    w = 5,
    h = 10,
    defaultTelemetry?: string
  ): void {
    if (!this.grid) return;

    const id = `chart-${this.widgetCounter++}`;
    this.grid.addWidget({
      id,
      x,
      y,
      w,
      h,
      content: `<app-telemetry-chart></app-telemetry-chart>`,
    });

    this.renderAngularComponent(id, 'chart', defaultTelemetry);
  }

  private renderAngularComponent(
    id: string,
    type: 'table' | 'chart',
    defaultTelemetry?: string
  ): void {
    // Note: In a production app, you would use Angular's ComponentFactoryResolver
    // or ViewContainerRef to dynamically create components.
    // For this demo, the components are rendered via the template.
  }

  resetLayout(): void {
    if (!this.grid) return;
    this.grid.removeAll();
    this.widgetCounter = 0;
    this.loadDefaultLayout();
  }

  ngOnDestroy(): void {
    this.grid?.destroy();
  }
}
