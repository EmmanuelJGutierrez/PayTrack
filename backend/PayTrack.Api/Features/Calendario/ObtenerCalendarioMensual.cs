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
        decimal MontoPagado,
        int CantidadVencimientos = 0,
        decimal MontoVencimientos = 0
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

        // 1. Deudas emitidas en el mes
        var deudasEmitidas = await db.Deudas
            .Where(d => d.Activo && d.FechaDeuda.Year == y && d.FechaDeuda.Month == m)
            .ToListAsync();

        // 2. Deudas que vencen en el mes
        var deudasVencimiento = await db.Deudas
            .Where(d => d.Activo && d.FechaVencimiento.HasValue && d.FechaVencimiento.Value.Year == y && d.FechaVencimiento.Value.Month == m)
            .ToListAsync();

        var pagos = await db.Pagos
            .Where(p => p.Activo && p.FechaPago.Year == y && p.FechaPago.Month == m)
            .ToListAsync();

        var resumenPorDia = new List<DiaResumen>();

        for (int dia = 1; dia <= diasEnMes; dia++)
        {
            var emitidasDia = deudasEmitidas.Where(d => (d.FechaDeuda + offset).Day == dia).ToList();
            var vencenDia = deudasVencimiento.Where(d => (d.FechaVencimiento!.Value + offset).Day == dia).ToList();
            var pagosDia = pagos.Where(p => (p.FechaPago + offset).Day == dia).ToList();

            // Total deudas para ese día incluye tanto emitidas como vencimientos (evitando duplicados si vencen el mismo día que se emiten)
            var totalDeudasDia = emitidasDia.Concat(vencenDia).DistinctBy(d => d.Id).ToList();

            resumenPorDia.Add(new DiaResumen(
                dia,
                totalDeudasDia.Count,
                pagosDia.Count,
                totalDeudasDia.Sum(d => d.Monto),
                pagosDia.Sum(p => p.Monto),
                vencenDia.Count,
                vencenDia.Sum(d => d.Monto)
            ));
        }

        var inicioMes = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Utc);

        // Deudas previas (emitidas antes del mes actual) que llegaron con saldo pendiente al inicio de este mes
        var deudasPrevias = await db.Deudas
            .Where(d => d.Activo && d.FechaDeuda < inicioMes)
            .Include(d => d.Pagos)
            .ToListAsync();

        decimal totalArrastrePrevio = 0;
        int cantidadDeudasArrastre = 0;

        foreach (var d in deudasPrevias)
        {
            var pagosAntesDelMes = (d.Pagos ?? Enumerable.Empty<Domain.Pago>())
                .Where(p => p.Activo && p.FechaPago < inicioMes)
                .Sum(p => p.Monto);
            var saldoAlInicio = d.Monto - pagosAntesDelMes;
            if (saldoAlInicio > 0)
            {
                totalArrastrePrevio += saldoAlInicio;
                cantidadDeudasArrastre++;
            }
        }

        var totalMesPagos = pagos.Sum(p => p.Monto);
        var todasDeudasMes = deudasEmitidas.Concat(deudasVencimiento).DistinctBy(d => d.Id).ToList();
        var totalMesDeudas = todasDeudasMes.Sum(d => d.Monto);

        return Results.Ok(new
        {
            anio = y,
            mes = m,
            totalMesPagos,
            totalMesDeudas,
            totalArrastrePrevio,
            cantidadDeudasArrastre,
            dias = resumenPorDia
        });
    }
}
