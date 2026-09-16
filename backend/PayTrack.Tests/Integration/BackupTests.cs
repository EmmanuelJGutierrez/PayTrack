using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace PayTrack.Tests.Integration;

public class BackupTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public BackupTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ObtenerInfoBackup_DebeRetornarTotalesValidos()
    {
        var response = await _client.GetAsync("/api/backup/info");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("totalProveedores", out var provs) && provs.GetInt32() >= 1);
        Assert.True(root.TryGetProperty("totalDeudas", out _));
        Assert.True(root.TryGetProperty("tamanoFormateado", out _));
    }

    [Fact]
    public async Task DescargarBackup_DebeRetornarArchivoSqliteValido()
    {
        var response = await _client.GetAsync("/api/backup/descargar");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.True(bytes.Length > 100);

        var header = Encoding.ASCII.GetString(bytes, 0, 15);
        Assert.Equal("SQLite format 3", header);
    }

    [Fact]
    public async Task RestaurarBackup_ArchivoTextoInvalido_DebeRetornar400()
    {
        using var content = new MultipartFormDataContent();
        var fakeBytes = Encoding.UTF8.GetBytes("Esto no es una base de datos");
        var byteContent = new ByteArrayContent(fakeBytes);
        byteContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        content.Add(byteContent, "file", "fake.db");

        var response = await _client.PostAsync("/api/backup/restaurar", content);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("FORMATO_INCORRECTO", body);
    }

    [Fact]
    public async Task RestaurarBackup_CopiaValida_DebeRetornar200()
    {
        // 1. Descargar backup actual
        var backupRes = await _client.GetAsync("/api/backup/descargar");
        var validBytes = await backupRes.Content.ReadAsByteArrayAsync();

        // 2. Restaurar esa misma copia
        using var content = new MultipartFormDataContent();
        var byteContent = new ByteArrayContent(validBytes);
        byteContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        content.Add(byteContent, "file", "PayTrack_Backup.db");

        var restoreRes = await _client.PostAsync("/api/backup/restaurar", content);
        Assert.Equal(HttpStatusCode.OK, restoreRes.StatusCode);

        var body = await restoreRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        Assert.True(root.GetProperty("totalProveedores").GetInt32() >= 1);
    }
}
