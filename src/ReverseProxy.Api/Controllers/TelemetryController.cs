using Microsoft.AspNetCore.Mvc;
using ReverseProxy.Shared.Messages;

namespace ReverseProxy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TelemetryController : ControllerBase
{
    private readonly ILogger<TelemetryController> _logger;

    public TelemetryController(ILogger<TelemetryController> logger)
    {
        _logger = logger;
    }

    [HttpGet("definitions")]
    public ActionResult<IEnumerable<TelemetryDefinition>> GetDefinitions()
    {
        return Ok(TelemetryDefinitions.AllTelemetry);
    }

    [HttpGet("definitions/{name}")]
    public ActionResult<TelemetryDefinition> GetDefinition(string name)
    {
        var definition = TelemetryDefinitions.AllTelemetry.FirstOrDefault(d => d.Name == name);
        if (definition == null)
        {
            return NotFound();
        }
        return Ok(definition);
    }

    [HttpGet("search")]
    public ActionResult<IEnumerable<TelemetryDefinition>> SearchDefinitions([FromQuery] string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Ok(TelemetryDefinitions.AllTelemetry);
        }

        var results = TelemetryDefinitions.AllTelemetry
            .Where(d => d.Name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                       d.DisplayName.Contains(query, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return Ok(results);
    }
}
