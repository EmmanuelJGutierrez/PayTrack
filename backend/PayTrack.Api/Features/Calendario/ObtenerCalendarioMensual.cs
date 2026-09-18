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
        var inicioMes = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Utc);
        var finMes = new DateTime(y, m, diasEnMes, 23, 59, 59, 999, DateTimeKind.Utc);

        // 1. Deudas emitidas en el mes
        var deudasEmitidas = await db.Deudas
            .Where(d => d.Activo && d.FechaDeuda.Year == y && d.FechaDeuda.Month == m)
            .Include(d => d.Pagos)
            .ToListAsync();

        // 2. Deudas con vencimiento en el mes
        var deudasVencimiento = await db.Deudas
            .Where(d => d.Activo && d.FechaVencimiento.HasValue && d.FechaVencimiento.Value.Year == y && d.FechaVencimiento.Value.Month == m)
            .Include(d => d.Pagos)
            .ToListAsync();

        var pagos = await db.Pagos
            .Where(p => p.Activo && p.FechaPago.Year == y && p.FechaPago.Month == m)
            .ToListAsync();

        decimal GetSaldoPendiente(Deuda d)
        {
            var pagado = (d.Pagos ?? Enumerable.Empty<Pago>()).Where(p => p.Activo).Sum(p => p.Monto);
            return Math.Max(0, d.Monto - pagado);
        }

        var resumenPorDia = new List<DiaResumen>();

        for (int dia = 1; dia <= diasEnMes; dia++)
        {
            var emitidasDia = deudasEmitidas.Where(d => (d.FechaDeuda + offset).Day == dia).ToList();
            
            // Solo considerar vencimientos si aún tienen saldo pendiente a vencer
            var vencenDia = deudasVencimiento
                .Where(d => (d.FechaVencimiento!.Value + offset).Day == dia && GetSaldoPendiente(d) > 0)
                .ToList();

            var pagosDia = pagos.Where(p => (p.FechaPago + offset).Day == dia).ToList();

            var totalDeudasDia = emitidasDia.Concat(vencenDia).DistinctBy(d => d.Id).ToList();

            // Monto a vencer en el día es el saldo pendiente real a pagar
            var montoVencenDia = vencenDia.Sum(d => GetSaldoPendiente(d));
            var montoEmitidasDia = emitidasDia.Sum(d => d.Monto);
            
            // Monto total del día: emitidas hoy + vencimientos que no fueron emitidos hoy
            var montoDeudasDia = montoEmitidasDia + vencenDia.Where(v => !emitidasDia.Any(e => e.Id == v.Id)).Sum(d => GetSaldoPendiente(d));

            resumenPorDia.Add(new DiaResumen(
                dia,
                totalDeudasDia.Count,
                pagosDia.Count,
                montoDeudasDia,
                pagosDia.Sum(p => p.Monto),
                vencenDia.Count,
                montoVencenDia
            ));
        }

        // Deudas emitidas antes del mes actual que aún tienen saldo pendiente
        var deudasPrevias = await db.Deudas
            .Where(d => d.Activo && d.FechaDeuda < inicioMes)
            .Include(d => d.Pagos)
            .ToListAsync();

        decimal totalArrastrePrevio = 0;
        int cantidadDeudasArrastre = 0;

        foreach (var d in deudasPrevias)
        {
            var saldoActual = GetSaldoPendiente(d);
            if (saldoActual > 0)
            {
                totalArrastrePrevio += saldoActual;
                cantidadDeudasArrastre++;
            }
        }

        var totalMesPagos = pagos.Sum(p => p.Monto);
        
        // Deuda total correspondiente a este periodo:
        // Nuevas deudas emitidas en este mes + saldo pendiente arrastrado de meses previos
        var nuevasDeudasMonto = deudasEmitidas.Sum(d => d.Monto);
        var totalMesDeudas = nuevasDeudasMonto + totalArrastrePrevio;
        
        // Balance neto: si totalMesDeudas > totalMesPagos, es un saldo a pagar (negativo)
        var saldoNetoMes = totalMesPagos - totalMesDeudas;

        return Results.Ok(new
        {
            anio = y,
            mes = m,
            totalMesPagos,
            totalMesDeudas,
            saldoNetoMes,
            totalArrastrePrevio,
            cantidadDeudasArrastre,
            dias = resumenPorDia
        });
    }
}
