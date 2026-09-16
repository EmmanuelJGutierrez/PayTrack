using PayTrack.Api.Domain.Shared;
using Xunit;

namespace PayTrack.Tests.Unit;

public class EstadoColorCalculatorTests
{
    [Fact]
    public void Calcular_SinDeudas_DebeRetornarGrisYSinDeuda()
    {
        // Arrange
        decimal totalDeuda = 0m;
        decimal totalPagado = 0m;

        // Act
        var (porcentaje, color, texto) = EstadoColorCalculator.Calcular(totalDeuda, totalPagado);

        // Assert
        Assert.Equal(0, porcentaje);
        Assert.Equal("gris", color);
        Assert.Equal("Sin deuda", texto);
    }

    [Theory]
    [InlineData(1000, 1000)]
    [InlineData(48000, 48000)]
    [InlineData(500, 600)] // Aunque anti-excedente no lo permita, si ocurre debe ser 100%
    public void Calcular_DeudaTotalmentePagada_DebeRetornarVerdeYSaldado(decimal deuda, decimal pagado)
    {
        // Act
        var (porcentaje, color, texto) = EstadoColorCalculator.Calcular(deuda, pagado);

        // Assert
        Assert.Equal(100, porcentaje);
        Assert.Equal("verde", color);
        Assert.Equal("Saldado", texto);
    }

    [Theory]
    [InlineData(1000, 500, 50)]
    [InlineData(1000, 750, 75)]
    [InlineData(57600, 48000, 83)] // Caso Servicios Gamma Corp. del Figma
    public void Calcular_DeudaParcialmentePagada_DebeRetornarAmarilloYParcial(decimal deuda, decimal pagado, int esperadoPorcentaje)
    {
        // Act
        var (porcentaje, color, texto) = EstadoColorCalculator.Calcular(deuda, pagado);

        // Assert
        Assert.Equal(esperadoPorcentaje, porcentaje);
        Assert.Equal("amarillo", color);
        Assert.Equal("Parcial", texto);
    }

    [Theory]
    [InlineData(1000, 0, 0)]
    [InlineData(1000, 499, 50)] // 49.9% redondea a 50 o menos
    [InlineData(20000, 0, 0)]  // Caso Proveedor Alfa S.A.
    [InlineData(140000, 0, 0)] // Caso Importaciones Delta
    public void Calcular_DeudaMayoritariaPendiente_DebeRetornarRojoYPendiente(decimal deuda, decimal pagado, int maxPorcentaje)
    {
        // Act
        var (porcentaje, color, texto) = EstadoColorCalculator.Calcular(deuda, pagado);

        // Assert
        if (pagado == 0)
        {
            Assert.Equal(0, porcentaje);
            Assert.Equal("rojo", color);
            Assert.Equal("Pendiente", texto);
        }
        else
        {
            Assert.True(porcentaje <= maxPorcentaje);
        }
    }
}
