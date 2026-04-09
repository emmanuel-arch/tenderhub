using Microsoft.EntityFrameworkCore;
using TenderHub.API.Models;

namespace TenderHub.API.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Tender> Tenders => Set<Tender>();
    public DbSet<Bank> Banks => Set<Bank>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<ApplicationDocument> ApplicationDocuments => Set<ApplicationDocument>();
    public DbSet<StatusHistory> StatusHistories => Set<StatusHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Users ────────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(255).IsRequired();
            e.Property(u => u.Name).HasMaxLength(200).IsRequired();
            e.Property(u => u.PasswordHash).IsRequired();
            e.Property(u => u.Role).HasConversion<string>();
        });

        // ── Tenders ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Tender>(e =>
        {
            e.HasKey(t => t.Id);
            e.HasIndex(t => t.ExternalId);
            e.HasIndex(t => t.TenderNumber);
            e.Property(t => t.Title).HasMaxLength(500).IsRequired();
            e.Property(t => t.TenderNumber).HasMaxLength(100).IsRequired();
            e.Property(t => t.ProcuringEntity).HasMaxLength(300).IsRequired();
            e.Property(t => t.BidBondAmount).HasColumnType("numeric(18,2)");
            e.Property(t => t.Category).HasConversion<string>();
            e.Property(t => t.SubCategory).HasConversion<string>();
        });

        // ── Banks ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<Bank>(e =>
        {
            e.HasKey(b => b.Id);
            e.Property(b => b.Name).HasMaxLength(200).IsRequired();
            e.Property(b => b.Rating).HasColumnType("numeric(3,1)");
            e.Property(b => b.InstitutionType).HasConversion<string>();
        });

        // ── Applications ──────────────────────────────────────────────────────
        modelBuilder.Entity<Application>(e =>
        {
            e.HasKey(a => a.Id);

            e.HasOne(a => a.User)
             .WithMany(u => u.Applications)
             .HasForeignKey(a => a.UserId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(a => a.Tender)
             .WithMany(t => t.Applications)
             .HasForeignKey(a => a.TenderId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(a => a.Bank)
             .WithMany(b => b.Applications)
             .HasForeignKey(a => a.BankId)
             .OnDelete(DeleteBehavior.SetNull);

            e.Property(a => a.Status).HasConversion<string>();
            e.Property(a => a.BondAmount).HasColumnType("numeric(18,2)");
            e.Property(a => a.AnnualRevenue).HasColumnType("numeric(18,2)");
            e.Property(a => a.CompanyNetWorth).HasColumnType("numeric(18,2)");
            e.Property(a => a.CompanyName).HasMaxLength(300);
            e.Property(a => a.BusinessRegistrationNumber).HasMaxLength(100);
            e.Property(a => a.ContactPerson).HasMaxLength(200);
            e.Property(a => a.PhoneNumber).HasMaxLength(50);
            e.Property(a => a.ContactEmail).HasMaxLength(255);
        });

        // ── ApplicationDocuments ──────────────────────────────────────────────
        modelBuilder.Entity<ApplicationDocument>(e =>
        {
            e.HasKey(d => d.Id);
            e.HasOne(d => d.Application)
             .WithMany(a => a.Documents)
             .HasForeignKey(d => d.ApplicationId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(d => d.Name).HasMaxLength(200);
            e.Property(d => d.FileName).HasMaxLength(300);
            e.Property(d => d.ContentType).HasMaxLength(100);
        });

        // ── StatusHistory ─────────────────────────────────────────────────────
        modelBuilder.Entity<StatusHistory>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasOne(s => s.Application)
             .WithMany(a => a.StatusHistory)
             .HasForeignKey(s => s.ApplicationId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(s => s.Status).HasMaxLength(50);
        });
    }
}
