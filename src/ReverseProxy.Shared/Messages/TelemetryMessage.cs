using MessagePack;

namespace ReverseProxy.Shared.Messages;

[MessagePackObject]
public class TelemetryMessage
{
    [Key(0)]
    public string Name { get; set; } = string.Empty;

    [Key(1)]
    public double Value { get; set; }

    [Key(2)]
    public DateTime Utc { get; set; } = DateTime.UtcNow;

    [Key(3)]
    public TelemetryType Type { get; set; } = TelemetryType.Numeric;
}

public enum TelemetryType
{
    Numeric,
    Enum,
    Boolean
}

[MessagePackObject]
public class TelemetryBatch
{
    [Key(0)]
    public List<TelemetryMessage> Items { get; set; } = new();

    [Key(1)]
    public DateTime BatchTimestamp { get; set; } = DateTime.UtcNow;

    [Key(2)]
    public string SourceId { get; set; } = string.Empty;
}

// Specific telemetry types
[MessagePackObject]
public class JointPressureTelemetry : TelemetryMessage
{
    public JointPressureTelemetry()
    {
        Name = "JointPressure";
        Type = TelemetryType.Numeric;
    }
}

[MessagePackObject]
public class StatusTelemetry : TelemetryMessage
{
    public StatusTelemetry()
    {
        Name = "Status";
        Type = TelemetryType.Enum;
    }
}

[MessagePackObject]
public class SpeedTelemetry : TelemetryMessage
{
    public SpeedTelemetry()
    {
        Name = "Speed";
        Type = TelemetryType.Numeric;
    }
}

[MessagePackObject]
public class TemperatureTelemetry : TelemetryMessage
{
    public TemperatureTelemetry()
    {
        Name = "Temperature";
        Type = TelemetryType.Numeric;
    }
}

[MessagePackObject]
public class VolteTelemetry : TelemetryMessage
{
    public VolteTelemetry()
    {
        Name = "Voltage";
        Type = TelemetryType.Numeric;
    }
}

[MessagePackObject]
public class CurrentTelemetry : TelemetryMessage
{
    public CurrentTelemetry()
    {
        Name = "Current";
        Type = TelemetryType.Numeric;
    }
}

[MessagePackObject]
public class PositionTelemetry : TelemetryMessage
{
    public PositionTelemetry()
    {
        Name = "Position";
        Type = TelemetryType.Numeric;
    }
}

[MessagePackObject]
public class AccelerationTelemetry : TelemetryMessage
{
    public AccelerationTelemetry()
    {
        Name = "Acceleration";
        Type = TelemetryType.Numeric;
    }
}

[MessagePackObject]
public class TorqueTelemetry : TelemetryMessage
{
    public TorqueTelemetry()
    {
        Name = "Torque";
        Type = TelemetryType.Numeric;
    }
}

[MessagePackObject]
public class PowerTelemetry : TelemetryMessage
{
    public PowerTelemetry()
    {
        Name = "Power";
        Type = TelemetryType.Numeric;
    }
}

public enum VehicleStatus
{
    Off = 0,
    On = 1,
    Starting = 2,
    Stopping = 3,
    Running = 4,
    Error = 5,
    Maintenance = 6,
    Idle = 7
}
