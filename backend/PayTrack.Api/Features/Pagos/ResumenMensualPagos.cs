using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Common;
using PayTrack.Api.Data;
using PayTrack.Api.Domain;

namespace PayTrack.Api.Features.Pagos;

public class ResumenMensualPagos : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/pagos/resumen-mensual", Handler)
           .WithName("ResumenMensualPagos")
           .WithTags("Pagos");
    }

    public static async Task<IResult> Handler(PayTrackDbContext db, int? anio, int? mes)
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
    }
}
