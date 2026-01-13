using System.Collections.Concurrent;
using ReverseProxy.Shared.Messages;

namespace ReverseProxy.TelemetryService.Services;

public class TelemetryCacheService
{
    private readonly ConcurrentDictionary<string, TelemetryMessage> _currentValues = new();
    private readonly ConcurrentDictionary<string, List<TelemetryMessage>> _history = new();
    private readonly int _maxHistoryItems;

    public TelemetryCacheService(IConfiguration configuration)
    {
        _maxHistoryItems = configuration.GetValue<int>("Telemetry:MaxHistoryItems", 1000);
    }

    public void UpdateTelemetry(TelemetryMessage message)
    {
        _currentValues[message.Name] = message;

        var history = _history.GetOrAdd(message.Name, _ => new List<TelemetryMessage>());
        lock (history)
        {
            history.Add(message);
            if (history.Count > _maxHistoryItems)
            {
                history.RemoveAt(0);
            }
        }
    }

    public void UpdateTelemetryBatch(TelemetryBatch batch)
    {
        foreach (var item in batch.Items)
        {
            UpdateTelemetry(item);
        }
    }

    public TelemetryMessage? GetCurrent(string name)
    {
        _currentValues.TryGetValue(name, out var value);
        return value;
    }

    public Dictionary<string, TelemetryMessage> GetAllCurrent()
    {
        return new Dictionary<string, TelemetryMessage>(_currentValues);
    }

    public List<TelemetryMessage> GetHistory(string name, int count = 100)
    {
        if (!_history.TryGetValue(name, out var history))
        {
            return new List<TelemetryMessage>();
        }

        lock (history)
        {
            return history.TakeLast(count).ToList();
        }
    }

    public Dictionary<string, List<TelemetryMessage>> GetAllHistory(int count = 100)
    {
        var result = new Dictionary<string, List<TelemetryMessage>>();
        foreach (var kvp in _history)
        {
            lock (kvp.Value)
            {
                result[kvp.Key] = kvp.Value.TakeLast(count).ToList();
            }
        }
        return result;
    }

    public void Clear()
    {
        _currentValues.Clear();
        _history.Clear();
    }
}
