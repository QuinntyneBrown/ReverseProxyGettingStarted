import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommandType, CommandResponse } from '../models/telemetry.model';

@Injectable({
  providedIn: 'root',
})
export class CommandService {
  private readonly apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  sendCommand(
    command: CommandType,
    parameters?: Record<string, unknown>
  ): Observable<CommandResponse> {
    return this.http.post<CommandResponse>(`${this.apiUrl}/command`, {
      command,
      parameters,
    });
  }

  getCommandTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/command/types`);
  }

  start(): Observable<CommandResponse> {
    return this.sendCommand(CommandType.Start);
  }

  stop(): Observable<CommandResponse> {
    return this.sendCommand(CommandType.Stop);
  }

  emergencyStop(): Observable<CommandResponse> {
    return this.sendCommand(CommandType.EmergencyStop);
  }

  accelerate(): Observable<CommandResponse> {
    return this.sendCommand(CommandType.Accelerate);
  }

  decelerate(): Observable<CommandResponse> {
    return this.sendCommand(CommandType.Decelerate);
  }

  setSpeed(speed: number): Observable<CommandResponse> {
    return this.sendCommand(CommandType.SetSpeed, { speed });
  }
}
