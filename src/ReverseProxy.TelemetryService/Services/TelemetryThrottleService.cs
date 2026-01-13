using Microsoft.AspNetCore.SignalR;
using ReverseProxy.Shared.Messaging;
using ReverseProxy.Shared.Messages;
using ReverseProxy.TelemetryService.Hubs;

namespace ReverseProxy.TelemetryService.Services;

public class TelemetryThrottleService : BackgroundService
{
    private readonly ILogger<TelemetryThrottleService> _logger;
    private readonly IHubContext<TelemetryHub, ITelemetryClient> _hubContext;
    private readonly TelemetrySubscription _subscription;
    private readonly IConfiguration _configuration;

    private readonly Dictionary<string, TelemetryMessage> _latestTelemetry = new();
    private readonly object _telemetryLock = new();
    private int _publishRateHz;

    public TelemetryThrottleService(
        ILogger<TelemetryThrottleService> logger,
        IHubContext<TelemetryHub, ITelemetryClient> hubContext,
        IConfiguration configuration)
    {
        _logger = logger;
        _hubContext = hubContext;
        _configuration = configuration;
        _subscription = new TelemetrySubscription();
        _publishRateHz = configuration.GetValue<int>("Telemetry:PublishRateHz", 2);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Telemetry Throttle Service starting at {Rate}Hz", _publishRateHz);

        // Subscribe to incoming telemetry
        _subscription.MessageReceived += OnTelemetryReceived;
        await _subscription.StartAsync(stoppingToken);

        // Start publishing at throttled rate
        var publishInterval = TimeSpan.FromMilliseconds(1000.0 / _publishRateHz);

        while (!stoppingToken.IsCancellationRequested)
        {
            await PublishThrottledTelemetry();
            await Task.Delay(publishInterval, stoppingToken);
        }
    }

    private void OnTelemetryReceived(object? sender, TelemetryBatch batch)
    {
        lock (_telemetryLock)
        {
            foreach (var item in batch.Items)
            {
                _latestTelemetry[item.Name] = item;
            }
        }
    }

    private async Task PublishThrottledTelemetry()
    {
        List<TelemetryMessage> items;
        lock (_telemetryLock)
        {
            items = _latestTelemetry.Values.ToList();
        }

        if (items.Count == 0) return;

        var batch = new TelemetryBatch
        {
            Items = items,
            BatchTimestamp = DateTime.UtcNow,
            SourceId = "TelemetryService"
        };

        try
        {
            // Send to all subscribers
            await _hubContext.Clients.Group("telemetry:all").ReceiveTelemetry(batch);

            // Send individual items to specific subscribers
            foreach (var item in items)
            {
                await _hubContext.Clients.Group($"telemetry:{item.Name}").ReceiveTelemetryItem(item);
            }

            _logger.LogDebug("Published {Count} telemetry items to SignalR clients", items.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing telemetry to SignalR");
        }
    }

    public void SetPublishRate(int hz)
    {
        _publishRateHz = Math.Clamp(hz, 1, 60);
        _logger.LogInformation("Publish rate changed to {Rate}Hz", _publishRateHz);
    }

    public override void Dispose()
    {
        _subscription.Dispose();
        base.Dispose();
    }
}
