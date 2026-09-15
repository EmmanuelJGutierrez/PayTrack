using System;

namespace PayTrack.Api.Models;

public enum MedioPago
{
    Efectivo,
    Transferencia,
    Debito,
    Cheque,
    Otro
}

public class Pago
{
    public int Id { get; set; }
    public int ProveedorId { get; set; }
    public Proveedor Proveedor { get; set; } = null!;

    public int? DeudaId { get; set; }
    public Deuda? Deuda { get; set; }

    public decimal Monto { get; set; }
    public MedioPago MedioPago { get; set; } = MedioPago.Efectivo;
    public string? Referencia { get; set; }
    public string? Comentario { get; set; }
    public DateTime FechaPago { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime? FechaBaja { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
