using ReverseProxy.Shared.Messages;
using ReverseProxy.TelemetryService.Hubs;
using ReverseProxy.TelemetryService.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddSignalR()
    .AddMessagePackProtocol();

builder.Services.AddSingleton<TelemetryCacheService>();
builder.Services.AddHostedService<SimulationService>();

// CORS for Angular app
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowAngular");

app.MapHub<TelemetryHub>("/hubs/telemetry");

app.MapGet("/", () => "Telemetry Service Running");

app.MapGet("/api/telemetry/current", (TelemetryCacheService cache) => cache.GetAllCurrent());

app.MapGet("/api/telemetry/current/{name}", (string name, TelemetryCacheService cache) =>
    cache.GetCurrent(name) is TelemetryMessage msg ? Results.Ok(msg) : Results.NotFound());

app.MapGet("/api/telemetry/history/{name}", (string name, int? count, TelemetryCacheService cache) =>
    cache.GetHistory(name, count ?? 100));

app.MapGet("/api/telemetry/definitions", () => ReverseProxy.Shared.Messages.TelemetryDefinitions.AllTelemetry);

app.Run();
