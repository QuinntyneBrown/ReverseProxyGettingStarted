using Microsoft.AspNetCore.SignalR;
using ReverseProxy.Shared.Messages;

namespace ReverseProxy.TelemetryService.Hubs;

public interface ITelemetryClient
{
    Task ReceiveTelemetry(TelemetryBatch batch);
    Task ReceiveTelemetryItem(TelemetryMessage item);
    Task ReceiveCommand(CommandMessage command);
    Task ReceiveCommandResponse(CommandResponse response);
}

public class TelemetryHub : Hub<ITelemetryClient>
{
    private readonly ILogger<TelemetryHub> _logger;

    public TelemetryHub(ILogger<TelemetryHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SubscribeToTelemetry(string[] telemetryNames)
    {
        foreach (var name in telemetryNames)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"telemetry:{name}");
        }
        _logger.LogInformation("Client {ConnectionId} subscribed to {Count} telemetry items",
            Context.ConnectionId, telemetryNames.Length);
    }

    public async Task UnsubscribeFromTelemetry(string[] telemetryNames)
    {
        foreach (var name in telemetryNames)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"telemetry:{name}");
        }
    }

    public async Task SubscribeToAllTelemetry()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "telemetry:all");
        _logger.LogInformation("Client {ConnectionId} subscribed to all telemetry", Context.ConnectionId);
    }

    public async Task UnsubscribeFromAllTelemetry()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "telemetry:all");
    }

    public async Task SendCommand(CommandMessage command)
    {
        _logger.LogInformation("Received command from client: {Command}", command.Command);
        await Clients.All.ReceiveCommand(command);
    }
}
