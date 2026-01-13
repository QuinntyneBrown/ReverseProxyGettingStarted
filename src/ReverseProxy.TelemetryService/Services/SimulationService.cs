using Microsoft.AspNetCore.SignalR;
using ReverseProxy.Shared.Messages;
using ReverseProxy.TelemetryService.Hubs;

namespace ReverseProxy.TelemetryService.Services;

public class SimulationService : BackgroundService
{
    private readonly ILogger<SimulationService> _logger;
    private readonly IHubContext<TelemetryHub, ITelemetryClient> _hubContext;
    private readonly TelemetryCacheService _cacheService;
    private readonly Random _random = new();
    private readonly Dictionary<string, double> _baseValues = new();
    private readonly Dictionary<string, double> _currentValues = new();
    private double _time;

    public SimulationService(
        ILogger<SimulationService> logger,
        IHubContext<TelemetryHub, ITelemetryClient> hubContext,
        TelemetryCacheService cacheService)
    {
        _logger = logger;
        _hubContext = hubContext;
        _cacheService = cacheService;
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

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Simulation Service starting - generating seed telemetry data");

        var publishRateHz = 2;
        var interval = TimeSpan.FromMilliseconds(1000.0 / publishRateHz);

        while (!stoppingToken.IsCancellationRequested)
        {
            _time += interval.TotalSeconds;
            var telemetry = GenerateTelemetry(interval.TotalSeconds);
            var batch = new TelemetryBatch
            {
                SourceId = "Simulation",
                BatchTimestamp = DateTime.UtcNow,
                Items = telemetry
            };

            _cacheService.UpdateTelemetryBatch(batch);

            try
            {
                await _hubContext.Clients.Group("telemetry:all").ReceiveTelemetry(batch);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending simulated telemetry");
            }

            await Task.Delay(interval, stoppingToken);
        }
    }

    private List<TelemetryMessage> GenerateTelemetry(double deltaTime)
    {
        var telemetry = new List<TelemetryMessage>();
        var now = DateTime.UtcNow;

        foreach (var def in TelemetryDefinitions.AllTelemetry)
        {
            var current = _currentValues[def.Name];
            var baseVal = _baseValues[def.Name];
            var range = def.MaxValue - def.MinValue;

            // Generate smooth variations
            var frequency = 0.1 + _random.NextDouble() * 0.3;
            var sinComponent = Math.Sin(_time * frequency) * range * 0.15;
            var noiseComponent = (_random.NextDouble() - 0.5) * range * 0.03;
            var meanReversion = (baseVal - current) * 0.02;

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
}
