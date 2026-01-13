# Reverse Proxy Telemetry Dashboard

A real-time telemetry monitoring dashboard built with .NET 8, Angular 18, and SignalR. This solution demonstrates a complete vehicle telemetry system with live data streaming, command execution, and interactive visualizations.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Angular App   │────▶│   API Gateway    │────▶│      API        │
│   (Dashboard)   │     │   (YARP Proxy)   │     │   (Commands)    │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         │ SignalR
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Telemetry     │◀────│   UDP Multicast  │◀────│    Vehicle      │
│    Service      │     │   (Pub/Sub)      │     │    Worker       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Projects

### Backend (.NET 8)

| Project | Description | Port |
|---------|-------------|------|
| `ReverseProxy.Shared` | Shared library with MessagePack messages, UDP transport, and pub/sub utilities | - |
| `ReverseProxy.Vehicle` | Worker service that publishes telemetry at 20Hz and subscribes to 20 command types | - |
| `ReverseProxy.TelemetryService` | SignalR hub that throttles telemetry to 2Hz (configurable) and caches history | 5100 |
| `ReverseProxy.Api` | REST API for sending commands and querying telemetry definitions | 5200 |
| `ReverseProxy.ApiGateway` | YARP reverse proxy routing requests to backend services | 5000 |

### Frontend (Angular 18)

| Component | Description |
|-----------|-------------|
| `DashboardComponent` | Main dashboard with responsive grid layout |
| `TelemetryTableComponent` | Sortable, filterable table with pagination |
| `TelemetryChartComponent` | Chart.js line charts with smooth interpolation |
| `DashboardGridComponent` | GridStack.js integration for resizable/moveable widgets |

## Features

- **Real-time Telemetry**: 100+ telemetry points streamed at 20Hz, throttled to 2Hz for web clients
- **Dark Theme**: Angular Material with custom dark theme using only theme colors
- **Interactive Dashboard**:
  - Resizable and moveable widgets (GridStack.js)
  - Sortable and filterable data table
  - Smooth interpolated charts (Chart.js)
- **SignalR Integration**: Bi-directional communication with automatic reconnection
- **MessagePack Serialization**: Efficient binary serialization for telemetry data
- **UDP Multicast**: High-performance pub/sub messaging between services
- **Seed Data**: Solution is turnkey - starts with live data flowing immediately

## Telemetry Structure

Each telemetry message contains:
- `Name` - Identifier (e.g., "Speed", "Temperature")
- `Value` - Numeric or enum value
- `Utc` - UTC timestamp
- `Type` - Numeric, Enum, or Boolean

### Example Telemetry Points

| Name | Description | Unit | Range |
|------|-------------|------|-------|
| Speed | Current speed | m/s | 0-100 |
| Temperature | Motor temperature | °C | -40 to 150 |
| Voltage | Battery voltage | V | 0-48 |
| JointPressure | Joint pressure | PSI | 0-1000 |
| Power | Power consumption | W | 0-5000 |
| RPM | Motor RPM | rpm | 0-10000 |
| BatteryLevel | Battery level | % | 0-100 |
| Position_X/Y/Z | 3D position | m | -1000 to 1000 |
| ... | 90+ more | ... | ... |

## Commands

The vehicle worker supports 20 commands:

| Command | Description |
|---------|-------------|
| Start | Start the vehicle |
| Stop | Stop the vehicle |
| EmergencyStop | Immediate stop |
| GoUp/Down/Left/Right | Directional movement |
| GoForward/Backward | Forward/backward movement |
| Accelerate/Decelerate | Speed control |
| RotateClockwise/CounterClockwise | Rotation |
| SetSpeed | Set target speed |
| SetPosition | Set target position |
| Pause/Resume | Pause/resume operation |
| Reset | Reset to initial state |
| Calibrate | Calibrate sensors |
| Diagnostic | Run diagnostics |

## Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js 18+ and npm
- Angular CLI 18

### Running the Solution

1. **Start the backend services** (in separate terminals):

```bash
# Terminal 1 - Vehicle Worker
cd src/ReverseProxy.Vehicle
dotnet run

# Terminal 2 - Telemetry Service
cd src/ReverseProxy.TelemetryService
dotnet run

# Terminal 3 - API
cd src/ReverseProxy.Api
dotnet run

# Terminal 4 - API Gateway
cd src/ReverseProxy.ApiGateway
dotnet run
```

2. **Start the Angular application**:

```bash
cd src/ReverseProxy.Workspace
npm install
npm start
```

3. **Open the dashboard**: Navigate to http://localhost:4200

### Running Tests

```bash
cd src/ReverseProxy.Workspace
npx playwright test
```

## Project Structure

```
├── designs/                          # HTML mockups and screenshots
│   ├── dashboard-mockup.html
│   └── gridstack-mockup.html
├── docs/
│   └── idea.md                       # Original requirements
├── src/
│   ├── ReverseProxy.Api/             # REST API
│   │   ├── Controllers/
│   │   │   ├── CommandController.cs
│   │   │   └── TelemetryController.cs
│   │   └── Program.cs
│   ├── ReverseProxy.ApiGateway/      # YARP Reverse Proxy
│   │   └── Program.cs
│   ├── ReverseProxy.Shared/          # Shared Library
│   │   ├── Messages/
│   │   │   ├── CommandMessage.cs
│   │   │   ├── TelemetryDefinitions.cs
│   │   │   └── TelemetryMessage.cs
│   │   └── Messaging/
│   │       ├── Publisher.cs
│   │       ├── Subscription.cs
│   │       ├── UdpTransport.cs
│   │       └── MessageSerializer.cs
│   ├── ReverseProxy.TelemetryService/ # SignalR Service
│   │   ├── Hubs/
│   │   │   └── TelemetryHub.cs
│   │   └── Services/
│   │       ├── SimulationService.cs
│   │       ├── TelemetryCacheService.cs
│   │       └── TelemetryThrottleService.cs
│   ├── ReverseProxy.Vehicle/         # Vehicle Worker
│   │   ├── Program.cs
│   │   ├── VehicleState.cs
│   │   ├── VehicleWorker.cs
│   │   └── TelemetryGenerator.cs
│   └── ReverseProxy.Workspace/       # Angular Workspace
│       ├── projects/reverse-proxy/
│       │   └── src/app/
│       │       ├── core/
│       │       │   ├── models/
│       │       │   └── services/
│       │       └── features/dashboard/
│       │           └── components/
│       ├── tests/                    # Playwright Tests
│       └── playwright.config.ts
└── ReverseProxy.sln
```

## Configuration

### Telemetry Service (`appsettings.json`)

```json
{
  "Telemetry": {
    "PublishRateHz": 2,        // SignalR publish rate
    "MaxHistoryItems": 1000    // Cache history size
  }
}
```

### API Gateway (`appsettings.json`)

```json
{
  "ReverseProxy": {
    "Routes": {
      "api-route": { "Path": "/api/{**catch-all}" },
      "telemetry-route": { "Path": "/hubs/{**catch-all}" }
    }
  }
}
```

## Technologies

- **.NET 8** - Backend services
- **Angular 18** - Frontend framework
- **Angular Material** - UI components
- **SignalR** - Real-time communication
- **YARP** - Reverse proxy
- **MessagePack** - Binary serialization
- **Chart.js** - Data visualization
- **GridStack.js** - Dashboard grid layout
- **Playwright** - End-to-end testing

## License

MIT
