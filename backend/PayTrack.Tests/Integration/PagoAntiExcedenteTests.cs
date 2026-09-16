using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace PayTrack.Tests.Integration;

public class PagoAntiExcedenteTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PagoAntiExcedenteTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CrearPago_MontoExcedeSaldoProveedor_DebeRetornar400YCodigoPagoExcedeSaldo()
    {
        // Proveedor 1 (Gamma Corp) tiene saldo pendiente de $9,600
        var payload = new
        {
            monto = 50000m,
            medioPago = "Transferencia",
            referencia = "TEST-OVERPAY",
            comentario = "Pago de prueba excedente"
        };

        var response = await _client.PostAsJsonAsync("/api/proveedores/1/pagos", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.True(root.GetProperty("error").GetBoolean());
        Assert.Equal("PAGO_EXCEDE_SALDO", root.GetProperty("code").GetString());
    }

    [Fact]
    public async Task CrearPago_MontoExcedeSaldoDeudaPuntual_DebeRetornar400YCodigoPagoExcedeSaldo()
    {
        // Deuda 2 (Licencia Software ERP) de Gamma Corp tiene saldo pendiente de $9,600
        var payload = new
        {
            monto = 15000m,
            medioPago = "Transferencia",
            deudaId = 2
        };

        var response = await _client.PostAsJsonAsync("/api/proveedores/1/pagos", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.True(root.GetProperty("error").GetBoolean());
        Assert.Equal("PAGO_EXCEDE_SALDO", root.GetProperty("code").GetString());
    }

    [Fact]
    public async Task CrearPago_MontoMenorOIgualASaldo_DebeRetornar201Created()
    {
        // Proveedor 2 (Proveedor Alfa S.A.) tiene saldo de $20,000
        var payload = new
        {
            monto = 5000m,
            medioPago = "Efectivo",
            comentario = "Entrega parcial en efectivo"
        };

        var response = await _client.PostAsJsonAsync("/api/proveedores/2/pagos", payload);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.Equal(5000m, root.GetProperty("monto").GetDecimal());
        Assert.Equal("Efectivo", root.GetProperty("medioPago").GetString());
    }

    [Fact]
    public async Task AnularPago_PagoExistente_DebeRetornar200YAnularCorrectamente()
    {
        // Pago 2 es de Gamma Corp ($12,000)
        var response = await _client.DeleteAsync("/api/pagos/2");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Intentar anularlo de nuevo debe dar 400 PAGO_YA_ANULADO
        var reintento = await _client.DeleteAsync("/api/pagos/2");
        Assert.Equal(HttpStatusCode.BadRequest, reintento.StatusCode);
    }

    [Fact]
    public async Task ListarDeudas_DebeIncluirEstadoVencimiento()
    {
        var response = await _client.GetAsync("/api/proveedores/1/deudas");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var array = doc.RootElement;

        Assert.True(array.GetArrayLength() > 0);
        var primera = array[0];
        Assert.True(primera.TryGetProperty("estadoVencimiento", out _));
    }
}
