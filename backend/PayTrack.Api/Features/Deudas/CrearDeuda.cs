using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Common;
using PayTrack.Api.Data;
using PayTrack.Api.Domain;

namespace PayTrack.Api.Features.Deudas;

public class CrearDeuda : IEndpoint
{
    public record Request(
        decimal Monto,
        string Concepto,
        string TipoComprobante,
        string? NumeroComprobante,
        DateTime? FechaDeuda,
        DateTime? FechaVencimiento
    );

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/proveedores/{id:int}/deudas", Handler)
           .WithName("CrearDeuda")
           .WithTags("Deudas");
    }

    public static async Task<IResult> Handler(int id, PayTrackDbContext db, Request req)
    {
        var proveedor = await db.Proveedores.FindAsync(id);
        if (proveedor == null || !proveedor.Activo)
        {
            return Results.NotFound(new { error = true, code = "PROVEEDOR_NO_ENCONTRADO", message = "El proveedor no existe o está inactivo." });
        }

        if (req.Monto <= 0)
        {
            return Results.BadRequest(new { error = true, code = "MONTO_INVALIDO", message = "El monto debe ser mayor a 0." });
        }

        if (string.IsNullOrWhiteSpace(req.Concepto) || req.Concepto.Trim().Length < 3)
        {
            return Results.BadRequest(new { error = true, code = "CONCEPTO_INVALIDO", message = "El concepto es obligatorio (mínimo 3 caracteres)." });
        }

        if (!Enum.TryParse<TipoComprobante>(req.TipoComprobante, true, out var tipo))
        {
            return Results.BadRequest(new { error = true, code = "TIPO_COMPROBANTE_INVALIDO", message = "El tipo de comprobante debe ser 'Remito' o 'Factura'." });
        }

        DateTime fechaFinal;
        if (req.FechaDeuda.HasValue)
        {
            if (req.FechaDeuda.Value.Date == DateTime.UtcNow.Date)
            {
                fechaFinal = DateTime.UtcNow;
            }
            else
            {
                fechaFinal = req.FechaDeuda.Value;
            }
        }
        else
        {
            fechaFinal = DateTime.UtcNow;
        }

        var deuda = new Deuda
        {
            ProveedorId = id,
            Monto = Math.Round(req.Monto, 2),
            Concepto = req.Concepto.Trim(),
            TipoComprobante = tipo,
            NumeroComprobante = req.NumeroComprobante?.Trim(),
            FechaDeuda = fechaFinal,
            FechaVencimiento = req.FechaVencimiento,
            FechaCreacion = DateTime.UtcNow
        };

        db.Deudas.Add(deuda);
        await db.SaveChangesAsync();

        return Results.Created($"/api/proveedores/{id}/deudas/{deuda.Id}", deuda);
    }
}
