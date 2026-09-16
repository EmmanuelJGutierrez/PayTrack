using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace PayTrack.Tests.Integration;

public class ProveedorTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ProveedorTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CrearProveedor_ConNombreValido_DebeRetornar201Created()
    {
        var payload = new
        {
            nombre = "Transportes del Sur S.A.",
            contacto = "+54 11 5555-1234",
            notas = "Entrega los días miércoles."
        };

        var response = await _client.PostAsJsonAsync("/api/proveedores", payload);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        Assert.Equal("Transportes del Sur S.A.", doc.RootElement.GetProperty("nombre").GetString());
    }

    [Fact]
    public async Task CrearProveedor_ConNombreDuplicado_DebeRetornar409Conflict()
    {
        // "Servicios Gamma Corp." ya existe en el seed
        var payload = new
        {
            nombre = "servicios gamma corp.",
            contacto = "otro@gamma.com"
        };

        var response = await _client.PostAsJsonAsync("/api/proveedores", payload);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        Assert.Equal("PROVEEDOR_NOMBRE_DUPLICADO", doc.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task EliminarProveedor_DebeRealizarBajaLogicaYPermitirReactivacion()
    {
        // 1. Crear un proveedor exclusivo para este test
        var createPayload = new { nombre = "Proveedor Temporal Test" };
        var createRes = await _client.PostAsJsonAsync("/api/proveedores", createPayload);
        using var createDoc = JsonDocument.Parse(await createRes.Content.ReadAsStringAsync());
        var id = createDoc.RootElement.GetProperty("id").GetInt32();

        // 2. Dar de baja lógica
        var deleteRes = await _client.DeleteAsync($"/api/proveedores/{id}");
        Assert.Equal(HttpStatusCode.OK, deleteRes.StatusCode);

        // 3. Reactivar
        var reactivateRes = await _client.PatchAsync($"/api/proveedores/{id}/reactivar", null);
        Assert.Equal(HttpStatusCode.OK, reactivateRes.StatusCode);

        using var reactDoc = JsonDocument.Parse(await reactivateRes.Content.ReadAsStringAsync());
        var prov = reactDoc.RootElement.GetProperty("proveedor");
        Assert.True(prov.GetProperty("activo").GetBoolean());
    }

    [Fact]
    public async Task EliminarYRestaurarDeuda_DebeCambiarActivoCorrectamente()
    {
        // 1. Crear deuda en Proveedor 1
        var payload = new
        {
            monto = 5000m,
            concepto = "Deuda Para Eliminar y Restaurar",
            tipoComprobante = "Factura"
        };
        var resCrear = await _client.PostAsJsonAsync("/api/proveedores/1/deudas", payload);
        Assert.Equal(HttpStatusCode.Created, resCrear.StatusCode);
        using var docCrear = JsonDocument.Parse(await resCrear.Content.ReadAsStringAsync());
        var deudaId = docCrear.RootElement.GetProperty("id").GetInt32();

        // 2. Eliminar deuda
        var resEliminar = await _client.DeleteAsync($"/api/proveedores/1/deudas/{deudaId}");
        Assert.Equal(HttpStatusCode.OK, resEliminar.StatusCode);

        // 3. Restaurar deuda
        var resRestaurar = await _client.PatchAsync($"/api/proveedores/1/deudas/{deudaId}/restaurar", null);
        Assert.Equal(HttpStatusCode.OK, resRestaurar.StatusCode);
    }
}
