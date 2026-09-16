using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using PayTrack.Api.Common;
using PayTrack.Api.Data;

namespace PayTrack.Api.Features.Proveedores;

public class EliminarProveedor : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/proveedores/{id:int}", Handler)
           .WithName("EliminarProveedor")
           .WithTags("Proveedores");
    }

    public static async Task<IResult> Handler(int id, PayTrackDbContext db)
    {
        var proveedor = await db.Proveedores.FindAsync(id);
        if (proveedor == null || !proveedor.Activo)
        {
            return Results.NotFound(new { error = true, code = "PROVEEDOR_NO_ENCONTRADO", message = "Proveedor no encontrado." });
        }

        proveedor.Activo = false;
        proveedor.FechaBaja = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Results.Ok(new { message = "Proveedor dado de baja correctamente." });
    }
}
