import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ComponentRef,
  Injector,
  EnvironmentInjector,
  ApplicationRef,
  createComponent,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { GridStack, GridStackNode, GridStackWidget } from 'gridstack';
import { TelemetryService } from '../../core/services/telemetry.service';
import { TelemetryTableComponent } from './components/telemetry-table/telemetry-table.component';
import { TelemetryChartComponent } from './components/telemetry-chart/telemetry-chart.component';

interface DashboardTile {
  id: string;
  type: 'chart' | 'table';
  x: number;
  y: number;
  w: number;
  h: number;
  defaultTelemetry?: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatSlideToggleModule,
    FormsModule,
  ],
  template: `
    <div class="dashboard-layout">
      <mat-toolbar color="primary" class="dashboard-toolbar">
        <mat-icon>dashboard</mat-icon>
        <span>Telemetry Dashboard</span>
        <span class="spacer"></span>

        <div class="toolbar-actions">
          @if (editMode) {
            <button
              mat-icon-button
              [matMenuTriggerFor]="addMenu"
              matTooltip="Add tile"
            >
              <mat-icon>add</mat-icon>
            </button>
            <mat-menu #addMenu="matMenu">
              <button mat-menu-item (click)="addTile('table')">
                <mat-icon>table_chart</mat-icon>
                <span>Add Table</span>
              </button>
              <button mat-menu-item (click)="addTile('chart')">
                <mat-icon>show_chart</mat-icon>
                <span>Add Chart</span>
              </button>
              <button mat-menu-item (click)="addTile('chart', 'Speed')">
                <mat-icon>speed</mat-icon>
                <span>Add Speed Chart</span>
              </button>
              <button mat-menu-item (click)="addTile('chart', 'Temperature')">
                <mat-icon>thermostat</mat-icon>
                <span>Add Temperature Chart</span>
              </button>
              <button mat-menu-item (click)="addTile('chart', 'Voltage')">
                <mat-icon>bolt</mat-icon>
                <span>Add Voltage Chart</span>
              </button>
            </mat-menu>
            <button
              mat-icon-button
              matTooltip="Reset layout"
              (click)="resetLayout()"
            >
              <mat-icon>restart_alt</mat-icon>
            </button>
          }

          <mat-slide-toggle
            [(ngModel)]="editMode"
            (change)="onEditModeChange()"
            color="primary"
            class="edit-toggle"
          >
            <span class="toggle-label">Edit</span>
          </mat-slide-toggle>
        </div>

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
        <div #gridContainer class="grid-stack"></div>
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

      .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-right: 16px;
      }

      .edit-toggle {
        margin-left: 8px;
      }

      .toggle-label {
        color: rgba(255, 255, 255, 0.87);
        margin-left: 8px;
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

      .grid-stack {
        min-height: 100%;
      }

      :host ::ng-deep .grid-stack-item-content {
        background: #1e1e1e;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.12);
        display: flex;
        flex-direction: column;
      }

      :host ::ng-deep .grid-stack > .grid-stack-item > .grid-stack-item-content {
        inset: 8px;
      }

      :host ::ng-deep .tile-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        position: relative;
      }

      :host ::ng-deep .tile-content {
        flex: 1;
        overflow: hidden;
      }

      :host ::ng-deep .tile-content > * {
        height: 100%;
      }

      :host ::ng-deep .remove-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        z-index: 10;
        background: rgba(244, 67, 54, 0.9) !important;
        color: white !important;
        width: 28px;
        height: 28px;
        line-height: 28px;
      }

      :host ::ng-deep .remove-btn .mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        line-height: 18px;
      }

      :host ::ng-deep .remove-btn:hover {
        background: #f44336 !important;
      }

      :host ::ng-deep .grid-stack-item.ui-draggable-dragging > .grid-stack-item-content,
      :host ::ng-deep .grid-stack-item.ui-resizable-resizing > .grid-stack-item-content {
        border-color: #4caf50;
        box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
      }

      :host ::ng-deep .grid-stack.editing .grid-stack-item-content {
        border-color: rgba(76, 175, 80, 0.5);
      }

      :host ::ng-deep .grid-stack-placeholder > .placeholder-content {
        background: rgba(76, 175, 80, 0.2) !important;
        border: 2px dashed #4caf50 !important;
        border-radius: 8px;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gridContainer') gridContainer!: ElementRef;

  connectionState = 'Disconnected';
  editMode = false;

  private grid: GridStack | null = null;
  private destroy$ = new Subject<void>();
  private tileCounter = 0;
  private componentRefs = new Map<string, ComponentRef<any>>();

  constructor(
    private telemetryService: TelemetryService,
    private injector: Injector,
    private environmentInjector: EnvironmentInjector,
    private appRef: ApplicationRef
  ) {}

  ngOnInit(): void {
    this.telemetryService.connectionState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.connectionState = signalR.HubConnectionState[state];
      });
  }

  ngAfterViewInit(): void {
    this.initGrid();
    this.loadDefaultLayout();
    this.setEditMode(false);
  }

  private initGrid(): void {
    this.grid = GridStack.init(
      {
        column: 12,
        cellHeight: 80,
        margin: 8,
        float: true,
        animate: true,
        resizable: {
          handles: 'e,se,s,sw,w',
        },
        draggable: {
          handle: '.grid-stack-item-content',
        },
        minRow: 1,
      },
      this.gridContainer.nativeElement
    );

    this.grid.on('removed', (event: Event, items: GridStackNode[]) => {
      items.forEach((item) => {
        if (item.id) {
          this.destroyComponent(item.id.toString());
        }
      });
    });
  }

  private loadDefaultLayout(): void {
    const defaultTiles: DashboardTile[] = [
      { id: 'tile-0', type: 'table', x: 0, y: 0, w: 4, h: 6 },
      { id: 'tile-1', type: 'chart', x: 4, y: 0, w: 4, h: 3, defaultTelemetry: 'Speed' },
      { id: 'tile-2', type: 'chart', x: 8, y: 0, w: 4, h: 3, defaultTelemetry: 'Temperature' },
      { id: 'tile-3', type: 'chart', x: 4, y: 3, w: 4, h: 3, defaultTelemetry: 'Voltage' },
      { id: 'tile-4', type: 'chart', x: 8, y: 3, w: 4, h: 3, defaultTelemetry: 'JointPressure' },
      { id: 'tile-5', type: 'chart', x: 0, y: 6, w: 6, h: 3, defaultTelemetry: 'Power' },
    ];

    this.tileCounter = defaultTiles.length;

    defaultTiles.forEach((tile) => {
      this.createTile(tile);
    });
  }

  private createTile(tile: DashboardTile): void {
    if (!this.grid) return;

    // Create the widget element first
    const widget: GridStackWidget = {
      id: tile.id,
      x: tile.x,
      y: tile.y,
      w: tile.w,
      h: tile.h,
    };

    const widgetEl = this.grid.addWidget(widget);

    if (widgetEl) {
      // Find the content container created by GridStack
      const contentContainer = widgetEl.querySelector('.grid-stack-item-content');
      if (contentContainer) {
        // Create wrapper structure
        const wrapper = document.createElement('div');
        wrapper.className = 'tile-wrapper';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.style.display = 'none';
        removeBtn.title = 'Remove tile';
        removeBtn.innerHTML = '<span class="mat-icon material-icons">close</span>';
        removeBtn.addEventListener('click', (e: Event) => {
          e.stopPropagation();
          this.removeTile(tile.id);
        });

        const tileContent = document.createElement('div');
        tileContent.className = 'tile-content';

        wrapper.appendChild(removeBtn);
        wrapper.appendChild(tileContent);
        contentContainer.appendChild(wrapper);

        // Render the Angular component
        this.renderComponent(tile, tileContent);
      }
    }
  }

  private renderComponent(tile: DashboardTile, container: HTMLElement): void {
    if (tile.type === 'table') {
      const componentRef = createComponent(TelemetryTableComponent, {
        environmentInjector: this.environmentInjector,
        elementInjector: this.injector,
      });
      this.appRef.attachView(componentRef.hostView);
      container.appendChild(componentRef.location.nativeElement);
      this.componentRefs.set(tile.id, componentRef);
    } else if (tile.type === 'chart') {
      const componentRef = createComponent(TelemetryChartComponent, {
        environmentInjector: this.environmentInjector,
        elementInjector: this.injector,
      });
      if (tile.defaultTelemetry) {
        componentRef.instance.defaultTelemetry = tile.defaultTelemetry;
      }
      this.appRef.attachView(componentRef.hostView);
      container.appendChild(componentRef.location.nativeElement);
      this.componentRefs.set(tile.id, componentRef);
    }
  }

  private destroyComponent(id: string): void {
    const componentRef = this.componentRefs.get(id);
    if (componentRef) {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      this.componentRefs.delete(id);
    }
  }

  addTile(type: 'chart' | 'table', defaultTelemetry?: string): void {
    const id = `tile-${this.tileCounter++}`;
    const tile: DashboardTile = {
      id,
      type,
      x: 0,
      y: 0,
      w: type === 'table' ? 4 : 4,
      h: type === 'table' ? 5 : 3,
      defaultTelemetry,
    };

    this.createTile(tile);
    this.updateRemoveButtonVisibility();
  }

  removeTile(id: string): void {
    if (!this.grid) return;

    const widgetEl = this.gridContainer.nativeElement.querySelector(
      `[gs-id="${id}"]`
    );

    if (widgetEl) {
      this.destroyComponent(id);
      this.grid.removeWidget(widgetEl, true);
    }
  }

  resetLayout(): void {
    if (!this.grid) return;

    this.componentRefs.forEach((ref) => ref.destroy());
    this.componentRefs.clear();

    this.grid.removeAll(true);
    this.tileCounter = 0;
    this.loadDefaultLayout();
    this.updateRemoveButtonVisibility();
  }

  onEditModeChange(): void {
    this.setEditMode(this.editMode);
  }

  private setEditMode(enabled: boolean): void {
    if (!this.grid) return;

    if (enabled) {
      this.grid.enableMove(true);
      this.grid.enableResize(true);
      this.gridContainer.nativeElement.classList.add('editing');
    } else {
      this.grid.enableMove(false);
      this.grid.enableResize(false);
      this.gridContainer.nativeElement.classList.remove('editing');
    }

    this.updateRemoveButtonVisibility();
  }

  private updateRemoveButtonVisibility(): void {
    const removeButtons = this.gridContainer.nativeElement.querySelectorAll('.remove-btn');
    removeButtons.forEach((btn: HTMLElement) => {
      btn.style.display = this.editMode ? 'block' : 'none';
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.componentRefs.forEach((ref) => {
      this.appRef.detachView(ref.hostView);
      ref.destroy();
    });
    this.componentRefs.clear();

    this.grid?.destroy();
  }
}
