using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Common;
using PayTrack.Api.Data;

namespace PayTrack.Api.Features.Proveedores;

public class ActualizarProveedor : IEndpoint
{
    public record Request(string Nombre, string? Contacto, string? Notas);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/proveedores/{id:int}", Handler)
           .WithName("ActualizarProveedor")
           .WithTags("Proveedores");
    }

    public static async Task<IResult> Handler(int id, PayTrackDbContext db, Request req)
    {
        var proveedor = await db.Proveedores.FindAsync(id);
        if (proveedor == null || !proveedor.Activo)
        {
            return Results.NotFound(new { error = true, code = "PROVEEDOR_NO_ENCONTRADO", message = "Proveedor no encontrado o inactivo." });
        }

        if (string.IsNullOrWhiteSpace(req.Nombre) || req.Nombre.Trim().Length < 2)
        {
            return Results.BadRequest(new { error = true, code = "NOMBRE_INVALIDO", message = "El nombre del proveedor es obligatorio." });
        }

        var nombreNorm = req.Nombre.Trim();
        var duplicado = await db.Proveedores.AnyAsync(p => p.Id != id && p.Activo && p.Nombre.ToLower() == nombreNorm.ToLower());
        if (duplicado)
        {
            return Results.Conflict(new { error = true, code = "PROVEEDOR_NOMBRE_DUPLICADO", message = "Ya existe otro proveedor activo con ese nombre." });
        }

        proveedor.Nombre = nombreNorm;
        proveedor.Contacto = req.Contacto?.Trim();
        proveedor.Notas = req.Notas?.Trim();

        await db.SaveChangesAsync();
        return Results.Ok(proveedor);
    }
}
