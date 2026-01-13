using ReverseProxy.Shared.Messages;

namespace ReverseProxy.Shared.Messaging;

public interface ISubscription<T> : IDisposable
{
    event EventHandler<T>? MessageReceived;
    Task StartAsync(CancellationToken cancellationToken = default);
    Task StopAsync();
}

public class TelemetrySubscription : ISubscription<TelemetryBatch>
{
    private readonly UdpTransport _transport;
    private CancellationTokenSource? _cts;
    private Task? _receiveTask;

    public event EventHandler<TelemetryBatch>? MessageReceived;

    public TelemetrySubscription(int port = 5001, string multicastGroup = "239.255.255.251")
    {
        _transport = new UdpTransport(port, multicastGroup);
    }

    public async Task StartAsync(CancellationToken cancellationToken = default)
    {
        _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        _transport.JoinMulticastGroup();

        _receiveTask = Task.Run(async () =>
        {
            await foreach (var batch in _transport.SubscribeAsync<TelemetryBatch>(_cts.Token))
            {
                MessageReceived?.Invoke(this, batch);
            }
        }, _cts.Token);

        await Task.CompletedTask;
    }

    public async Task StopAsync()
    {
        _cts?.Cancel();
        if (_receiveTask != null)
        {
            try
            {
                await _receiveTask;
            }
            catch (OperationCanceledException)
            {
                // Expected
            }
        }
    }

    public void Dispose()
    {
        _cts?.Cancel();
        _cts?.Dispose();
        _transport.Dispose();
    }
}

public class CommandSubscription : ISubscription<CommandMessage>
{
    private readonly UdpTransport _transport;
    private CancellationTokenSource? _cts;
    private Task? _receiveTask;

    public event EventHandler<CommandMessage>? MessageReceived;

    public CommandSubscription(int port = 5002, string multicastGroup = "239.255.255.252")
    {
        _transport = new UdpTransport(port, multicastGroup);
    }

    public async Task StartAsync(CancellationToken cancellationToken = default)
    {
        _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        _transport.JoinMulticastGroup();

        _receiveTask = Task.Run(async () =>
        {
            await foreach (var command in _transport.SubscribeAsync<CommandMessage>(_cts.Token))
            {
                MessageReceived?.Invoke(this, command);
            }
        }, _cts.Token);

        await Task.CompletedTask;
    }

    public async Task StopAsync()
    {
        _cts?.Cancel();
        if (_receiveTask != null)
        {
            try
            {
                await _receiveTask;
            }
            catch (OperationCanceledException)
            {
                // Expected
            }
        }
    }

    public void Dispose()
    {
        _cts?.Cancel();
        _cts?.Dispose();
        _transport.Dispose();
    }
}
