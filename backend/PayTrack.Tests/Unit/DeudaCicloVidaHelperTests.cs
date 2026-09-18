using System;
using System.Collections.Generic;
using PayTrack.Api.Domain;
using PayTrack.Api.Domain.Shared;
using Xunit;

namespace PayTrack.Tests.Unit;

public class DeudaCicloVidaHelperTests
{
    [Fact]
    public void Deuda_EmitidaEnSeptiembre_NoDebeEstarVigenteEnJulio()
    {
        var deuda = new Deuda
        {
            Monto = 10000m,
            Activo = true,
            FechaDeuda = new DateTime(2026, 9, 16, 0, 0, 0, DateTimeKind.Utc)
        };

        var visibleEnJulio = DeudaCicloVidaHelper.EstaVigenteEnMes(deuda, 2026, 7);
        Assert.False(visibleEnJulio);
    }

    [Fact]
    public void Deuda_EmitidaEnSeptiembre_DebeEstarVigenteEnSeptiembre()
    {
        var deuda = new Deuda
        {
            Monto = 10000m,
            Activo = true,
            FechaDeuda = new DateTime(2026, 9, 16, 0, 0, 0, DateTimeKind.Utc)
        };

        var visibleEnSeptiembre = DeudaCicloVidaHelper.EstaVigenteEnMes(deuda, 2026, 9);
        Assert.True(visibleEnSeptiembre);
    }

    [Fact]
    public void Deuda_ConSaldoPendiente_DebeEstarVigenteEnMesesFuturos()
    {
        var deuda = new Deuda
        {
            Monto = 10000m,
            Activo = true,
            FechaDeuda = new DateTime(2026, 9, 16, 0, 0, 0, DateTimeKind.Utc),
            Pagos = new List<Pago>
            {
                new Pago { Monto = 4000m, Activo = true, FechaPago = new DateTime(2026, 9, 20, 0, 0, 0, DateTimeKind.Utc) }
            }
        };

        // En noviembre (futuro), la deuda sigue debiéndose ($6.000 pendientes)
        var visibleEnNoviembre = DeudaCicloVidaHelper.EstaVigenteEnMes(deuda, 2026, 11);
        Assert.True(visibleEnNoviembre);
    }

    [Fact]
    public void Deuda_CanceladaEnJulio_NoDebeEstarVigenteEnAgosto()
    {
        var deuda = new Deuda
        {
            Monto = 10000m,
            Activo = true,
            FechaDeuda = new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc),
            Pagos = new List<Pago>
            {
                new Pago { Monto = 10000m, Activo = true, FechaPago = new DateTime(2026, 7, 20, 0, 0, 0, DateTimeKind.Utc) }
            }
        };

        // En julio (mes de cancelación) sí debe verse como saldada
        Assert.True(DeudaCicloVidaHelper.EstaVigenteEnMes(deuda, 2026, 7));

        // En agosto (mes posterior a su cancelación completa) no debe aparecer
        Assert.False(DeudaCicloVidaHelper.EstaVigenteEnMes(deuda, 2026, 8));
    }

    [Fact]
    public void Deuda_Inactiva_NoDebeEstarVigente()
    {
        var deuda = new Deuda
        {
            Monto = 10000m,
            Activo = false, // Eliminada lógicamente
            FechaDeuda = new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc)
        };

        Assert.False(DeudaCicloVidaHelper.EstaVigenteEnMes(deuda, 2026, 7));
    }
}
