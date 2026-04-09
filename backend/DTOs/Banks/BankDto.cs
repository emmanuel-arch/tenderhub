using System.ComponentModel.DataAnnotations;
using TenderHub.API.Models;

namespace TenderHub.API.DTOs.Banks;

public class BankDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Logo { get; set; } = string.Empty;
    public string ProcessingTime { get; set; } = string.Empty;
    public string Fees { get; set; } = string.Empty;
    public bool DigitalOption { get; set; }
    public decimal Rating { get; set; }
    public bool IsActive { get; set; }
    public string InstitutionType { get; set; } = "Bank";
}

public class CreateBankDto
{
    [Required, MinLength(2)] public string Name { get; set; } = string.Empty;
    public string Logo { get; set; } = string.Empty;
    [Required] public string ProcessingTime { get; set; } = string.Empty;
    [Required] public string Fees { get; set; } = string.Empty;
    public bool DigitalOption { get; set; }
    [Range(0, 5)] public decimal Rating { get; set; }
    public string InstitutionType { get; set; } = "Bank";
}

public class UpdateBankDto
{
    public string? Name { get; set; }
    public string? Logo { get; set; }
    public string? ProcessingTime { get; set; }
    public string? Fees { get; set; }
    public bool? DigitalOption { get; set; }
    [Range(0, 5)] public decimal? Rating { get; set; }
    public bool? IsActive { get; set; }
    public string? InstitutionType { get; set; }
}
