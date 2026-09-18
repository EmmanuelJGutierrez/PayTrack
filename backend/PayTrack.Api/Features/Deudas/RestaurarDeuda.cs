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

public class RestaurarDeuda : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/proveedores/{id:int}/deudas/{deudaId:int}/restaurar", Handler)
           .WithName("RestaurarDeuda")
           .WithTags("Deudas");

        app.MapPost("/api/deudas/{deudaId:int}/restaurar", (int deudaId, PayTrackDbContext db) => Handler(0, deudaId, db, true))
           .WithName("RestaurarDeudaDirecto")
           .WithTags("Deudas");
    }

    public static async Task<IResult> Handler(int id, int deudaId, PayTrackDbContext db, bool ignorarProveedor = false)
    {
        var deuda = await db.Deudas.FirstOrDefaultAsync(d => d.Id == deudaId && (ignorarProveedor || d.ProveedorId == id));
        if (deuda == null)
        {
            return Results.NotFound(new { error = true, code = "DEUDA_NO_ENCONTRADA", message = "Deuda no encontrada." });
        }

        if (deuda.Activo)
        {
            return Results.BadRequest(new { error = true, code = "DEUDA_YA_ACTIVA", message = "La deuda ya se encuentra activa." });
        }

        deuda.Activo = true;
        deuda.FechaBaja = null;

        // Restaurar también los pagos asociados a esta deuda
        var pagosDeuda = await db.Pagos.Where(p => p.DeudaId == deudaId && !p.Activo).ToListAsync();
        foreach (var p in pagosDeuda)
        {
            p.Activo = true;
            p.FechaBaja = null;
        }

        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            message = "Deuda restaurada correctamente.",
            deudaId = deuda.Id,
            proveedorId = deuda.ProveedorId,
            monto = deuda.Monto,
            concepto = deuda.Concepto
        });
    }
}
