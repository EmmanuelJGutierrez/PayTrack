using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Domain;

namespace PayTrack.Api.Data;

public static class DbInitializer
{
    public static void Initialize(PayTrackDbContext db)
    {
        db.Database.EnsureCreated();

        if (db.Proveedores.Any())
        {
            return;
        }

        var fechaActual = new DateTime(2026, 7, 15, 10, 0, 0, DateTimeKind.Utc);

        var gamma = new Proveedor
        {
            Nombre = "Servicios Gamma Corp.",
            Contacto = "soporte@gammacorp.com | +54 11 4455-6677",
            Notas = "Pasa los días jueves. Pago por transferencia bancaria.",
            FechaCreacion = fechaActual
        };

        var alfa = new Proveedor
        {
            Nombre = "Proveedor Alfa S.A.",
            Contacto = "ventas@alfa.com | +54 11 2233-4455",
            Notas = "Insumos de oficina. Factura A.",
            FechaCreacion = fechaActual
        };

        var beta = new Proveedor
        {
            Nombre = "Distribuidora Beta Ltda.",
            Contacto = "pedidos@beta.com.ar",
            Notas = "Descuento por pronto pago 5%.",
            FechaCreacion = fechaActual
        };

        var delta = new Proveedor
        {
            Nombre = "Importaciones Delta",
            Contacto = "delta.import@gmail.com",
            Notas = "Materia prima importada.",
            FechaCreacion = fechaActual
        };

        db.Proveedores.AddRange(gamma, alfa, beta, delta);
        db.SaveChanges();

        // Deudas de Gamma Corp
        var deudaMantenimiento = new Deuda
        {
            ProveedorId = gamma.Id,
            Monto = 48000m,
            Concepto = "Mantenimiento Anual",
            TipoComprobante = TipoComprobante.Remito,
            NumeroComprobante = "REM-0004-00129",
            FechaDeuda = new DateTime(2026, 7, 1, 9, 0, 0, DateTimeKind.Utc)
        };

        var deudaLicencia = new Deuda
        {
            ProveedorId = gamma.Id,
            Monto = 9600m,
            Concepto = "Licencia Software ERP",
            TipoComprobante = TipoComprobante.Factura,
            NumeroComprobante = "FAC-A-0002-00431",
            FechaDeuda = new DateTime(2026, 7, 10, 11, 30, 0, DateTimeKind.Utc)
        };

        db.Deudas.AddRange(deudaMantenimiento, deudaLicencia);

        // Deudas adicionales
        db.Deudas.Add(new Deuda
        {
            ProveedorId = alfa.Id,
            Monto = 20000m,
            Concepto = "Resmas de papel y cartuchos",
            TipoComprobante = TipoComprobante.Factura,
            NumeroComprobante = "FAC-A-0001-1002",
            FechaDeuda = new DateTime(2026, 7, 5, 10, 0, 0, DateTimeKind.Utc)
        });

        db.Deudas.Add(new Deuda
        {
            ProveedorId = beta.Id,
            Monto = 6200m,
            Concepto = "Artículos de limpieza",
            TipoComprobante = TipoComprobante.Remito,
            NumeroComprobante = "REM-0001-554",
            FechaDeuda = new DateTime(2026, 7, 8, 14, 0, 0, DateTimeKind.Utc)
        });

        db.Deudas.Add(new Deuda
        {
            ProveedorId = delta.Id,
            Monto = 140000m,
            Concepto = "Lote repuestos importados",
            TipoComprobante = TipoComprobante.Factura,
            NumeroComprobante = "FAC-A-0005-0988",
            FechaDeuda = new DateTime(2026, 7, 2, 8, 0, 0, DateTimeKind.Utc)
        });

        db.SaveChanges();

        // Pagos Gamma Corp (Julio 2026)
        db.Pagos.Add(new Pago
        {
            ProveedorId = gamma.Id,
            DeudaId = deudaMantenimiento.Id,
            Monto = 36000m,
            MedioPago = MedioPago.Transferencia,
            Referencia = "TRF-88741",
            Comentario = "Anticipo mantenimiento",
            FechaPago = new DateTime(2026, 6, 20, 15, 0, 0, DateTimeKind.Utc)
        });

        db.Pagos.Add(new Pago
        {
            ProveedorId = gamma.Id,
            DeudaId = deudaMantenimiento.Id,
            Monto = 12000m,
            MedioPago = MedioPago.Transferencia,
            Referencia = "TRF-90214",
            Comentario = "Saldo cuota julio mantenimiento",
            FechaPago = new DateTime(2026, 7, 12, 16, 30, 0, DateTimeKind.Utc)
        });

        db.SaveChanges();
    }
}
