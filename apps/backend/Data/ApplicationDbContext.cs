using Microsoft.EntityFrameworkCore;
using BackendApi.Models;

namespace BackendApi.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UnimicroId).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            
            entity.Property(e => e.UnimicroId)
                .IsRequired()
                .HasMaxLength(255);
                
            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(255);
                
            entity.Property(e => e.FirstName)
                .HasMaxLength(100);
                
            entity.Property(e => e.LastName)
                .HasMaxLength(100);
                
            entity.Property(e => e.CompanyKey)
                .HasMaxLength(100);
        });
    }
}
