using System.ComponentModel.DataAnnotations;

namespace TenderHub.API.DTOs.Applications;

public class ApplicationDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid TenderId { get; set; }
    public Guid? BankId { get; set; }
    public string TenderTitle { get; set; } = string.Empty;
    public string TenderNumber { get; set; } = string.Empty;
    public string? BankName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public string? DocumentUrl { get; set; }
    public decimal? BondAmount { get; set; }

    // Company info
    public string CompanyName { get; set; } = string.Empty;
    public string BusinessRegistrationNumber { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string PhysicalAddress { get; set; } = string.Empty;

    // Financial
    public decimal? AnnualRevenue { get; set; }
    public decimal? CompanyNetWorth { get; set; }
    public string? BankAccountNumber { get; set; }

    public DateTime SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }

    public List<DocumentDto> Documents { get; set; } = [];
    public List<StatusHistoryDto> StatusHistory { get; set; } = [];
}

public class CreateApplicationDto
{
    [Required] public Guid TenderId { get; set; }
    [Required] public Guid BankId { get; set; }

    // Step 1 — Company Information
    [Required] public string CompanyName { get; set; } = string.Empty;
    [Required] public string BusinessRegistrationNumber { get; set; } = string.Empty;
    [Required] public string ContactPerson { get; set; } = string.Empty;
    [Required] public string PhoneNumber { get; set; } = string.Empty;
    [Required, EmailAddress] public string ContactEmail { get; set; } = string.Empty;
    [Required] public string PhysicalAddress { get; set; } = string.Empty;

    // Step 2 — Financial Details
    public decimal? AnnualRevenue { get; set; }
    public decimal? CompanyNetWorth { get; set; }
    public string? BankAccountNumber { get; set; }
}

public class UpdateApplicationStatusDto
{
    [Required] public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? RejectionReason { get; set; }
    public string? DocumentUrl { get; set; }
}

public class DocumentDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class StatusHistoryDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}
