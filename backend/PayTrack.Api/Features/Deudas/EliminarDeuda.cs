using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Common;
using PayTrack.Api.Data;

namespace PayTrack.Api.Features.Deudas;

public class EliminarDeuda : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/proveedores/{id:int}/deudas/{deudaId:int}", Handler)
           .WithName("EliminarDeuda")
           .WithTags("Deudas");
    }

    public static async Task<IResult> Handler(int id, int deudaId, PayTrackDbContext db)
    {
        var deuda = await db.Deudas.FirstOrDefaultAsync(d => d.Id == deudaId && d.ProveedorId == id && d.Activo);
        if (deuda == null)
        {
            return Results.NotFound(new { error = true, code = "DEUDA_NO_ENCONTRADA", message = "Deuda no encontrada." });
        }

        deuda.Activo = false;
        deuda.FechaBaja = DateTime.UtcNow;

        // Inactivar también los pagos asociados a esta deuda para que no afecten el saldo de otras deudas
        var pagosDeuda = await db.Pagos.Where(p => p.DeudaId == deudaId && p.Activo).ToListAsync();
        foreach (var p in pagosDeuda)
        {
            p.Activo = false;
            p.FechaBaja = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return Results.Ok(new { message = "Deuda eliminada correctamente." });
    }
}
