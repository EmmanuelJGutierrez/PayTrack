using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Data;

namespace PayTrack.Api.Services;

public record ProveedorResumenDto(
    int Id,
    string Nombre,
    string? Contacto,
    string? Notas,
    bool Activo,
    int CantidadDeudas,
    decimal TotalDeudas,
    decimal TotalPagado,
    decimal SaldoPendiente,
    decimal PagadoEsteMes,
    int PorcentajeSaldado,
    string ColorEstado, // "verde" | "amarillo" | "rojo" | "gris"
    string EstadoTexto   // "Saldado" | "Parcial" | "Pendiente" | "Sin deuda"
);

public record DeudaResumenDto(
    int Id,
    int ProveedorId,
    decimal Monto,
    string Concepto,
    string TipoComprobante, // "Remito" | "Factura"
    string? NumeroComprobante,
    DateTime FechaDeuda,
    bool Activo,
    decimal TotalPagado,
    decimal SaldoPendiente,
    decimal PagadoEsteMes,
    int PorcentajeSaldado,
    string ColorEstado
);

public class ProveedorEstadoService
{
    private readonly PayTrackDbContext _db;

    public ProveedorEstadoService(PayTrackDbContext db)
    {
        _db = db;
    }

    public static (int porcentaje, string color, string texto) CalcularEstado(decimal totalDeuda, decimal totalPagado)
    {
        if (totalDeuda <= 0)
        {
            return (0, "gris", "Sin deuda");
        }

        var porcentaje = (int)Math.Clamp(Math.Round((totalPagado / totalDeuda) * 100), 0, 100);

        if (porcentaje >= 100)
        {
            return (100, "verde", "Saldado");
        }
        if (porcentaje >= 50)
        {
            return (porcentaje, "amarillo", "Parcial");
        }
        return (porcentaje, "rojo", "Pendiente");
    }

    public async Task<List<ProveedorResumenDto>> ObtenerProveedoresResumenAsync(int anio, int mes, string? buscar = null, bool incluirInactivos = false)
    {
        var query = _db.Proveedores
            .Include(p => p.Deudas)
            .Include(p => p.Pagos)
            .AsQueryable();

        if (!incluirInactivos)
        {
            query = query.Where(p => p.Activo);
        }

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var term = buscar.Trim().ToLower();
            query = query.Where(p => p.Nombre.ToLower().Contains(term) || (p.Contacto != null && p.Contacto.ToLower().Contains(term)));
        }

        var proveedores = await query.ToListAsync();

        var lista = new List<ProveedorResumenDto>();

        foreach (var p in proveedores)
        {
            var deudasActivas = p.Deudas.Where(d => d.Activo).ToList();
            var pagosActivos = p.Pagos.Where(pg => pg.Activo).ToList();

            var totalDeuda = deudasActivas.Sum(d => d.Monto);
            var totalPagado = pagosActivos.Sum(pg => pg.Monto);
            var saldoPendiente = Math.Max(0, totalDeuda - totalPagado);

            var pagadoEsteMes = pagosActivos
                .Where(pg => pg.FechaPago.Year == anio && pg.FechaPago.Month == mes)
                .Sum(pg => pg.Monto);

            var (porcentaje, color, texto) = CalcularEstado(totalDeuda, totalPagado);

            lista.Add(new ProveedorResumenDto(
                p.Id,
                p.Nombre,
                p.Contacto,
                p.Notas,
                p.Activo,
                deudasActivas.Count,
                totalDeuda,
                totalPagado,
                saldoPendiente,
                pagadoEsteMes,
                porcentaje,
                color,
                texto
            ));
        }

        // Orden por defecto: Mayor saldo pendiente primero
        return lista.OrderByDescending(x => x.SaldoPendiente).ThenBy(x => x.Nombre).ToList();
    }

    public async Task<List<DeudaResumenDto>> ObtenerDeudasResumenAsync(int proveedorId, int anio, int mes)
    {
        var deudas = await _db.Deudas
            .Where(d => d.ProveedorId == proveedorId && d.Activo)
            .Include(d => d.Pagos)
            .OrderByDescending(d => d.FechaDeuda)
            .ToListAsync();

        var lista = new List<DeudaResumenDto>();

        foreach (var d in deudas)
        {
            var pagosActivos = d.Pagos.Where(pg => pg.Activo).ToList();
            var totalPagado = pagosActivos.Sum(pg => pg.Monto);
            var saldoPendiente = Math.Max(0, d.Monto - totalPagado);

            var pagadoEsteMes = pagosActivos
                .Where(pg => pg.FechaPago.Year == anio && pg.FechaPago.Month == mes)
                .Sum(pg => pg.Monto);

            var (porcentaje, color, _) = CalcularEstado(d.Monto, totalPagado);

            lista.Add(new DeudaResumenDto(
                d.Id,
                d.ProveedorId,
                d.Monto,
                d.Concepto,
                d.TipoComprobante.ToString(),
                d.NumeroComprobante,
                d.FechaDeuda,
                d.Activo,
                totalPagado,
                saldoPendiente,
                pagadoEsteMes,
                porcentaje,
                color
            ));
        }

        return lista;
    }
}
