namespace TenderHub.API.DTOs.ScrapedTenders;

public class ScrapedTenderDto
{
    public Guid Id { get; set; }
    public string Source { get; set; } = string.Empty;
    public string? ExternalId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TenderNumber { get; set; }
    public string? ProcuringEntity { get; set; }
    public DateTime? Deadline { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? SubCategory { get; set; }
    public string? Summary { get; set; }
    public string? Description { get; set; }
    public string? DocumentUrl { get; set; }
    public string? TenderNoticeUrl { get; set; }
    public bool? BidBondRequired { get; set; }
    public decimal? BidBondAmount { get; set; }
    public DateTime? DocumentReleaseDate { get; set; }
    public string? ProcurementMethod { get; set; }
    public string? SubmissionMethodName { get; set; }
    public int? BidValidityDays { get; set; }
    public string? Venue { get; set; }
    public string? PeEmail { get; set; }
    public string? PePhone { get; set; }
    public string? PeAddress { get; set; }
    public decimal? TenderFee { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime CreatedAt { get; set; }

    // Included when fetching a single tender by ID
    public TenderDocumentDetailDto? DocumentDetails { get; set; }
}

public class ScrapedTenderListParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Source { get; set; }
    public string? Search { get; set; }
    public string? Category { get; set; }
    public bool NotGovernment { get; set; }
    public string? SubCategory { get; set; }
    public string? ProcurementMethod { get; set; }
}
