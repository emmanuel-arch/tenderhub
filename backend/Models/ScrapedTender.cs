using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TenderHub.API.Models;

[Table("ScrapedTenders")]
public class ScrapedTender
{
    public Guid Id { get; set; }

    [MaxLength(50)]
    public string Source { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? ExternalId { get; set; }

    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? TenderNumber { get; set; }

    [MaxLength(300)]
    public string? ProcuringEntity { get; set; }

    public DateTime? Deadline { get; set; }

    [MaxLength(50)]
    public string Category { get; set; } = "Government";

    [MaxLength(50)]
    public string? SubCategory { get; set; }

    public string? Summary { get; set; }

    public string? Description { get; set; }

    public string? DocumentUrl { get; set; }

    public string? TenderNoticeUrl { get; set; }

    public bool? BidBondRequired { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? BidBondAmount { get; set; }

    public DateTime? DocumentReleaseDate { get; set; }

    [MaxLength(100)]
    public string? ProcurementMethod { get; set; }

    [MaxLength(200)]
    public string? SubmissionMethodName { get; set; }

    public int? BidValidityDays { get; set; }

    [MaxLength(500)]
    public string? Venue { get; set; }

    [MaxLength(200)]
    public string? PeEmail { get; set; }

    [MaxLength(100)]
    public string? PePhone { get; set; }

    [MaxLength(500)]
    public string? PeAddress { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? TenderFee { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    // Navigation
    public TenderDocumentDetail? DocumentDetail { get; set; }
}
