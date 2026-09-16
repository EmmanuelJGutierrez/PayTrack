using System;
using System.IO;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PayTrack.Api.Common;
using PayTrack.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Configuración de base de datos SQLite
string dbPath;
if (builder.Environment.IsDevelopment())
{
    var localDataDir = Path.Combine(builder.Environment.ContentRootPath, "data");
    Directory.CreateDirectory(localDataDir);
    dbPath = Path.Combine(localDataDir, "paytrack.db");
}
else
{
    var appDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "PayTrack");
    Directory.CreateDirectory(appDataDir);
    dbPath = Path.Combine(appDataDir, "paytrack.db");
}

builder.Services.AddDbContext<PayTrackDbContext>(options =>
{
    options.UseSqlite($"Data Source={dbPath}");
});

// Evitar ciclos de serialización JSON en relaciones bidireccionales
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// Auto-registro de todos los slices de Vertical Slice Architecture
builder.Services.AddEndpoints(typeof(Program).Assembly);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();

// Inicialización de la base de datos y datos demostrativos
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PayTrackDbContext>();
    DbInitializer.Initialize(db);
}

// Health check
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    architecture = "Vertical Slice Architecture (VSA)",
    version = "1.2",
    database = dbPath
}));

// Mapeo automático de todos los IEndpoint
app.MapEndpoints();

app.Run();

public partial class Program { }
