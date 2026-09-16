using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Common;
using PayTrack.Api.Data;

namespace PayTrack.Api.Features.Historial;

public class ObtenerHistorialProveedor : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/proveedores/{id:int}/historial", Handler)
           .WithName("ObtenerHistorialProveedor")
           .WithTags("Historial");
    }

    public static async Task<IResult> Handler(int id, PayTrackDbContext db)
    {
        var deudas = await db.Deudas
            .Where(d => d.ProveedorId == id)
            .Select(d => new
            {
                tipoMovimiento = "Deuda",
                d.Id,
                d.Monto,
                d.Concepto,
                TipoComprobante = (string?)d.TipoComprobante.ToString(),
                d.NumeroComprobante,
                MedioPago = (string?)null,
                Referencia = (string?)null,
                Fecha = d.FechaDeuda,
                d.Activo
            })
            .ToListAsync();

        var pagos = await db.Pagos
            .Where(p => p.ProveedorId == id)
            .Select(p => new
            {
                tipoMovimiento = "Pago",
                p.Id,
                p.Monto,
                Concepto = p.Comentario ?? "Pago a cuenta",
                TipoComprobante = (string?)null,
                NumeroComprobante = (string?)null,
                MedioPago = (string?)p.MedioPago.ToString(),
                p.Referencia,
                Fecha = p.FechaPago,
                p.Activo
            })
            .ToListAsync();

        var timeline = deudas.Concat(pagos)
            .OrderByDescending(x => x.Fecha)
            .ToList();

        return Results.Ok(timeline);
    }
}
