using System;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Common;
using PayTrack.Api.Data;

namespace PayTrack.Api.Features.Backup;

public class BackupEndpoints : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/backup").WithTags("Backup");

        group.MapGet("/info", ObtenerInfoHandler).WithName("ObtenerInfoBackup");
        group.MapGet("/descargar", DescargarHandler).WithName("DescargarBackup");
        group.MapGet("/export", DescargarHandler); // Alias conveniente
        group.MapPost("/restaurar", RestaurarHandler).WithName("RestaurarBackup").DisableAntiforgery();
    }

    public static async Task<IResult> ObtenerInfoHandler(PayTrackDbContext db)
    {
        var conn = (SqliteConnection)db.Database.GetDbConnection();
        var dbPath = conn.DataSource;

        long fileSize = 0;
        DateTime lastModified = DateTime.UtcNow;

        if (File.Exists(dbPath))
        {
            var fileInfo = new FileInfo(dbPath);
            fileSize = fileInfo.Length;
            lastModified = fileInfo.LastWriteTimeUtc;
        }

        var totalProveedores = await db.Proveedores.CountAsync(p => p.Activo);
        var totalDeudas = await db.Deudas.CountAsync(d => d.Activo);
        var totalPagos = await db.Pagos.CountAsync(p => p.Activo);

        string formattedSize = fileSize switch
        {
            < 1024 => $"{fileSize} B",
            < 1024 * 1024 => $"{fileSize / 1024.0:F1} KB",
            _ => $"{fileSize / (1024.0 * 1024.0):F2} MB"
        };

        return Results.Ok(new
        {
            databasePath = dbPath,
            tamanoBytes = fileSize,
            tamanoFormateado = formattedSize,
            ultimaModificacion = lastModified,
            totalProveedores,
            totalDeudas,
            totalPagos
        });
    }

    public static async Task<IResult> DescargarHandler(PayTrackDbContext db)
    {
        var conn = (SqliteConnection)db.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync();
        }

        // Ejecutar checkpoint de WAL para asegurar que todas las transacciones estén escritas
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "PRAGMA wal_checkpoint(FULL);";
            try { await cmd.ExecuteNonQueryAsync(); } catch { /* Si no está en WAL, no pasa nada */ }
        }

        var tempPath = Path.Combine(Path.GetTempPath(), $"PayTrack_Backup_{Guid.NewGuid():N}.db");

        // Backup atómico usando la API nativa de SQLite (Pooling=False para liberar el archivo al cerrar)
        using (var destination = new SqliteConnection($"Data Source={tempPath};Pooling=False;"))
        {
            await destination.OpenAsync();
            conn.BackupDatabase(destination);
            await destination.CloseAsync();
        }

        byte[] fileBytes;
        using (var fs = new FileStream(tempPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
        {
            using var ms = new MemoryStream();
            await fs.CopyToAsync(ms);
            fileBytes = ms.ToArray();
        }

        try { File.Delete(tempPath); } catch { /* Ignorar limpieza temporal */ }

        var fileName = $"PayTrack_CopiaSeguridad_{DateTime.Now:yyyy-MM-dd_HHmm}.db";
        return Results.File(fileBytes, "application/octet-stream", fileName);
    }

    public static async Task<IResult> RestaurarHandler(IFormFile? file, PayTrackDbContext db)
    {
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new { error = true, code = "ARCHIVO_VACIO", message = "No se ha seleccionado ningún archivo de copia de seguridad." });
        }

        // Validar encabezado mágico de SQLite ("SQLite format 3\0")
        var header = new byte[16];
        using (var stream = file.OpenReadStream())
        {
            var read = await stream.ReadAsync(header.AsMemory(0, 16));
            if (read < 16)
            {
                return Results.BadRequest(new { error = true, code = "ARCHIVO_INVALIDO", message = "El archivo es demasiado pequeño para ser una base de datos válida." });
            }
        }

        var headerString = Encoding.ASCII.GetString(header);
        if (!headerString.StartsWith("SQLite format 3"))
        {
            return Results.BadRequest(new { error = true, code = "FORMATO_INCORRECTO", message = "El archivo seleccionado no es una base de datos válida de SQLite (debe comenzar con 'SQLite format 3')." });
        }

        // Guardar temporalmente para verificar integridad
        var tempUploaded = Path.Combine(Path.GetTempPath(), $"PayTrack_Restore_{Guid.NewGuid():N}.db");
        using (var fs = new FileStream(tempUploaded, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(fs);
        }

        int restoredProveedores = 0;
        int restoredDeudas = 0;
        int restoredPagos = 0;

        try
        {
            // Validar integridad física y lógica del archivo subido (Pooling=False para liberar el archivo al cerrar)
            using (var testConn = new SqliteConnection($"Data Source={tempUploaded};Pooling=False;"))
            {
                await testConn.OpenAsync();
                using var cmd = testConn.CreateCommand();

                cmd.CommandText = "PRAGMA integrity_check;";
                var integrity = (string?)await cmd.ExecuteScalarAsync();
                if (integrity != "ok")
                {
                    return Results.BadRequest(new { error = true, code = "INTEGRIDAD_FALLIDA", message = "El archivo de base de datos está corrupto o dañado." });
                }

                cmd.CommandText = "SELECT count(*) FROM sqlite_master WHERE type='table' AND name IN ('Proveedores', 'Deudas', 'Pagos');";
                var tableCount = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                if (tableCount < 3)
                {
                    return Results.BadRequest(new { error = true, code = "TABLAS_FALTANTES", message = "El archivo no contiene la estructura de tablas de PayTrack (Proveedores, Deudas, Pagos)." });
                }

                cmd.CommandText = "SELECT count(*) FROM Proveedores;";
                restoredProveedores = Convert.ToInt32(await cmd.ExecuteScalarAsync());

                cmd.CommandText = "SELECT count(*) FROM Deudas;";
                restoredDeudas = Convert.ToInt32(await cmd.ExecuteScalarAsync());

                cmd.CommandText = "SELECT count(*) FROM Pagos;";
                restoredPagos = Convert.ToInt32(await cmd.ExecuteScalarAsync());

                await testConn.CloseAsync();
            }

            // Proceder al reemplazo de la base actual
            var currentConn = (SqliteConnection)db.Database.GetDbConnection();
            var targetPath = currentConn.DataSource;

            if (targetPath == ":memory:" || string.IsNullOrEmpty(targetPath))
            {
                // En pruebas en memoria, restaurar vía BackupDatabase
                if (currentConn.State != ConnectionState.Open) await currentConn.OpenAsync();
                using var srcConn = new SqliteConnection($"Data Source={tempUploaded};Pooling=False;");
                await srcConn.OpenAsync();
                srcConn.BackupDatabase(currentConn);
                await srcConn.CloseAsync();
            }
            else
            {
                // Limpiar pools de conexión para liberar el bloqueo de archivo
                SqliteConnection.ClearAllPools();

                // Crear respaldo automático previo por seguridad
                var autoBackupPath = targetPath + ".bak_auto";
                if (File.Exists(targetPath))
                {
                    File.Copy(targetPath, autoBackupPath, overwrite: true);
                }

                // Reemplazar archivo destino
                File.Copy(tempUploaded, targetPath, overwrite: true);
                SqliteConnection.ClearAllPools();
            }

            return Results.Ok(new
            {
                message = "Copia de seguridad restaurada correctamente.",
                totalProveedores = restoredProveedores,
                totalDeudas = restoredDeudas,
                totalPagos = restoredPagos
            });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error al restaurar la base de datos: {ex.Message}");
        }
        finally
        {
            try { File.Delete(tempUploaded); } catch { }
        }
    }
}
