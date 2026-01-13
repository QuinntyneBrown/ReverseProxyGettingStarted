using ReverseProxy.Vehicle;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddHostedService<VehicleWorker>();

var host = builder.Build();
host.Run();
