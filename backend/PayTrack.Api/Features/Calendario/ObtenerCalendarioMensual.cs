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

public class ObtenerCalendarioMensual : IEndpoint
{
    public record DiaResumen(
        int Dia,
        int CantidadDeudas,
        int CantidadPagos,
        decimal MontoDeudas,
        decimal MontoPagado
    );

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/calendario", Handler)
           .WithName("ObtenerCalendarioMensual")
           .WithTags("Calendario");
    }

    public static async Task<IResult> Handler(PayTrackDbContext db, int? anio, int? mes, int? tzOffset)
    {
        var y = anio ?? DateTime.Now.Year;
        var m = mes ?? DateTime.Now.Month;
        var offsetMinutes = tzOffset ?? 0;
        var offset = TimeSpan.FromMinutes(offsetMinutes);

        var diasEnMes = DateTime.DaysInMonth(y, m);

        // Deudas y Pagos del mes (ajustados con el offset)
        var deudas = await db.Deudas
            .Where(d => d.Activo && d.FechaDeuda.Year == y && d.FechaDeuda.Month == m)
            .ToListAsync();

        var pagos = await db.Pagos
            .Where(p => p.Activo && p.FechaPago.Year == y && p.FechaPago.Month == m)
            .ToListAsync();

        var resumenPorDia = new List<DiaResumen>();

        for (int dia = 1; dia <= diasEnMes; dia++)
        {
            var deudasDia = deudas.Where(d => (d.FechaDeuda + offset).Day == dia).ToList();
            var pagosDia = pagos.Where(p => (p.FechaPago + offset).Day == dia).ToList();

            resumenPorDia.Add(new DiaResumen(
                dia,
                deudasDia.Count,
                pagosDia.Count,
                deudasDia.Sum(d => d.Monto),
                pagosDia.Sum(p => p.Monto)
            ));
        }

        return Results.Ok(new
        {
            anio = y,
            mes = m,
            dias = resumenPorDia
        });
    }
}
