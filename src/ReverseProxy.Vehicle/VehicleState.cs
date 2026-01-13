using ReverseProxy.Shared.Messages;

namespace ReverseProxy.Vehicle;

public class VehicleState
{
    private readonly object _lock = new();
    private readonly Random _random = new();

    public VehicleStatus Status { get; private set; } = VehicleStatus.Off;
    public double Speed { get; private set; }
    public double TargetSpeed { get; private set; }
    public double PositionX { get; private set; }
    public double PositionY { get; private set; }
    public double PositionZ { get; private set; }
    public double Heading { get; private set; }
    public double Temperature { get; private set; } = 25;
    public double Voltage { get; private set; } = 48;
    public double Current { get; private set; }
    public double JointPressure { get; private set; } = 100;
    public double BatteryLevel { get; private set; } = 100;
    public double RPM { get; private set; }
    public double Torque { get; private set; }
    public double Power { get; private set; }
    public double ErrorCount { get; private set; }
    public double WarningCount { get; private set; }
    public double Uptime { get; private set; }

    private DateTime _startTime = DateTime.UtcNow;

    public void ProcessCommand(CommandType command, Dictionary<string, object>? parameters)
    {
        lock (_lock)
        {
            switch (command)
            {
                case CommandType.Start:
                    if (Status == VehicleStatus.Off || Status == VehicleStatus.Idle)
                    {
                        Status = VehicleStatus.Starting;
                    }
                    break;

                case CommandType.Stop:
                    if (Status == VehicleStatus.Running || Status == VehicleStatus.Idle)
                    {
                        Status = VehicleStatus.Stopping;
                        TargetSpeed = 0;
                    }
                    break;

                case CommandType.EmergencyStop:
                    Status = VehicleStatus.Stopping;
                    Speed = 0;
                    TargetSpeed = 0;
                    RPM = 0;
                    break;

                case CommandType.GoUp:
                    if (Status == VehicleStatus.Running)
                    {
                        PositionZ += 1;
                    }
                    break;

                case CommandType.GoDown:
                    if (Status == VehicleStatus.Running)
                    {
                        PositionZ -= 1;
                    }
                    break;

                case CommandType.GoLeft:
                    if (Status == VehicleStatus.Running)
                    {
                        Heading -= 15;
                        if (Heading < 0) Heading += 360;
                    }
                    break;

                case CommandType.GoRight:
                    if (Status == VehicleStatus.Running)
                    {
                        Heading += 15;
                        if (Heading >= 360) Heading -= 360;
                    }
                    break;

                case CommandType.GoForward:
                    if (Status == VehicleStatus.Running)
                    {
                        var radians = Heading * Math.PI / 180;
                        PositionX += Math.Cos(radians) * Speed * 0.05;
                        PositionY += Math.Sin(radians) * Speed * 0.05;
                    }
                    break;

                case CommandType.GoBackward:
                    if (Status == VehicleStatus.Running)
                    {
                        var radians = Heading * Math.PI / 180;
                        PositionX -= Math.Cos(radians) * Speed * 0.05;
                        PositionY -= Math.Sin(radians) * Speed * 0.05;
                    }
                    break;

                case CommandType.Accelerate:
                    if (Status == VehicleStatus.Running)
                    {
                        TargetSpeed = Math.Min(TargetSpeed + 5, 100);
                    }
                    break;

                case CommandType.Decelerate:
                    if (Status == VehicleStatus.Running)
                    {
                        TargetSpeed = Math.Max(TargetSpeed - 5, 0);
                    }
                    break;

                case CommandType.SetSpeed:
                    if (Status == VehicleStatus.Running && parameters?.ContainsKey("speed") == true)
                    {
                        TargetSpeed = Convert.ToDouble(parameters["speed"]);
                    }
                    break;

                case CommandType.RotateClockwise:
                    if (Status == VehicleStatus.Running)
                    {
                        Heading += 5;
                        if (Heading >= 360) Heading -= 360;
                    }
                    break;

                case CommandType.RotateCounterClockwise:
                    if (Status == VehicleStatus.Running)
                    {
                        Heading -= 5;
                        if (Heading < 0) Heading += 360;
                    }
                    break;

                case CommandType.Reset:
                    Speed = 0;
                    TargetSpeed = 0;
                    PositionX = 0;
                    PositionY = 0;
                    PositionZ = 0;
                    Heading = 0;
                    ErrorCount = 0;
                    WarningCount = 0;
                    Status = VehicleStatus.Off;
                    _startTime = DateTime.UtcNow;
                    break;

                case CommandType.Pause:
                    if (Status == VehicleStatus.Running)
                    {
                        Status = VehicleStatus.Idle;
                    }
                    break;

                case CommandType.Resume:
                    if (Status == VehicleStatus.Idle)
                    {
                        Status = VehicleStatus.Running;
                    }
                    break;

                case CommandType.Calibrate:
                    JointPressure = 100;
                    Temperature = 25;
                    break;

                case CommandType.Diagnostic:
                    // Run diagnostics - could increment warning if issues found
                    break;

                case CommandType.SetPosition:
                    if (parameters != null)
                    {
                        if (parameters.ContainsKey("x")) PositionX = Convert.ToDouble(parameters["x"]);
                        if (parameters.ContainsKey("y")) PositionY = Convert.ToDouble(parameters["y"]);
                        if (parameters.ContainsKey("z")) PositionZ = Convert.ToDouble(parameters["z"]);
                    }
                    break;
            }
        }
    }

    public void Update(double deltaTime)
    {
        lock (_lock)
        {
            Uptime = (DateTime.UtcNow - _startTime).TotalSeconds;

            // State machine transitions
            switch (Status)
            {
                case VehicleStatus.Starting:
                    Temperature += _random.NextDouble() * 2;
                    if (Temperature > 30)
                    {
                        Status = VehicleStatus.Running;
                        TargetSpeed = 10;
                    }
                    break;

                case VehicleStatus.Stopping:
                    Speed = Math.Max(Speed - 5 * deltaTime, 0);
                    RPM = Math.Max(RPM - 500 * deltaTime, 0);
                    if (Speed <= 0 && RPM <= 0)
                    {
                        Status = VehicleStatus.Off;
                        Temperature = Math.Max(Temperature - 0.5 * deltaTime, 25);
                    }
                    break;

                case VehicleStatus.Running:
                    // Smoothly approach target speed
                    var speedDiff = TargetSpeed - Speed;
                    Speed += speedDiff * 0.1 * deltaTime;

                    // Update derived values
                    RPM = Speed * 100 + _random.NextDouble() * 50;
                    Current = Speed * 2 + _random.NextDouble() * 5;
                    Power = Voltage * Current;
                    Torque = Power / (RPM == 0 ? 1 : RPM) * 9549;

                    // Temperature based on load
                    Temperature = 25 + Speed * 0.5 + _random.NextDouble() * 2;

                    // Battery discharge
                    BatteryLevel = Math.Max(BatteryLevel - Power * 0.00001 * deltaTime, 0);

                    // Voltage drop based on current
                    Voltage = 48 - Current * 0.05;

                    // Joint pressure varies with speed
                    JointPressure = 100 + Speed * 3 + _random.NextDouble() * 10;

                    // Movement
                    var radians = Heading * Math.PI / 180;
                    PositionX += Math.Cos(radians) * Speed * deltaTime * 0.01;
                    PositionY += Math.Sin(radians) * Speed * deltaTime * 0.01;
                    break;

                case VehicleStatus.Idle:
                    RPM = 500 + _random.NextDouble() * 50;
                    Current = 5 + _random.NextDouble() * 2;
                    Power = Voltage * Current;
                    break;

                case VehicleStatus.Off:
                    Temperature = Math.Max(Temperature - 0.1 * deltaTime, 25);
                    break;
            }

            // Random warnings/errors
            if (_random.NextDouble() < 0.001)
            {
                WarningCount++;
            }
            if (_random.NextDouble() < 0.0001)
            {
                ErrorCount++;
            }
        }
    }

    public List<TelemetryMessage> GetTelemetry()
    {
        lock (_lock)
        {
            var now = DateTime.UtcNow;
            return new List<TelemetryMessage>
            {
                new() { Name = "Status", Value = (double)Status, Utc = now, Type = TelemetryType.Enum },
                new() { Name = "Speed", Value = Speed, Utc = now },
                new() { Name = "Position_X", Value = PositionX, Utc = now },
                new() { Name = "Position_Y", Value = PositionY, Utc = now },
                new() { Name = "Position_Z", Value = PositionZ, Utc = now },
                new() { Name = "Heading", Value = Heading, Utc = now },
                new() { Name = "Temperature", Value = Temperature, Utc = now },
                new() { Name = "Voltage", Value = Voltage, Utc = now },
                new() { Name = "Current", Value = Current, Utc = now },
                new() { Name = "JointPressure", Value = JointPressure, Utc = now },
                new() { Name = "BatteryLevel", Value = BatteryLevel, Utc = now },
                new() { Name = "RPM", Value = RPM, Utc = now },
                new() { Name = "Torque", Value = Torque, Utc = now },
                new() { Name = "Power", Value = Power, Utc = now },
                new() { Name = "ErrorCount", Value = ErrorCount, Utc = now },
                new() { Name = "WarningCount", Value = WarningCount, Utc = now },
                new() { Name = "Uptime", Value = Uptime, Utc = now },
            };
        }
    }
}
