using System;
using System.Collections.Generic;

namespace PayTrack.Api.Models;

public class Proveedor
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Contacto { get; set; }
    public string? Notas { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaBaja { get; set; }

    // Relaciones
    public ICollection<Deuda> Deudas { get; set; } = new List<Deuda>();
    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
}
