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

namespace PayTrack.Api.Features.Proveedores;

public class ListarProveedores : IEndpoint
{
    public record Response(
        int Id,
        string Nombre,
        string? Contacto,
        string? Notas,
        bool Activo,
        int CantidadDeudas,
        decimal TotalDeudas,
        decimal TotalPagado,
        decimal SaldoPendiente,
        decimal PagadoEsteMes,
        int PorcentajeSaldado,
        string ColorEstado,
        string EstadoTexto,
        bool TieneDeudasVencidas,
        bool TieneDeudasPorVencer
    );

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/proveedores", Handler)
           .WithName("ListarProveedores")
           .WithTags("Proveedores");
    }

    public static async Task<IResult> Handler(
        PayTrackDbContext db,
        int? anio,
        int? mes,
        string? buscar,
        bool incluirInactivos = false)
    {
        var y = anio ?? DateTime.Now.Year;
        var m = mes ?? DateTime.Now.Month;
        var hoy = DateTime.UtcNow.Date;

        var query = db.Proveedores
            .Include(p => p.Deudas)
                .ThenInclude(d => d.Pagos)
            .Include(p => p.Pagos)
            .AsSplitQuery()
            .AsQueryable();

        if (!incluirInactivos)
        {
            query = query.Where(p => p.Activo);
        }

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var term = buscar.Trim().ToLower();
            query = query.Where(p => p.Nombre.ToLower().Contains(term) || (p.Contacto != null && p.Contacto.ToLower().Contains(term)));
        }

        var proveedores = await query.ToListAsync();
        var lista = new List<Response>();

        foreach (var p in proveedores)
        {
            var deudasActivas = p.Deudas.Where(d => d.Activo).ToList();
            var pagosActivos = p.Pagos.Where(pg => pg.Activo).ToList();

            var totalDeuda = deudasActivas.Sum(d => d.Monto);
            var totalPagado = pagosActivos.Sum(pg => pg.Monto);
            var saldoPendiente = Math.Max(0, totalDeuda - totalPagado);

            var pagadoEsteMes = pagosActivos
                .Where(pg => pg.FechaPago.Year == y && pg.FechaPago.Month == m)
                .Sum(pg => pg.Monto);

            var (porcentaje, color, texto) = EstadoColorCalculator.Calcular(totalDeuda, totalPagado);

            bool tieneVencidas = false;
            bool tienePorVencer = false;

            foreach (var d in deudasActivas)
            {
                var pagosDeuda = d.Pagos.Where(pg => pg.Activo).Sum(pg => pg.Monto);
                var saldoDeuda = Math.Max(0, d.Monto - pagosDeuda);

                if (saldoDeuda > 0 && d.FechaVencimiento.HasValue)
                {
                    var dias = (d.FechaVencimiento.Value.Date - hoy).TotalDays;
                    if (dias < 0)
                    {
                        tieneVencidas = true;
                    }
                    else if (dias <= 7)
                    {
                        tienePorVencer = true;
                    }
                }
            }

            lista.Add(new Response(
                p.Id,
                p.Nombre,
                p.Contacto,
                p.Notas,
                p.Activo,
                deudasActivas.Count,
                totalDeuda,
                totalPagado,
                saldoPendiente,
                pagadoEsteMes,
                porcentaje,
                color,
                texto,
                tieneVencidas,
                tienePorVencer
            ));
        }

        var ordenados = lista.OrderByDescending(x => x.TieneDeudasVencidas)
                             .ThenByDescending(x => x.TieneDeudasPorVencer)
                             .ThenByDescending(x => x.SaldoPendiente)
                             .ThenBy(x => x.Nombre)
                             .ToList();

        return Results.Ok(ordenados);
    }
}
