using Microsoft.EntityFrameworkCore;
using PayTrack.Api.Domain;

namespace PayTrack.Api.Data;

public class PayTrackDbContext : DbContext
{
    public PayTrackDbContext(DbContextOptions<PayTrackDbContext> options) : base(options)
    {
    }

    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Deuda> Deudas => Set<Deuda>();
    public DbSet<Pago> Pagos => Set<Pago>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Proveedores
        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nombre).IsRequired().HasMaxLength(120);
            entity.HasIndex(e => e.Nombre).IsUnique();
            entity.Property(e => e.Contacto).HasMaxLength(200);
            entity.Property(e => e.Activo).HasDefaultValue(true);

            entity.HasMany(e => e.Deudas)
                .WithOne(d => d.Proveedor)
                .HasForeignKey(d => d.ProveedorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Pagos)
                .WithOne(p => p.Proveedor)
                .HasForeignKey(p => p.ProveedorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Deudas
        modelBuilder.Entity<Deuda>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Monto).HasPrecision(18, 2).IsRequired();
            entity.Property(e => e.Concepto).IsRequired().HasMaxLength(300);
            entity.Property(e => e.TipoComprobante).HasConversion<string>().IsRequired();
            entity.Property(e => e.NumeroComprobante).HasMaxLength(80);
            entity.Property(e => e.Activo).HasDefaultValue(true);
            entity.Property(e => e.FechaVencimiento);

            entity.HasMany(e => e.Pagos)
                .WithOne(p => p.Deuda)
                .HasForeignKey(p => p.DeudaId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Pagos
        modelBuilder.Entity<Pago>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Monto).HasPrecision(18, 2).IsRequired();
            entity.Property(e => e.MedioPago).HasConversion<string>().IsRequired();
            entity.Property(e => e.Referencia).HasMaxLength(100);
            entity.Property(e => e.Comentario).HasMaxLength(500);
            entity.Property(e => e.Activo).HasDefaultValue(true);
        });
    }
}
