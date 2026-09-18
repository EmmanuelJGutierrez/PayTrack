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
using PayTrack.Api.Domain;

namespace PayTrack.Api.Features.Calendario;

public class ObtenerDetalleDia : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/calendario/{anio:int}/{mes:int}/{dia:int}", Handler)
           .WithName("ObtenerDetalleDia")
           .WithTags("Calendario");
    }

    public static async Task<IResult> Handler(int anio, int mes, int dia, PayTrackDbContext db, int? tzOffset)
    {
        if (mes < 1 || mes > 12 || dia < 1 || dia > DateTime.DaysInMonth(anio, mes))
        {
            return Results.BadRequest(new { error = true, code = "FECHA_INVALIDA", message = "La fecha proporcionada no es válida." });
        }

        var offsetMinutes = tzOffset ?? 0;
        var offset = TimeSpan.FromMinutes(offsetMinutes);

        // Ventana de 24hs ajustada a la zona horaria del cliente
        var fechaInicio = new DateTime(anio, mes, dia, 0, 0, 0, DateTimeKind.Utc) - offset;
        var fechaFin = fechaInicio.AddDays(1);

        // 1. Deudas emitidas en este día
        var deudasEmitidasEntities = await db.Deudas
            .Include(d => d.Proveedor)
            .Include(d => d.Pagos)
            .Where(d => d.Activo && d.FechaDeuda >= fechaInicio && d.FechaDeuda < fechaFin)
            .ToListAsync();

        var deudasEmitidas = deudasEmitidasEntities.Select(d => new
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
            Fecha = d.FechaDeuda + offset,
            d.Activo,
            EsVencimiento = false,
            FechaVencimiento = d.FechaVencimiento.HasValue ? d.FechaVencimiento.Value + offset : (DateTime?)null
        }).ToList();

        // 2. Deudas con vencimiento en este día
        var emitidasIds = deudasEmitidas.Select(d => d.Id).ToHashSet();

        var deudasVencimientoEntities = await db.Deudas
            .Include(d => d.Proveedor)
            .Include(d => d.Pagos)
            .Where(d => d.Activo && d.FechaVencimiento.HasValue && d.FechaVencimiento.Value >= fechaInicio && d.FechaVencimiento.Value < fechaFin && !emitidasIds.Contains(d.Id))
            .ToListAsync();

        decimal GetSaldoPendiente(Deuda d)
        {
            var pagado = (d.Pagos ?? Enumerable.Empty<Pago>()).Where(p => p.Activo).Sum(p => p.Monto);
            return Math.Max(0, d.Monto - pagado);
        }

        // Solo incluir vencimientos si aún tienen saldo pendiente a vencer
        var deudasVencimiento = deudasVencimientoEntities
            .Where(d => GetSaldoPendiente(d) > 0)
            .Select(d => new
            {
                tipoMovimiento = "Deuda",
                d.Id,
                ProveedorId = d.Proveedor.Id,
                ProveedorNombre = d.Proveedor.Nombre,
                Monto = GetSaldoPendiente(d), // Monto pendiente a vencer
                d.Concepto,
                TipoComprobante = (string?)d.TipoComprobante.ToString(),
                d.NumeroComprobante,
                MedioPago = (string?)null,
                Referencia = (string?)null,
                Fecha = d.FechaVencimiento!.Value + offset,
                d.Activo,
                EsVencimiento = true,
                FechaVencimiento = (DateTime?)(d.FechaVencimiento.Value + offset)
            })
            .ToList();

        var todasLasDeudas = deudasEmitidas.Concat(deudasVencimiento).ToList();

        // 3. Pagos realizados en este día
        var pagosEntities = await db.Pagos
            .Include(p => p.Proveedor)
            .Where(p => p.Activo && p.FechaPago >= fechaInicio && p.FechaPago < fechaFin)
            .ToListAsync();

        var pagos = pagosEntities.Select(p => new
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
            Fecha = p.FechaPago + offset,
            p.Activo,
            EsVencimiento = false,
            FechaVencimiento = (DateTime?)null
        }).ToList();

        var movimientos = todasLasDeudas.Concat(pagos)
            .OrderByDescending(x => x.Fecha)
            .ToList();

        return Results.Ok(new
        {
            anio,
            mes,
            dia,
            totalDeudas = todasLasDeudas.Sum(d => d.Monto),
            totalPagos = pagos.Sum(p => p.Monto),
            cantidadVencimientos = deudasVencimiento.Count,
            movimientos
        });
    }
}
