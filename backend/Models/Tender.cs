namespace TenderHub.API.Models;

public class Tender
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ExternalId { get; set; } = string.Empty;   // ID from tenders.go.ke
    public string Title { get; set; } = string.Empty;
    public string TenderNumber { get; set; } = string.Empty;
    public string ProcuringEntity { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public string Industry { get; set; } = string.Empty;
    public bool BidBondRequired { get; set; }
    public decimal BidBondAmount { get; set; }
    public TenderCategory Category { get; set; }
    public TenderSubCategory SubCategory { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DocumentUrl { get; set; } = string.Empty;
    public string? RequiredDocuments { get; set; }  // stored as JSON array string
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Application> Applications { get; set; } = [];
}

public enum TenderCategory
{
    Government,
    Private
}

public enum TenderSubCategory
{
    Goods,
    Services,
    Consultancy,
    Works
}
