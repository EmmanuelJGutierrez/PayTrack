using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Common;
using PayTrack.Api.Data;
using PayTrack.Api.Domain;

namespace PayTrack.Api.Features.Proveedores;

public class CrearProveedor : IEndpoint
{
    public record Request(string Nombre, string? Contacto, string? Notas);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/proveedores", Handler)
           .WithName("CrearProveedor")
           .WithTags("Proveedores");
    }

    public static async Task<IResult> Handler(PayTrackDbContext db, Request req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre) || req.Nombre.Trim().Length < 2)
        {
            return Results.BadRequest(new { error = true, code = "NOMBRE_INVALIDO", message = "El nombre del proveedor es obligatorio (mínimo 2 caracteres)." });
        }

        var nombreNorm = req.Nombre.Trim();
        var existe = await db.Proveedores.AnyAsync(p => p.Activo && p.Nombre.ToLower() == nombreNorm.ToLower());
        if (existe)
        {
            return Results.Conflict(new { error = true, code = "PROVEEDOR_NOMBRE_DUPLICADO", message = "Ya existe un proveedor activo con ese nombre." });
        }

        var proveedor = new Proveedor
        {
            Nombre = nombreNorm,
            Contacto = req.Contacto?.Trim(),
            Notas = req.Notas?.Trim(),
            FechaCreacion = DateTime.UtcNow
        };

        db.Proveedores.Add(proveedor);
        await db.SaveChangesAsync();

        return Results.Created($"/api/proveedores/{proveedor.Id}", proveedor);
    }
}
