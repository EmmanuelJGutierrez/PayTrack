using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Common;
using PayTrack.Api.Data;

namespace PayTrack.Api.Features.Pagos;

public class AnularPago : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/pagos/{id:int}", Handler)
           .WithName("AnularPago")
           .WithTags("Pagos");

        app.MapDelete("/api/proveedores/{provId:int}/pagos/{id:int}", (int provId, int id, PayTrackDbContext db) => Handler(id, db))
           .WithName("AnularPagoProveedor")
           .WithTags("Pagos");
    }

    public static async Task<IResult> Handler(int id, PayTrackDbContext db)
    {
        var pago = await db.Pagos
            .Include(p => p.Deuda)
            .Include(p => p.Proveedor)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pago == null)
        {
            return Results.NotFound(new { error = true, code = "PAGO_NO_ENCONTRADO", message = "El pago no existe." });
        }

        if (!pago.Activo)
        {
            return Results.BadRequest(new { error = true, code = "PAGO_YA_ANULADO", message = "El pago ya se encuentra anulado." });
        }

        pago.Activo = false;
        pago.FechaBaja = DateTime.UtcNow;

        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            message = "Pago anulado correctamente.",
            pagoId = pago.Id,
            montoAnulado = pago.Monto,
            proveedorId = pago.ProveedorId,
            deudaId = pago.DeudaId
        });
    }
}
