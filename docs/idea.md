Create 
- designs (folder)
    - html mockups of idea
    - png screen shot images of mock ups
- Api .NET Web (src\ReverseProxy.Api)
- ApiGateway .NET Web (src\ReverseProxy.ApiGateway)
- Angular Workspace (v21) (src\ReverseProxy.Workspace)
- Angular Application (src\ReverseProxy.Workspace\projects\reverse-proxy)
    - Angular Material for all html components
    - Dark Theme
    - Only Angular Theme colors are used
    - SignalR
    - charts Telemtry in a table tile - Angular Material
        - subscribes to telemetry
        - resizable
        - moveable
    - graphs telemetry in charts (charts.js - smooth interpoilated)    
        - subscribes to telemetry
        - resizable
        - movable
    - Dashboard (gridstack.js)
        grid 10 x 30  
    - playwright tests for all behaviour (Http and Web Socket interface mocked out / faked for tests for tests)       
- Worker .NET Library (src\ReverseProxy.Vehicle)
    - Subscribes to Commands (start, stop, go up, and 10 more commands)
    - Publishes Telemetry 20hz (JointPressure, On, Off, status, speed, 100 more telemtry) 
- Cache \ Throttle .NET Web (src\ReverseProxy.TelemetryService)
    - subscribes to all telemetry
    - publishes telemetry via SignalR (TelemetryHub) to subscribe web clients at 2 Hz (configurable)
- Shared Class Library (src\ReverseProxy.Shared)    
    - src\ReverseProxy.Shared\Messaging
        - Udp Transport for Pub Sub
        - Message Pack Serialization
        - Subscribtion classes and utilities
    - src\ReverseProxy.Shared\Messages
        - All Message classes (Message Pack)

Details
    - Telemetry structure
        - Name
        - Value (number or enum)
        - Utc
    - Seed data so that solution is turn key. On start up, charts have data updating, graphs have data flowing
    - Readme explaining project in root
              

