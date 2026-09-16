using System;
using System.Collections.Generic;

namespace PayTrack.Api.Domain;

public enum TipoComprobante
{
    Remito,
    Factura
}

public class Deuda
{
    public int Id { get; set; }
    public int ProveedorId { get; set; }
    public Proveedor Proveedor { get; set; } = null!;

    public decimal Monto { get; set; }
    public string Concepto { get; set; } = string.Empty;
    public TipoComprobante TipoComprobante { get; set; } = TipoComprobante.Factura;
    public string? NumeroComprobante { get; set; }
    public DateTime FechaDeuda { get; set; }
    public DateTime? FechaVencimiento { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime? FechaBaja { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Relaciones
    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
}
