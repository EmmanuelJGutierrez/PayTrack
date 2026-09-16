using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Common;
using PayTrack.Api.Data;

namespace PayTrack.Api.Features.Calendario;

public class ObtenerDetalleDia : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/calendario/{anio:int}/{mes:int}/{dia:int}", Handler)
           .WithName("ObtenerDetalleDia")
           .WithTags("Calendario");
    }

    public static async Task<IResult> Handler(int anio, int mes, int dia, PayTrackDbContext db)
    {
        if (mes < 1 || mes > 12 || dia < 1 || dia > DateTime.DaysInMonth(anio, mes))
        {
            return Results.BadRequest(new { error = true, code = "FECHA_INVALIDA", message = "La fecha proporcionada no es válida." });
        }

        var fechaInicio = new DateTime(anio, mes, dia, 0, 0, 0, DateTimeKind.Utc);
        var fechaFin = fechaInicio.AddDays(1);

        // 1. Deudas emitidas en este día
        var deudasEmitidas = await db.Deudas
            .Include(d => d.Proveedor)
            .Where(d => d.Activo && d.FechaDeuda >= fechaInicio && d.FechaDeuda < fechaFin)
            .Select(d => new
            {
                tipoMovimiento = "Deuda",
                d.Id,
                ProveedorId = d.Proveedor.Id,
                ProveedorNombre = d.Proveedor.Nombre,
                d.Monto,
                d.Concepto,
                TipoComprobante = (string?)d.TipoComprobante.ToString(),
                d.NumeroComprobante,
                MedioPago = (string?)null,
                Referencia = (string?)null,
                Fecha = d.FechaDeuda,
                d.Activo,
                EsVencimiento = false,
                FechaVencimiento = d.FechaVencimiento
            })
            .ToListAsync();

        // 2. Deudas que vencen en este día (que no hayan sido ya incluidas como emitidas hoy)
        var emitidasIds = deudasEmitidas.Select(d => d.Id).ToHashSet();

        var deudasVencimiento = await db.Deudas
            .Include(d => d.Proveedor)
            .Where(d => d.Activo && d.FechaVencimiento.HasValue && d.FechaVencimiento.Value >= fechaInicio && d.FechaVencimiento.Value < fechaFin && !emitidasIds.Contains(d.Id))
            .Select(d => new
            {
                tipoMovimiento = "Deuda",
                d.Id,
                ProveedorId = d.Proveedor.Id,
                ProveedorNombre = d.Proveedor.Nombre,
                d.Monto,
                d.Concepto,
                TipoComprobante = (string?)d.TipoComprobante.ToString(),
                d.NumeroComprobante,
                MedioPago = (string?)null,
                Referencia = (string?)null,
                Fecha = d.FechaVencimiento!.Value,
                d.Activo,
                EsVencimiento = true,
                FechaVencimiento = d.FechaVencimiento
            })
            .ToListAsync();

        var todasLasDeudas = deudasEmitidas.Concat(deudasVencimiento).ToList();

        var pagos = await db.Pagos
            .Include(p => p.Proveedor)
            .Where(p => p.Activo && p.FechaPago >= fechaInicio && p.FechaPago < fechaFin)
            .Select(p => new
            {
                tipoMovimiento = "Pago",
                p.Id,
                ProveedorId = p.Proveedor.Id,
                ProveedorNombre = p.Proveedor.Nombre,
                p.Monto,
                Concepto = p.Comentario ?? "Pago registrado",
                TipoComprobante = (string?)null,
                NumeroComprobante = (string?)null,
                MedioPago = (string?)p.MedioPago.ToString(),
                p.Referencia,
                Fecha = p.FechaPago,
                p.Activo,
                EsVencimiento = false,
                FechaVencimiento = (DateTime?)null
            })
            .ToListAsync();

        var movimientos = todasLasDeudas.Concat(pagos)
            .OrderByDescending(x => x.Fecha)
            .ToList();

        return Results.Ok(new
        {
            anio,
            mes,
            dia,
            totalDeudas = todasLasDeudas.Where(d => d.Activo).Sum(d => d.Monto),
            totalPagos = pagos.Where(p => p.Activo).Sum(p => p.Monto),
            cantidadVencimientos = deudasVencimiento.Count,
            movimientos
        });
    }
}
