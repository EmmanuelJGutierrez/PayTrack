using System;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PayTrack.Api.Data;
using PayTrack.Api.Models;
using PayTrack.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Configuración de base de datos SQLite en %APPDATA%/PayTrack/paytrack.db
var appDataPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "PayTrack");
Directory.CreateDirectory(appDataPath);
var dbPath = Path.Combine(appDataPath, "paytrack.db");

builder.Services.AddDbContext<PayTrackDbContext>(options =>
{
    options.UseSqlite($"Data Source={dbPath}");
});

builder.Services.AddScoped<ProveedorEstadoService>();

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

// Auto-crear base de datos y sembrar datos iniciales demostrativos (basados en Figma)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PayTrackDbContext>();
    db.Database.EnsureCreated();

    if (!db.Proveedores.Any())
    {
        var fechaActual = new DateTime(2026, 7, 15, 10, 0, 0, DateTimeKind.Utc);

        var gamma = new Proveedor
        {
            Nombre = "Servicios Gamma Corp.",
            Contacto = "soporte@gammacorp.com | +54 11 4455-6677",
            Notas = "Pasa los días jueves. Pago por transferencia bancaria.",
            FechaCreacion = fechaActual
        };

        var alfa = new Proveedor
        {
            Nombre = "Proveedor Alfa S.A.",
            Contacto = "ventas@alfa.com | +54 11 2233-4455",
            Notas = "Insumos de oficina. Factura A.",
            FechaCreacion = fechaActual
        };

        var beta = new Proveedor
        {
            Nombre = "Distribuidora Beta Ltda.",
            Contacto = "pedidos@beta.com.ar",
            Notas = "Descuento por pronto pago 5%.",
            FechaCreacion = fechaActual
        };

        var delta = new Proveedor
        {
            Nombre = "Importaciones Delta",
            Contacto = "delta.import@gmail.com",
            Notas = "Materia prima importada.",
            FechaCreacion = fechaActual
        };

        db.Proveedores.AddRange(gamma, alfa, beta, delta);
        db.SaveChanges();

        // Deudas de Gamma Corp
        var deudaMantenimiento = new Deuda
        {
            ProveedorId = gamma.Id,
            Monto = 48000m,
            Concepto = "Mantenimiento Anual",
            TipoComprobante = TipoComprobante.Remito,
            NumeroComprobante = "REM-0004-00129",
            FechaDeuda = new DateTime(2026, 7, 1, 9, 0, 0, DateTimeKind.Utc)
        };

        var deudaLicencia = new Deuda
        {
            ProveedorId = gamma.Id,
            Monto = 9600m,
            Concepto = "Licencia Software ERP",
            TipoComprobante = TipoComprobante.Factura,
            NumeroComprobante = "FAC-A-0002-00431",
            FechaDeuda = new DateTime(2026, 7, 10, 11, 30, 0, DateTimeKind.Utc)
        };

        db.Deudas.AddRange(deudaMantenimiento, deudaLicencia);

        // Deudas de los demás proveedores para reflejar el Figma
        db.Deudas.Add(new Deuda
        {
            ProveedorId = alfa.Id,
            Monto = 20000m,
            Concepto = "Resmas de papel y cartuchos",
            TipoComprobante = TipoComprobante.Factura,
            NumeroComprobante = "FAC-A-0001-1002",
            FechaDeuda = new DateTime(2026, 7, 5, 10, 0, 0, DateTimeKind.Utc)
        });

        db.Deudas.Add(new Deuda
        {
            ProveedorId = beta.Id,
            Monto = 6200m,
            Concepto = "Artículos de limpieza",
            TipoComprobante = TipoComprobante.Remito,
            NumeroComprobante = "REM-0001-554",
            FechaDeuda = new DateTime(2026, 7, 8, 14, 0, 0, DateTimeKind.Utc)
        });

        db.Deudas.Add(new Deuda
        {
            ProveedorId = delta.Id,
            Monto = 140000m,
            Concepto = "Lote repuestos importados",
            TipoComprobante = TipoComprobante.Factura,
            NumeroComprobante = "FAC-A-0005-0988",
            FechaDeuda = new DateTime(2026, 7, 2, 8, 0, 0, DateTimeKind.Utc)
        });

        db.SaveChanges();

        // Pagos para Gamma Corp (Mantenimiento saldado: $36,000 previo + $12,000 en Julio 2026 = $48,000)
        db.Pagos.Add(new Pago
        {
            ProveedorId = gamma.Id,
            DeudaId = deudaMantenimiento.Id,
            Monto = 36000m,
            MedioPago = MedioPago.Transferencia,
            Referencia = "TRF-88741",
            Comentario = "Anticipo mantenimiento",
            FechaPago = new DateTime(2026, 6, 20, 15, 0, 0, DateTimeKind.Utc)
        });

        db.Pagos.Add(new Pago
        {
            ProveedorId = gamma.Id,
            DeudaId = deudaMantenimiento.Id,
            Monto = 12000m,
            MedioPago = MedioPago.Transferencia,
            Referencia = "TRF-90214",
            Comentario = "Saldo cuota julio mantenimiento",
            FechaPago = new DateTime(2026, 7, 12, 16, 30, 0, DateTimeKind.Utc)
        });

        db.SaveChanges();
    }
}

// ---------------- ENDPOINTS ----------------

// Health check
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", version = "1.1", database = dbPath }));

// HU-02: Listado de proveedores con resumen y estados
app.MapGet("/api/proveedores", async (
    ProveedorEstadoService service,
    int? anio,
    int? mes,
    string? buscar,
    bool incluirInactivos = false) =>
{
    var y = anio ?? DateTime.Now.Year;
    var m = mes ?? DateTime.Now.Month;
    var list = await service.ObtenerProveedoresResumenAsync(y, m, buscar, incluirInactivos);
    return Results.Ok(list);
});

// HU-01: Alta de proveedor
app.MapPost("/api/proveedores", async (PayTrackDbContext db, CrearProveedorRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Nombre) || req.Nombre.Trim().Length < 2)
    {
        return Results.BadRequest(new { error = true, code = "NOMBRE_INVALIDO", message = "El nombre del proveedor es obligatorio (mínimo 2 caracteres)." });
    }

    var nombreNorm = req.Nombre.Trim();
    var existe = await db.Proveedores.AnyAsync(p => p.Activo && p.Nombre.ToLower() == nombreNorm.ToLower());
    if (existe)
    {
        return Results.Conflict(new { error = true, code = "PROVEEDOR_NOMBRE_DUPLICADO", message = "Ya existe un proveedor activo con ese nombre." });
    }

    var proveedor = new Proveedor
    {
        Nombre = nombreNorm,
        Contacto = req.Contacto?.Trim(),
        Notas = req.Notas?.Trim(),
        FechaCreacion = DateTime.UtcNow
    };

    db.Proveedores.Add(proveedor);
    await db.SaveChangesAsync();

    return Results.Created($"/api/proveedores/{proveedor.Id}", proveedor);
});

// HU-03: Edición de proveedor
app.MapPut("/api/proveedores/{id:int}", async (int id, PayTrackDbContext db, ActualizarProveedorRequest req) =>
{
    var proveedor = await db.Proveedores.FindAsync(id);
    if (proveedor == null || !proveedor.Activo)
    {
        return Results.NotFound(new { error = true, code = "PROVEEDOR_NO_ENCONTRADO", message = "Proveedor no encontrado o inactivo." });
    }

    if (string.IsNullOrWhiteSpace(req.Nombre) || req.Nombre.Trim().Length < 2)
    {
        return Results.BadRequest(new { error = true, code = "NOMBRE_INVALIDO", message = "El nombre del proveedor es obligatorio." });
    }

    var nombreNorm = req.Nombre.Trim();
    var duplicado = await db.Proveedores.AnyAsync(p => p.Id != id && p.Activo && p.Nombre.ToLower() == nombreNorm.ToLower());
    if (duplicado)
    {
        return Results.Conflict(new { error = true, code = "PROVEEDOR_NOMBRE_DUPLICADO", message = "Ya existe otro proveedor activo con ese nombre." });
    }

    proveedor.Nombre = nombreNorm;
    proveedor.Contacto = req.Contacto?.Trim();
    proveedor.Notas = req.Notas?.Trim();

    await db.SaveChangesAsync();
    return Results.Ok(proveedor);
});

// HU-04: Baja lógica de proveedor
app.MapDelete("/api/proveedores/{id:int}", async (int id, PayTrackDbContext db) =>
{
    var proveedor = await db.Proveedores.FindAsync(id);
    if (proveedor == null || !proveedor.Activo)
    {
        return Results.NotFound(new { error = true, code = "PROVEEDOR_NO_ENCONTRADO", message = "Proveedor no encontrado." });
    }

    proveedor.Activo = false;
    proveedor.FechaBaja = DateTime.UtcNow;

    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Proveedor dado de baja correctamente." });
});

// Deudas del proveedor
app.MapGet("/api/proveedores/{id:int}/deudas", async (int id, ProveedorEstadoService service, int? anio, int? mes) =>
{
    var y = anio ?? DateTime.Now.Year;
    var m = mes ?? DateTime.Now.Month;
    var deudas = await service.ObtenerDeudasResumenAsync(id, y, m);
    return Results.Ok(deudas);
});

// HU-05: Carga de deuda
app.MapPost("/api/proveedores/{id:int}/deudas", async (int id, PayTrackDbContext db, CrearDeudaRequest req) =>
{
    var proveedor = await db.Proveedores.FindAsync(id);
    if (proveedor == null || !proveedor.Activo)
    {
        return Results.NotFound(new { error = true, code = "PROVEEDOR_NO_ENCONTRADO", message = "El proveedor no existe o está inactivo." });
    }

    if (req.Monto <= 0)
    {
        return Results.BadRequest(new { error = true, code = "MONTO_INVALIDO", message = "El monto debe ser mayor a 0." });
    }

    if (string.IsNullOrWhiteSpace(req.Concepto) || req.Concepto.Trim().Length < 3)
    {
        return Results.BadRequest(new { error = true, code = "CONCEPTO_INVALIDO", message = "El concepto es obligatorio (mínimo 3 caracteres)." });
    }

    if (!Enum.TryParse<TipoComprobante>(req.TipoComprobante, true, out var tipo))
    {
        return Results.BadRequest(new { error = true, code = "TIPO_COMPROBANTE_INVALIDO", message = "El tipo de comprobante debe ser 'Remito' o 'Factura'." });
    }

    var deuda = new Deuda
    {
        ProveedorId = id,
        Monto = Math.Round(req.Monto, 2),
        Concepto = req.Concepto.Trim(),
        TipoComprobante = tipo,
        NumeroComprobante = req.NumeroComprobante?.Trim(),
        FechaDeuda = req.FechaDeuda ?? DateTime.UtcNow,
        FechaCreacion = DateTime.UtcNow
    };

    db.Deudas.Add(deuda);
    await db.SaveChangesAsync();

    return Results.Created($"/api/proveedores/{id}/deudas/{deuda.Id}", deuda);
});

// HU-06: Baja lógica de deuda
app.MapDelete("/api/proveedores/{id:int}/deudas/{deudaId:int}", async (int id, int deudaId, PayTrackDbContext db) =>
{
    var deuda = await db.Deudas.FirstOrDefaultAsync(d => d.Id == deudaId && d.ProveedorId == id && d.Activo);
    if (deuda == null)
    {
        return Results.NotFound(new { error = true, code = "DEUDA_NO_ENCONTRADA", message = "Deuda no encontrada." });
    }

    deuda.Activo = false;
    deuda.FechaBaja = DateTime.UtcNow;

    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Deuda eliminada correctamente." });
});

// HU-07: Registrar Pago con VALIDACIÓN ESTRICTA ANTI-EXCEDENTE
app.MapPost("/api/proveedores/{id:int}/pagos", async (int id, PayTrackDbContext db, CrearPagoRequest req) =>
{
    var proveedor = await db.Proveedores
        .Include(p => p.Deudas)
        .Include(p => p.Pagos)
        .FirstOrDefaultAsync(p => p.Id == id && p.Activo);

    if (proveedor == null)
    {
        return Results.NotFound(new { error = true, code = "PROVEEDOR_NO_ENCONTRADO", message = "Proveedor no encontrado." });
    }

    if (req.Monto <= 0)
    {
        return Results.BadRequest(new { error = true, code = "MONTO_INVALIDO", message = "El monto a pagar debe ser mayor a cero." });
    }

    if (!Enum.TryParse<MedioPago>(req.MedioPago, true, out var medio))
    {
        return Results.BadRequest(new { error = true, code = "MEDIO_PAGO_INVALIDO", message = "Medio de pago no válido." });
    }

    var totalDeudasActivas = proveedor.Deudas.Where(d => d.Activo).Sum(d => d.Monto);
    var totalPagosActivos = proveedor.Pagos.Where(p => p.Activo).Sum(p => p.Monto);
    var saldoProveedor = Math.Max(0, totalDeudasActivas - totalPagosActivos);

    // Validación si se imputa a una deuda puntual
    Deuda? deudaPuntual = null;
    if (req.DeudaId.HasValue)
    {
        deudaPuntual = proveedor.Deudas.FirstOrDefault(d => d.Id == req.DeudaId.Value && d.Activo);
        if (deudaPuntual == null)
        {
            return Results.BadRequest(new { error = true, code = "DEUDA_INVALIDA", message = "La deuda especificada no existe para este proveedor o fue eliminada." });
        }

        var pagosDeuda = await db.Pagos.Where(p => p.DeudaId == deudaPuntual.Id && p.Activo).SumAsync(p => p.Monto);
        var saldoDeuda = Math.Max(0, deudaPuntual.Monto - pagosDeuda);

        if (req.Monto > saldoDeuda)
        {
            return Results.BadRequest(new
            {
                error = true,
                code = "PAGO_EXCEDE_SALDO",
                message = $"El pago (${req.Monto:N2}) supera el saldo pendiente de esta deuda (${saldoDeuda:N2}). No se permiten saldos excedentes."
            });
        }
    }

    // Validación general de no superar el saldo total
    if (req.Monto > saldoProveedor)
    {
        return Results.BadRequest(new
        {
            error = true,
            code = "PAGO_EXCEDE_SALDO",
            message = $"El pago (${req.Monto:N2}) supera el saldo pendiente total del proveedor (${saldoProveedor:N2}). No se permiten saldos excedentes."
        });
    }

    var pago = new Pago
    {
        ProveedorId = id,
        DeudaId = req.DeudaId,
        Monto = Math.Round(req.Monto, 2),
        MedioPago = medio,
        Referencia = req.Referencia?.Trim(),
        Comentario = req.Comentario?.Trim(),
        FechaPago = req.FechaPago ?? DateTime.UtcNow,
        FechaCreacion = DateTime.UtcNow
    };

    db.Pagos.Add(pago);
    await db.SaveChangesAsync();

    return Results.Created($"/api/proveedores/{id}/pagos/{pago.Id}", pago);
});

// HU-08: Resumen mensual de pagos (Reemplazo del Excel)
app.MapGet("/api/pagos/resumen-mensual", async (PayTrackDbContext db, int? anio, int? mes) =>
{
    var y = anio ?? DateTime.Now.Year;
    var m = mes ?? DateTime.Now.Month;

    var pagosMes = await db.Pagos
        .Include(p => p.Proveedor)
        .Where(p => p.Activo && p.FechaPago.Year == y && p.FechaPago.Month == m)
        .ToListAsync();

    var totalPagado = pagosMes.Sum(p => p.Monto);
    var cantidadPagos = pagosMes.Count;

    var desglose = Enum.GetValues<MedioPago>()
        .ToDictionary(
            medio => medio.ToString(),
            medio => pagosMes.Where(p => p.MedioPago == medio).Sum(p => p.Monto)
        );

    return Results.Ok(new
    {
        anio = y,
        mes = m,
        totalPagado,
        cantidadPagos,
        porMedioPago = desglose
    });
});

// HU-11: Historial cronológico de movimientos del proveedor
app.MapGet("/api/proveedores/{id:int}/historial", async (int id, PayTrackDbContext db) =>
{
    var deudas = await db.Deudas
        .Where(d => d.ProveedorId == id)
        .Select(d => new
        {
            tipoMovimiento = "Deuda",
            d.Id,
            d.Monto,
            d.Concepto,
            TipoComprobante = (string?)d.TipoComprobante.ToString(),
            d.NumeroComprobante,
            MedioPago = (string?)null,
            Referencia = (string?)null,
            Fecha = d.FechaDeuda,
            d.Activo
        })
        .ToListAsync();

    var pagos = await db.Pagos
        .Where(p => p.ProveedorId == id)
        .Select(p => new
        {
            tipoMovimiento = "Pago",
            p.Id,
            p.Monto,
            Concepto = p.Comentario ?? "Pago a cuenta",
            TipoComprobante = (string?)null,
            NumeroComprobante = (string?)null,
            MedioPago = (string?)p.MedioPago.ToString(),
            p.Referencia,
            Fecha = p.FechaPago,
            p.Activo
        })
        .ToListAsync();

    var timeline = deudas.Concat(pagos)
        .OrderByDescending(x => x.Fecha)
        .ToList();

    return Results.Ok(timeline);
});

app.Run();

// DTOs para solicitudes
public record CrearProveedorRequest(string Nombre, string? Contacto, string? Notas);
public record ActualizarProveedorRequest(string Nombre, string? Contacto, string? Notas);
public record CrearDeudaRequest(decimal Monto, string Concepto, string TipoComprobante, string? NumeroComprobante, DateTime? FechaDeuda);
public record CrearPagoRequest(decimal Monto, string MedioPago, string? Referencia, string? Comentario, DateTime? FechaPago, int? DeudaId);
