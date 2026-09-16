using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using PayTrack.Api.Common;
using PayTrack.Api.Data;

namespace PayTrack.Api.Features.Proveedores;

public class ReactivarProveedor : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/proveedores/{id:int}/reactivar", Handler)
           .WithName("ReactivarProveedor")
           .WithTags("Proveedores");
    }

    public static async Task<IResult> Handler(int id, PayTrackDbContext db)
    {
        var proveedor = await db.Proveedores.FindAsync(id);
        if (proveedor == null)
        {
            return Results.NotFound(new { error = true, code = "PROVEEDOR_NO_ENCONTRADO", message = "Proveedor no encontrado." });
        }

        if (proveedor.Activo)
        {
            return Results.BadRequest(new { error = true, code = "PROVEEDOR_YA_ACTIVO", message = "El proveedor ya se encuentra activo." });
        }

        proveedor.Activo = true;
        proveedor.FechaBaja = null;

        await db.SaveChangesAsync();
        return Results.Ok(new { message = "Proveedor reactivado correctamente.", proveedor });
    }
}
