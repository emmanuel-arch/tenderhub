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
    public string? BankInstitutionType { get; set; }
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
    [Required, Range(1, double.MaxValue, ErrorMessage = "Annual revenue must be a positive amount.")]
    public decimal? AnnualRevenue { get; set; }

    [Required, Range(1, double.MaxValue, ErrorMessage = "Company net worth must be a positive amount.")]
    public decimal? CompanyNetWorth { get; set; }

    public string? BankAccountNumber { get; set; }
}

// Validate only step-1 fields
public class ValidateStep1Dto
{
    [Required(ErrorMessage = "Company name is required.")]
    public string CompanyName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Business registration number is required.")]
    public string BusinessRegistrationNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Contact person is required.")]
    public string ContactPerson { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required.")]
    [RegularExpression(@"^(\+254|0)[17]\d{8}$", ErrorMessage = "Enter a valid Kenyan phone number (e.g. +254 7XX XXX XXX).")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email address is required.")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string ContactEmail { get; set; } = string.Empty;

    [Required(ErrorMessage = "Physical address is required.")]
    public string PhysicalAddress { get; set; } = string.Empty;
}

// Validate only step-2 fields
public class ValidateStep2Dto
{
    [Required(ErrorMessage = "Annual revenue is required.")]
    [Range(1, double.MaxValue, ErrorMessage = "Annual revenue must be a positive amount.")]
    public decimal? AnnualRevenue { get; set; }

    [Required(ErrorMessage = "Company net worth is required.")]
    [Range(1, double.MaxValue, ErrorMessage = "Company net worth must be a positive amount.")]
    public decimal? CompanyNetWorth { get; set; }
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
