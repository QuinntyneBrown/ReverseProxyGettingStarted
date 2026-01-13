using MessagePack;

namespace ReverseProxy.Shared.Messaging;

public static class MessageSerializer
{
    private static readonly MessagePackSerializerOptions Options = MessagePackSerializerOptions.Standard
        .WithCompression(MessagePackCompression.Lz4BlockArray);

    public static byte[] Serialize<T>(T message)
    {
        return MessagePackSerializer.Serialize(message, Options);
    }

    public static T Deserialize<T>(byte[] data)
    {
        return MessagePackSerializer.Deserialize<T>(data, Options);
    }

    public static T Deserialize<T>(ReadOnlyMemory<byte> data)
    {
        return MessagePackSerializer.Deserialize<T>(data, Options);
    }

    public static async Task<byte[]> SerializeAsync<T>(T message, CancellationToken cancellationToken = default)
    {
        using var stream = new MemoryStream();
        await MessagePackSerializer.SerializeAsync(stream, message, Options, cancellationToken);
        return stream.ToArray();
    }

    public static async Task<T> DeserializeAsync<T>(Stream stream, CancellationToken cancellationToken = default)
    {
        return await MessagePackSerializer.DeserializeAsync<T>(stream, Options, cancellationToken);
    }
}
