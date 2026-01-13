using ReverseProxy.Shared.Messages;

namespace ReverseProxy.Shared.Messaging;

public interface IPublisher<T> : IDisposable
{
    Task PublishAsync(T message, CancellationToken cancellationToken = default);
}

public class TelemetryPublisher : IPublisher<TelemetryBatch>
{
    private readonly UdpTransport _transport;

    public TelemetryPublisher(int port = 5001, string multicastGroup = "239.255.255.251")
    {
        _transport = new UdpTransport(port, multicastGroup);
    }

    public async Task PublishAsync(TelemetryBatch message, CancellationToken cancellationToken = default)
    {
        await _transport.PublishAsync(message, cancellationToken);
    }

    public void Dispose()
    {
        _transport.Dispose();
    }
}

public class CommandPublisher : IPublisher<CommandMessage>
{
    private readonly UdpTransport _transport;

    public CommandPublisher(int port = 5002, string multicastGroup = "239.255.255.252")
    {
        _transport = new UdpTransport(port, multicastGroup);
    }

    public async Task PublishAsync(CommandMessage message, CancellationToken cancellationToken = default)
    {
        await _transport.PublishAsync(message, cancellationToken);
    }

    public void Dispose()
    {
        _transport.Dispose();
    }
}

public class CommandResponsePublisher : IPublisher<CommandResponse>
{
    private readonly UdpTransport _transport;

    public CommandResponsePublisher(int port = 5003, string multicastGroup = "239.255.255.253")
    {
        _transport = new UdpTransport(port, multicastGroup);
    }

    public async Task PublishAsync(CommandResponse message, CancellationToken cancellationToken = default)
    {
        await _transport.PublishAsync(message, cancellationToken);
    }

    public void Dispose()
    {
        _transport.Dispose();
    }
}
