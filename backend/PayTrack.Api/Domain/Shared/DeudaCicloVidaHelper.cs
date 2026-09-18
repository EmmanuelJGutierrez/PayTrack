using System;
using System.Collections.Generic;
using System.Linq;
using PayTrack.Api.Domain;

namespace PayTrack.Api.Domain.Shared;

public static class DeudaCicloVidaHelper
{
    /// <summary>
    /// Determina si una deuda está vigente y debe mostrarse en el mes indicado (anio, mes).
    /// Reglas:
    /// 1. Debe haber sido emitida en o antes de dicho mes (FechaDeuda <= finMes).
    /// 2. Si la deuda fue saldada al 100%, solo se muestra en los meses hasta que fue cancelada (inclusive).
    ///    En los meses posteriores a su cancelación, ya no se muestra.
    /// 3. Si aún tiene saldo pendiente, permanece visible en todos los meses siguientes hasta su pago.
    /// </summary>
    public static bool EstaVigenteEnMes(Deuda d, int anio, int mes)
    {
        if (!d.Activo) return false;

        var inicioMes = new DateTime(anio, mes, 1, 0, 0, 0, DateTimeKind.Utc);
        var diasEnMes = DateTime.DaysInMonth(anio, mes);
        var finMes = new DateTime(anio, mes, diasEnMes, 23, 59, 59, 999, DateTimeKind.Utc);

        // 1. No mostrar antes de que haya sido emitida
        if (d.FechaDeuda > finMes)
        {
            return false;
        }

        // 2. Si fue cancelada al 100%, verificar fecha del último pago que completó el saldo
        var pagosValidos = (d.Pagos ?? Enumerable.Empty<Pago>())
            .Where(p => p.Activo)
            .OrderBy(p => p.FechaPago)
            .ToList();

        var totalPagado = pagosValidos.Sum(p => p.Monto);

        if (totalPagado >= d.Monto)
        {
            decimal acumulado = 0;
            DateTime fechaCancelacion = d.FechaDeuda;

            foreach (var p in pagosValidos)
            {
                acumulado += p.Monto;
                if (acumulado >= d.Monto)
                {
                    fechaCancelacion = p.FechaPago;
                    break;
                }
            }

            // Si se canceló en un mes estrictamente previo al mes consultado:
            if (fechaCancelacion < inicioMes)
            {
                return false;
            }
        }

        return true;
    }
}
