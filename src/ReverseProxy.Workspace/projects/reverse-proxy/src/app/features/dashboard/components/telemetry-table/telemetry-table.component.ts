import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  Input,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TelemetryService } from '../../../../core/services/telemetry.service';
import { TelemetryMessage } from '../../../../core/models/telemetry.model';

interface TelemetryRow {
  name: string;
  value: number;
  formattedValue: string;
  timestamp: Date;
}

@Component({
    selector: 'app-telemetry-table',
    imports: [
        CommonModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatInputModule,
        MatFormFieldModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        FormsModule,
    ],
    template: `
    <mat-card class="telemetry-table-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>table_chart</mat-icon>
          Telemetry Data
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Filter</mat-label>
          <input
            matInput
            (keyup)="applyFilter($event)"
            placeholder="Search telemetry..."
          />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <div class="table-container">
          <table
            mat-table
            [dataSource]="dataSource"
            matSort
            class="telemetry-table"
          >
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let row">{{ row.name }}</td>
            </ng-container>

            <ng-container matColumnDef="value">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Value</th>
              <td mat-cell *matCellDef="let row" class="value-cell">
                {{ row.formattedValue }}
              </td>
            </ng-container>

            <ng-container matColumnDef="timestamp">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                Timestamp
              </th>
              <td mat-cell *matCellDef="let row">
                {{ row.timestamp | date: 'HH:mm:ss.SSS' }}
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </div>

        <mat-paginator
          [pageSizeOptions]="[10, 25, 50, 100]"
          [pageSize]="25"
          showFirstLastButtons
        ></mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
    styles: [
        `
      .telemetry-table-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--mat-card-background, #1e1e1e);
      }

      mat-card-header {
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 16px;
      }

      mat-card-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 16px;
        overflow: hidden;
      }

      .filter-field {
        width: 100%;
        margin-bottom: 8px;
      }

      .table-container {
        flex: 1;
        overflow: auto;
      }

      .telemetry-table {
        width: 100%;
      }

      .value-cell {
        font-family: 'Roboto Mono', monospace;
        color: #4caf50;
      }

      mat-paginator {
        background: transparent;
      }
    `,
    ]
})
export class TelemetryTableComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns = ['name', 'value', 'timestamp'];
  dataSource = new MatTableDataSource<TelemetryRow>([]);

  private destroy$ = new Subject<void>();

  constructor(private telemetryService: TelemetryService) {}

  ngOnInit(): void {
    this.telemetryService.telemetry$
      .pipe(takeUntil(this.destroy$))
      .subscribe((batch) => {
        this.updateTable();
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  private updateTable(): void {
    const currentValues = this.telemetryService.getAllCurrentValues();
    const rows: TelemetryRow[] = [];

    currentValues.forEach((msg, name) => {
      rows.push({
        name,
        value: msg.value,
        formattedValue: this.formatValue(msg.value),
        timestamp: new Date(msg.utc),
      });
    });

    this.dataSource.data = rows;
  }

  private formatValue(value: number): string {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(2);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
