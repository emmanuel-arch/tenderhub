using System.ComponentModel.DataAnnotations;

namespace TenderHub.API.DTOs.Tenders;

public class TenderDto
{
    public Guid Id { get; set; }
    public string ExternalId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string TenderNumber { get; set; } = string.Empty;
    public string ProcuringEntity { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public string Industry { get; set; } = string.Empty;
    public bool BidBondRequired { get; set; }
    public decimal BidBondAmount { get; set; }
    public string Category { get; set; } = string.Empty;
    public string SubCategory { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DocumentUrl { get; set; } = string.Empty;
    public List<string> RequiredDocuments { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}

public class CreateTenderDto
{
    [Required] public string ExternalId { get; set; } = string.Empty;
    [Required] public string Title { get; set; } = string.Empty;
    [Required] public string TenderNumber { get; set; } = string.Empty;
    [Required] public string ProcuringEntity { get; set; } = string.Empty;
    [Required] public DateTime Deadline { get; set; }
    public string Industry { get; set; } = string.Empty;
    public bool BidBondRequired { get; set; }
    public decimal BidBondAmount { get; set; }
    [Required] public string Category { get; set; } = "Government";
    public string SubCategory { get; set; } = "Goods";
    public string Summary { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DocumentUrl { get; set; } = string.Empty;
    public List<string> RequiredDocuments { get; set; } = [];
}

public class TenderListParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Category { get; set; }
    public string? SubCategory { get; set; }
    public string? Search { get; set; }
    public string? ExternalId { get; set; }
}
