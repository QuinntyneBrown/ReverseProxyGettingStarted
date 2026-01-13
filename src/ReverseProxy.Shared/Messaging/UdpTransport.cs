using System.Net;
using System.Net.Sockets;
using MessagePack;

namespace ReverseProxy.Shared.Messaging;

public class UdpTransport : IDisposable
{
    private readonly UdpClient _client;
    private readonly int _port;
    private readonly IPAddress _multicastAddress;
    private bool _disposed;
    private CancellationTokenSource? _cts;

    public UdpTransport(int port = 5000, string multicastGroup = "239.255.255.250")
    {
        _port = port;
        _multicastAddress = IPAddress.Parse(multicastGroup);
        _client = new UdpClient();
        _client.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
    }

    public void JoinMulticastGroup()
    {
        _client.Client.Bind(new IPEndPoint(IPAddress.Any, _port));
        _client.JoinMulticastGroup(_multicastAddress);
    }

    public async Task PublishAsync<T>(T message, CancellationToken cancellationToken = default)
    {
        var data = MessagePackSerializer.Serialize(message);
        var endpoint = new IPEndPoint(_multicastAddress, _port);
        await _client.SendAsync(data, data.Length, endpoint);
    }

    public async Task<T?> ReceiveAsync<T>(CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _client.ReceiveAsync(cancellationToken);
            return MessagePackSerializer.Deserialize<T>(result.Buffer);
        }
        catch (OperationCanceledException)
        {
            return default;
        }
    }

    public IAsyncEnumerable<T> SubscribeAsync<T>(CancellationToken cancellationToken = default)
    {
        return SubscribeInternalAsync<T>(cancellationToken);
    }

    private async IAsyncEnumerable<T> SubscribeInternalAsync<T>(
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            var message = await ReceiveAsync<T>(cancellationToken);
            if (message != null)
            {
                yield return message;
            }
        }
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _cts?.Cancel();
        _cts?.Dispose();
        _client.Dispose();
    }
}
