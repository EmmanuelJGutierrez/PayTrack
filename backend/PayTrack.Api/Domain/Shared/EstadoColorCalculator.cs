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

        var porcentaje = (int)Math.Clamp(Math.Round((totalPagado / totalDeuda) * 100), 0, 100);

        if (porcentaje >= 100)
        {
            return (100, "verde", "Saldado");
        }
        if (porcentaje >= 50)
        {
            return (porcentaje, "amarillo", "Parcial");
        }
        return (porcentaje, "rojo", "Pendiente");
    }
}
