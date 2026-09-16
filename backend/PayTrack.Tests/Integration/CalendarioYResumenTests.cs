using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace PayTrack.Tests.Integration;

public class CalendarioYResumenTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public CalendarioYResumenTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ObtenerCalendarioMensual_DebeRetornarDiasConMovimientos()
    {
        var response = await _client.GetAsync("/api/calendario?anio=2026&mes=7&tzOffset=0");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var dias = doc.RootElement.GetProperty("dias");

        Assert.Equal(31, dias.GetArrayLength());
    }

    [Fact]
    public async Task ObtenerDetalleDia_Dia12Julio_DebeContenerPagoGamma()
    {
        var response = await _client.GetAsync("/api/calendario/2026/7/12");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.Equal(12000m, root.GetProperty("totalPagos").GetDecimal());
        var movimientos = root.GetProperty("movimientos");
        Assert.True(movimientos.GetArrayLength() >= 1);
    }

    [Fact]
    public async Task ResumenMensual_Julio2026_DebeCalcularTotalesYMedioPago()
    {
        var response = await _client.GetAsync("/api/pagos/resumen-mensual?anio=2026&mes=7");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.True(root.GetProperty("totalPagado").GetDecimal() >= 12000m);
        Assert.True(root.GetProperty("porMedioPago").TryGetProperty("Transferencia", out var trf));
        Assert.True(trf.GetDecimal() >= 12000m);
        Assert.True(root.TryGetProperty("pagos", out var pagosArray));
        Assert.True(pagosArray.GetArrayLength() >= 1);
    }
}
