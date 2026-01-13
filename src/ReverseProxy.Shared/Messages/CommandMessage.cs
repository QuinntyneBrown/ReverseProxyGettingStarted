using MessagePack;

namespace ReverseProxy.Shared.Messages;

[MessagePackObject]
public class CommandMessage
{
    [Key(0)]
    public CommandType Command { get; set; }

    [Key(1)]
    public DateTime Utc { get; set; } = DateTime.UtcNow;

    [Key(2)]
    public string SourceId { get; set; } = string.Empty;

    [Key(3)]
    public Dictionary<string, object>? Parameters { get; set; }
}

public enum CommandType
{
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

[MessagePackObject]
public class CommandResponse
{
    [Key(0)]
    public bool Success { get; set; }

    [Key(1)]
    public string Message { get; set; } = string.Empty;

    [Key(2)]
    public CommandType Command { get; set; }

    [Key(3)]
    public DateTime Utc { get; set; } = DateTime.UtcNow;
}
