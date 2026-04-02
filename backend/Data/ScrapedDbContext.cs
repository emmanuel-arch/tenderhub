using Microsoft.EntityFrameworkCore;
using TenderHub.API.Models;

namespace TenderHub.API.Data;

public class ScrapedDbContext(DbContextOptions<ScrapedDbContext> options) : DbContext(options)
{
    public DbSet<ScrapedTender> ScrapedTenders => Set<ScrapedTender>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ScrapedTender>(entity =>
        {
            entity.ToTable("ScrapedTenders");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.Source, e.Title })
                  .IsUnique()
                  .HasDatabaseName("UQ_ScrapedTenders_Source_Title");
        });
    }
}
