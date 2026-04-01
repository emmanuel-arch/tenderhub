namespace TenderHub.API.Models;

public class Application
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Foreign keys
    public Guid UserId { get; set; }
    public Guid TenderId { get; set; }
    public Guid? BankId { get; set; }

    // Denormalized for quick display (mirrors frontend)
    public string TenderTitle { get; set; } = string.Empty;
    public string TenderNumber { get; set; } = string.Empty;
    public string? BankName { get; set; }

    // Status
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Pending;
    public string? RejectionReason { get; set; }
    public string? DocumentUrl { get; set; }   // approved bond document URL

    // Financial
    public decimal? BondAmount { get; set; }

    // Company information (Step 1)
    public string CompanyName { get; set; } = string.Empty;
    public string BusinessRegistrationNumber { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string PhysicalAddress { get; set; } = string.Empty;

    // Financial details (Step 2)
    public decimal? AnnualRevenue { get; set; }
    public decimal? CompanyNetWorth { get; set; }
    public string? BankAccountNumber { get; set; }

    // Timestamps
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public Tender Tender { get; set; } = null!;
    public Bank? Bank { get; set; }
    public ICollection<ApplicationDocument> Documents { get; set; } = [];
    public ICollection<StatusHistory> StatusHistory { get; set; } = [];
}

public enum ApplicationStatus
{
    Pending,
    Submitted,
    Approved,
    Rejected
}
