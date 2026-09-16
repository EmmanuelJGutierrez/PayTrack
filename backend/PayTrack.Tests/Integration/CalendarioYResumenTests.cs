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

    [Fact]
    public async Task Calendario_DebeIncluirVencimientosDeDeudaEnElMesCorrespondiente()
    {
        // 1. Crear una deuda con vencimiento en Noviembre 2026 (dia 16)
        var createReq = new
        {
            monto = 25000m,
            concepto = "Prueba vencimiento en calendario",
            tipoComprobante = "Remito",
            numeroComprobante = "R-9991",
            fechaDeuda = new System.DateTime(2026, 9, 16, 0, 0, 0, System.DateTimeKind.Utc),
            fechaVencimiento = new System.DateTime(2026, 11, 16, 0, 0, 0, System.DateTimeKind.Utc)
        };

        var postRes = await _client.PostAsJsonAsync("/api/proveedores/1/deudas", createReq);
        Assert.Equal(HttpStatusCode.Created, postRes.StatusCode);

        // 2. Consultar calendario de Noviembre 2026
        var calRes = await _client.GetAsync("/api/calendario?anio=2026&mes=11&tzOffset=0");
        Assert.Equal(HttpStatusCode.OK, calRes.StatusCode);

        var calJson = await calRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(calJson);
        var dias = doc.RootElement.GetProperty("dias");

        // Dia 16 de noviembre debe tener cantidadDeudas >= 1 y cantidadVencimientos >= 1
        var dia16 = dias[15]; // Index 15 = Dia 16
        Assert.Equal(16, dia16.GetProperty("dia").GetInt32());
        Assert.True(dia16.GetProperty("cantidadDeudas").GetInt32() >= 1);
        Assert.True(dia16.GetProperty("cantidadVencimientos").GetInt32() >= 1);

        // 3. Consultar detalle del dia 16/11/2026
        var detRes = await _client.GetAsync("/api/calendario/2026/11/16");
        Assert.Equal(HttpStatusCode.OK, detRes.StatusCode);
        var detJson = await detRes.Content.ReadAsStringAsync();
        using var detDoc = JsonDocument.Parse(detJson);
        var detRoot = detDoc.RootElement;

        Assert.True(detRoot.GetProperty("totalDeudas").GetDecimal() >= 25000m);
        Assert.True(detRoot.GetProperty("cantidadVencimientos").GetInt32() >= 1);
    }
}
