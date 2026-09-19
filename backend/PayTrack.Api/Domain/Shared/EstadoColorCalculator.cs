using System;

namespace PayTrack.Api.Domain.Shared;

public static class EstadoColorCalculator
{
    public static (int porcentaje, string color, string texto) Calcular(decimal totalDeuda, decimal totalPagado)
    {
        if (totalDeuda <= 0)
        {
            return (0, "gris", "Sin deuda");
        }

        // Si el total pagado cubre o supera el total de la deuda, está Saldado al 100%
        if (totalPagado >= totalDeuda)
        {
            return (100, "verde", "Saldado");
        }

        // Si todavía resta saldo pendiente por pagar (aunque sea $1),
        // el porcentaje NUNCA debe redondear hacia arriba a 100% ni dar status Saldado.
        var rawPorcentaje = (int)Math.Round((totalPagado / totalDeuda) * 100);
        var porcentaje = Math.Clamp(rawPorcentaje >= 100 ? 99 : rawPorcentaje, 0, 99);

        if (porcentaje >= 50)
        {
            return (porcentaje, "amarillo", "Parcial");
        }
        return (porcentaje, "rojo", "Pendiente");
    }
}
