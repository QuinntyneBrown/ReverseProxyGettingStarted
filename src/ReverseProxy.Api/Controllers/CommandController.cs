using Microsoft.AspNetCore.Mvc;
using ReverseProxy.Shared.Messaging;
using ReverseProxy.Shared.Messages;

namespace ReverseProxy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommandController : ControllerBase
{
    private readonly ILogger<CommandController> _logger;
    private readonly CommandPublisher _commandPublisher;

    public CommandController(ILogger<CommandController> logger, CommandPublisher commandPublisher)
    {
        _logger = logger;
        _commandPublisher = commandPublisher;
    }

    [HttpPost]
    public async Task<ActionResult<CommandResponse>> SendCommand([FromBody] CommandRequest request)
    {
        var command = new CommandMessage
        {
            Command = request.Command,
            Parameters = request.Parameters,
            SourceId = "Api"
        };

        await _commandPublisher.PublishAsync(command);

        _logger.LogInformation("Command sent: {Command}", request.Command);

        return Ok(new CommandResponse
        {
            Success = true,
            Command = request.Command,
            Message = $"Command {request.Command} sent"
        });
    }

    [HttpGet("types")]
    public ActionResult<IEnumerable<string>> GetCommandTypes()
    {
        return Ok(Enum.GetNames<CommandType>());
    }
}

public record CommandRequest(CommandType Command, Dictionary<string, object>? Parameters = null);
