using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ReverseProxy.Shared.Messaging;
using ReverseProxy.Shared.Messages;

namespace ReverseProxy.Vehicle;

public class VehicleWorker : BackgroundService
{
    private readonly ILogger<VehicleWorker> _logger;
    private readonly VehicleState _state;
    private readonly TelemetryGenerator _generator;
    private readonly TelemetryPublisher _telemetryPublisher;
    private readonly CommandSubscription _commandSubscription;
    private readonly CommandResponsePublisher _responsePublisher;

    private const int TelemetryRateHz = 20;
    private const int TelemetryIntervalMs = 1000 / TelemetryRateHz;
    private readonly string _vehicleId;

    public VehicleWorker(ILogger<VehicleWorker> logger)
    {
        _logger = logger;
        _state = new VehicleState();
        _generator = new TelemetryGenerator();
        _telemetryPublisher = new TelemetryPublisher();
        _commandSubscription = new CommandSubscription();
        _responsePublisher = new CommandResponsePublisher();
        _vehicleId = $"Vehicle-{Guid.NewGuid().ToString()[..8]}";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Vehicle Worker starting. ID: {VehicleId}", _vehicleId);

        // Subscribe to commands
        _commandSubscription.MessageReceived += OnCommandReceived;
        await _commandSubscription.StartAsync(stoppingToken);

        // Auto-start the vehicle for seed data
        _state.ProcessCommand(CommandType.Start, null);

        var lastTime = DateTime.UtcNow;

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            var deltaTime = (now - lastTime).TotalSeconds;
            lastTime = now;

            // Update vehicle state
            _state.Update(deltaTime);

            // Generate telemetry
            var stateTelemetry = _state.GetTelemetry();
            var additionalTelemetry = _generator.GenerateTelemetry(deltaTime);

            // Combine and publish
            var batch = new TelemetryBatch
            {
                SourceId = _vehicleId,
                BatchTimestamp = now,
                Items = stateTelemetry.Concat(additionalTelemetry.Take(83)).ToList() // ~100 total telemetry points
            };

            try
            {
                await _telemetryPublisher.PublishAsync(batch, stoppingToken);
                _logger.LogDebug("Published {Count} telemetry items", batch.Items.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing telemetry");
            }

            await Task.Delay(TelemetryIntervalMs, stoppingToken);
        }
    }

    private async void OnCommandReceived(object? sender, CommandMessage command)
    {
        _logger.LogInformation("Received command: {Command}", command.Command);

        try
        {
            _state.ProcessCommand(command.Command, command.Parameters);

            var response = new CommandResponse
            {
                Success = true,
                Command = command.Command,
                Message = $"Command {command.Command} executed successfully"
            };

            await _responsePublisher.PublishAsync(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing command {Command}", command.Command);

            var response = new CommandResponse
            {
                Success = false,
                Command = command.Command,
                Message = $"Error: {ex.Message}"
            };

            await _responsePublisher.PublishAsync(response);
        }
    }

    public override void Dispose()
    {
        _commandSubscription.Dispose();
        _telemetryPublisher.Dispose();
        _responsePublisher.Dispose();
        base.Dispose();
    }
}
