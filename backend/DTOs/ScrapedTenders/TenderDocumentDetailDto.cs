namespace TenderHub.API.DTOs.ScrapedTenders;

public class TenderDocumentDetailDto
{
    public Guid Id { get; set; }
    public Guid TenderId { get; set; }

    // Section 1: Key Requirements
    public string? BidBondAmount { get; set; }
    public string? BidBondForm { get; set; }
    public string? BidBondValidity { get; set; }
    public string? BidValidityPeriod { get; set; }
    public string? SubmissionDeadline { get; set; }
    public string? SubmissionMethod { get; set; }
    public string? PreBidMeetingDate { get; set; }
    public string? PreBidMeetingLink { get; set; }
    public string? ClarificationDeadline { get; set; }
    public bool? MandatorySiteVisit { get; set; }
    public string? NumberOfBidCopies { get; set; }

    // Section 2: Financial Qualification Thresholds
    public string? MinAnnualTurnover { get; set; }
    public string? MinLiquidAssets { get; set; }
    public string? MinSingleContractValue { get; set; }
    public string? MinCombinedContractValue { get; set; }
    public string? CashFlowRequirement { get; set; }
    public string? AuditedFinancialsYears { get; set; }

    // Raw section text
    public string? KeyRequirementsRaw { get; set; }
    public string? FinancialQualificationsRaw { get; set; }

    // Metadata
    public bool? DocumentParsed { get; set; }
    public string? ParseError { get; set; }
}
