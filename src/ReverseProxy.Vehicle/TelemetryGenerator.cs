using ReverseProxy.Shared.Messages;

namespace ReverseProxy.Vehicle;

public class TelemetryGenerator
{
    private readonly Random _random = new();
    private readonly Dictionary<string, double> _baseValues = new();
    private readonly Dictionary<string, double> _currentValues = new();
    private double _time;

    public TelemetryGenerator()
    {
        InitializeBaseValues();
    }

    private void InitializeBaseValues()
    {
        foreach (var def in TelemetryDefinitions.AllTelemetry)
        {
            var midpoint = (def.MinValue + def.MaxValue) / 2;
            _baseValues[def.Name] = midpoint;
            _currentValues[def.Name] = midpoint;
        }
    }

    public List<TelemetryMessage> GenerateTelemetry(double deltaTime)
    {
        _time += deltaTime;
        var telemetry = new List<TelemetryMessage>();
        var now = DateTime.UtcNow;

        foreach (var def in TelemetryDefinitions.AllTelemetry)
        {
            var current = _currentValues[def.Name];
            var baseVal = _baseValues[def.Name];
            var range = def.MaxValue - def.MinValue;

            // Generate smooth variations using sine waves and random walks
            var sinComponent = Math.Sin(_time * _random.NextDouble() * 0.5) * range * 0.1;
            var noiseComponent = (_random.NextDouble() - 0.5) * range * 0.02;
            var meanReversion = (baseVal - current) * 0.01;

            var newValue = current + sinComponent * deltaTime + noiseComponent + meanReversion;
            newValue = Math.Clamp(newValue, def.MinValue, def.MaxValue);

            _currentValues[def.Name] = newValue;

            telemetry.Add(new TelemetryMessage
            {
                Name = def.Name,
                Value = newValue,
                Utc = now,
                Type = def.Unit == "" && def.MaxValue < 256 ? TelemetryType.Enum : TelemetryType.Numeric
            });
        }

        return telemetry;
    }

    public void SetBaseValue(string name, double value)
    {
        if (_baseValues.ContainsKey(name))
        {
            var def = TelemetryDefinitions.AllTelemetry.FirstOrDefault(d => d.Name == name);
            if (def != null)
            {
                _baseValues[name] = Math.Clamp(value, def.MinValue, def.MaxValue);
            }
        }
    }
}
