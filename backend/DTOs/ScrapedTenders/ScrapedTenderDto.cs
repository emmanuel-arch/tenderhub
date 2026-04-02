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
    public bool BidBondRequired { get; set; }
    public decimal BidBondAmount { get; set; }
    public DateTime? DocumentReleaseDate { get; set; }
    public string? ProcurementMethod { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ScrapedTenderListParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Source { get; set; }
    public string? Search { get; set; }
    public string? Category { get; set; }
    public string? SubCategory { get; set; }
    public string? ProcurementMethod { get; set; }
}
