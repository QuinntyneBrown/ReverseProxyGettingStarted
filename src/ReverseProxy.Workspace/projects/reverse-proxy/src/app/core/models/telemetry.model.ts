export interface TelemetryMessage {
  name: string;
  value: number;
  utc: string;
  type: TelemetryType;
}

export enum TelemetryType {
  Numeric = 0,
  Enum = 1,
  Boolean = 2
}

export interface TelemetryBatch {
  items: TelemetryMessage[];
  batchTimestamp: string;
  sourceId: string;
}

export interface TelemetryDefinition {
  name: string;
  displayName: string;
  unit: string;
  minValue: number;
  maxValue: number;
}

export interface CommandMessage {
  command: CommandType;
  utc: string;
  sourceId: string;
  parameters?: Record<string, unknown>;
}

export enum CommandType {
  Start = 0,
  Stop = 1,
  GoUp = 2,
  GoDown = 3,
  GoLeft = 4,
  GoRight = 5,
  GoForward = 6,
  GoBackward = 7,
  RotateClockwise = 8,
  RotateCounterClockwise = 9,
  Accelerate = 10,
  Decelerate = 11,
  EmergencyStop = 12,
  Reset = 13,
  Calibrate = 14,
  SetSpeed = 15,
  SetPosition = 16,
  Pause = 17,
  Resume = 18,
  Diagnostic = 19
}

export interface CommandResponse {
  success: boolean;
  message: string;
  command: CommandType;
  utc: string;
}

export interface TelemetryDataPoint {
  timestamp: Date;
  value: number;
}

export interface TelemetryHistory {
  name: string;
  data: TelemetryDataPoint[];
}
