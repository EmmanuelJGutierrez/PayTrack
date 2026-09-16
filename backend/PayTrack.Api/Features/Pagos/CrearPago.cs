using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Common;
using PayTrack.Api.Data;
using PayTrack.Api.Domain;

namespace PayTrack.Api.Features.Pagos;

public class CrearPago : IEndpoint
{
    public record Request(decimal Monto, string MedioPago, string? Referencia, string? Comentario, DateTime? FechaPago, int? DeudaId);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/proveedores/{id:int}/pagos", Handler)
           .WithName("CrearPago")
           .WithTags("Pagos");
    }

    public static async Task<IResult> Handler(int id, PayTrackDbContext db, Request req)
    {
        var proveedor = await db.Proveedores
            .Include(p => p.Deudas)
            .Include(p => p.Pagos)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == id && p.Activo);

        if (proveedor == null)
        {
            return Results.NotFound(new { error = true, code = "PROVEEDOR_NO_ENCONTRADO", message = "Proveedor no encontrado." });
        }

        if (req.Monto <= 0)
        {
            return Results.BadRequest(new { error = true, code = "MONTO_INVALIDO", message = "El monto a pagar debe ser mayor a cero." });
        }

        if (!Enum.TryParse<MedioPago>(req.MedioPago, true, out var medio))
        {
            return Results.BadRequest(new { error = true, code = "MEDIO_PAGO_INVALIDO", message = "Medio de pago no válido." });
        }

        var totalDeudasActivas = proveedor.Deudas.Where(d => d.Activo).Sum(d => d.Monto);
        var totalPagosActivos = proveedor.Pagos.Where(p => p.Activo).Sum(p => p.Monto);
        var saldoProveedor = Math.Max(0, totalDeudasActivas - totalPagosActivos);

        // Validación si se imputa a una deuda puntual
        Deuda? deudaPuntual = null;
        if (req.DeudaId.HasValue)
        {
            deudaPuntual = proveedor.Deudas.FirstOrDefault(d => d.Id == req.DeudaId.Value && d.Activo);
            if (deudaPuntual == null)
            {
                return Results.BadRequest(new { error = true, code = "DEUDA_INVALIDA", message = "La deuda especificada no existe para este proveedor o fue eliminada." });
            }

            var pagosDeuda = await db.Pagos.Where(p => p.DeudaId == deudaPuntual.Id && p.Activo).SumAsync(p => p.Monto);
            var saldoDeuda = Math.Max(0, deudaPuntual.Monto - pagosDeuda);

            if (req.Monto > saldoDeuda)
            {
                return Results.BadRequest(new
                {
                    error = true,
                    code = "PAGO_EXCEDE_SALDO",
                    message = $"El pago (${req.Monto:N2}) supera el saldo pendiente de esta deuda (${saldoDeuda:N2}). No se permiten pagos excedentes."
                });
            }
        }

        // Validación general contra el saldo total del proveedor
        if (req.Monto > saldoProveedor)
        {
            return Results.BadRequest(new
            {
                error = true,
                code = "PAGO_EXCEDE_SALDO",
                message = $"El pago (${req.Monto:N2}) supera el saldo pendiente total del proveedor (${saldoProveedor:N2}). No se permiten pagos excedentes."
            });
        }

        var pago = new Pago
        {
            ProveedorId = id,
            DeudaId = req.DeudaId,
            Monto = Math.Round(req.Monto, 2),
            MedioPago = medio,
            Referencia = req.Referencia?.Trim(),
            Comentario = req.Comentario?.Trim(),
            FechaPago = req.FechaPago ?? DateTime.UtcNow,
            FechaCreacion = DateTime.UtcNow
        };

        db.Pagos.Add(pago);
        await db.SaveChangesAsync();

        return Results.Created($"/api/proveedores/{id}/pagos/{pago.Id}", pago);
    }
}
