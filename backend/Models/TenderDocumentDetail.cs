using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TenderHub.API.Models;

[Table("TenderDocumentDetails")]
public class TenderDocumentDetail
{
    public Guid Id { get; set; }

    public Guid TenderId { get; set; }

    // Section 1: Key Requirements
    [MaxLength(200)]
    public string? BidBondAmount { get; set; }

    [MaxLength(200)]
    public string? BidBondForm { get; set; }

    [MaxLength(100)]
    public string? BidBondValidity { get; set; }

    [MaxLength(100)]
    public string? BidValidityPeriod { get; set; }

    [MaxLength(200)]
    public string? SubmissionDeadline { get; set; }

    [MaxLength(100)]
    public string? SubmissionMethod { get; set; }

    [MaxLength(200)]
    public string? PreBidMeetingDate { get; set; }

    [MaxLength(500)]
    public string? PreBidMeetingLink { get; set; }

    [MaxLength(200)]
    public string? ClarificationDeadline { get; set; }

    public bool? MandatorySiteVisit { get; set; }

    [MaxLength(50)]
    public string? NumberOfBidCopies { get; set; }

    // Section 2: Financial Qualification Thresholds
    [MaxLength(200)]
    public string? MinAnnualTurnover { get; set; }

    [MaxLength(200)]
    public string? MinLiquidAssets { get; set; }

    [MaxLength(200)]
    public string? MinSingleContractValue { get; set; }

    [MaxLength(200)]
    public string? MinCombinedContractValue { get; set; }

    [MaxLength(200)]
    public string? CashFlowRequirement { get; set; }

    [MaxLength(100)]
    public string? AuditedFinancialsYears { get; set; }

    // Section 3 & 4: JSON arrays
    public string? KeyPersonnel { get; set; }

    public string? KeyEquipment { get; set; }

    // Raw section text
    public string? KeyRequirementsRaw { get; set; }

    public string? FinancialQualificationsRaw { get; set; }

    public string? KeyPersonnelRaw { get; set; }

    public string? KeyEquipmentRaw { get; set; }

    // Metadata
    public bool? DocumentParsed { get; set; }

    public string? ParsedDocumentUrl { get; set; }

    public string? ParseError { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    // Navigation
    [ForeignKey(nameof(TenderId))]
    public ScrapedTender? Tender { get; set; }
}
