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
using PayTrack.Api.Domain.Shared;

namespace PayTrack.Api.Features.Deudas;

public class ListarDeudas : IEndpoint
{
    public record Response(
        int Id,
        int ProveedorId,
        decimal Monto,
        string Concepto,
        string TipoComprobante,
        string? NumeroComprobante,
        DateTime FechaDeuda,
        bool Activo,
        decimal TotalPagado,
        decimal SaldoPendiente,
        decimal PagadoEsteMes,
        int PorcentajeSaldado,
        string ColorEstado
    );

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/proveedores/{id:int}/deudas", Handler)
           .WithName("ListarDeudas")
           .WithTags("Deudas");
    }

    public static async Task<IResult> Handler(int id, PayTrackDbContext db, int? anio, int? mes)
    {
        var y = anio ?? DateTime.Now.Year;
        var m = mes ?? DateTime.Now.Month;

        var deudas = await db.Deudas
            .Where(d => d.ProveedorId == id && d.Activo)
            .Include(d => d.Pagos)
            .OrderByDescending(d => d.FechaDeuda)
            .ToListAsync();

        var lista = new List<Response>();

        foreach (var d in deudas)
        {
            var pagosActivos = d.Pagos.Where(pg => pg.Activo).ToList();
            var totalPagado = pagosActivos.Sum(pg => pg.Monto);
            var saldoPendiente = Math.Max(0, d.Monto - totalPagado);

            var pagadoEsteMes = pagosActivos
                .Where(pg => pg.FechaPago.Year == y && pg.FechaPago.Month == m)
                .Sum(pg => pg.Monto);

            var (porcentaje, color, _) = EstadoColorCalculator.Calcular(d.Monto, totalPagado);

            lista.Add(new Response(
                d.Id,
                d.ProveedorId,
                d.Monto,
                d.Concepto,
                d.TipoComprobante.ToString(),
                d.NumeroComprobante,
                d.FechaDeuda,
                d.Activo,
                totalPagado,
                saldoPendiente,
                pagadoEsteMes,
                porcentaje,
                color
            ));
        }

        return Results.Ok(lista);
    }
}
