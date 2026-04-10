using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderHub.API.Data;
using TenderHub.API.DTOs.Common;
using TenderHub.API.DTOs.ScrapedTenders;
using TenderHub.API.Models;

namespace TenderHub.API.Controllers;

[ApiController]
[Route("api/tenderlisting")]
public class TenderListingController(ScrapedDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ScrapedTenderDto>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] ScrapedTenderListParams p)
    {
        var query = db.ScrapedTenders
            .Include(t => t.DocumentDetail)
            .AsNoTracking()
            .Where(t => t.Deadline == null || t.Deadline >= DateTime.UtcNow)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(p.Source))
            query = query.Where(t => t.Source == p.Source);

        if (!string.IsNullOrWhiteSpace(p.Search))
            query = query.Where(t =>
                t.Title.Contains(p.Search) ||
                (t.TenderNumber != null && t.TenderNumber.Contains(p.Search)) ||
                (t.ProcuringEntity != null && t.ProcuringEntity.Contains(p.Search)));

        if (!string.IsNullOrWhiteSpace(p.Category))
            query = query.Where(t => t.Category == p.Category);

        if (!string.IsNullOrWhiteSpace(p.SubCategory))
        {
            if (p.SubCategory == "Services")
                query = query.Where(t => t.SubCategory == "Services" || t.SubCategory == "Non Consultancy Services");
            else
                query = query.Where(t => t.SubCategory == p.SubCategory);
        }

        if (!string.IsNullOrWhiteSpace(p.ProcurementMethod))
            query = query.Where(t => t.ProcurementMethod == p.ProcurementMethod);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((p.Page - 1) * p.PageSize)
            .Take(p.PageSize)
            .Select(t => ToDto(t))
            .ToListAsync();

        return Ok(new PagedResult<ScrapedTenderDto>
        {
            Data = items,
            CurrentPage = p.Page,
            PageSize = p.PageSize,
            TotalCount = total
        });
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ScrapedTenderDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var t = await db.ScrapedTenders
            .Include(t => t.DocumentDetail)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (t is null) return NotFound();

        return Ok(ToDto(t));
    }

    [HttpGet("sources")]
    [ProducesResponseType(typeof(List<string>), 200)]
    public async Task<IActionResult> GetSources()
    {
        var sources = await db.ScrapedTenders
            .AsNoTracking()
            .Select(t => t.Source)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync();
        return Ok(sources);
    }

    private static ScrapedTenderDto ToDto(ScrapedTender t) => new()
    {
        Id = t.Id,
        Source = t.Source,
        ExternalId = t.ExternalId,
        Title = t.Title,
        TenderNumber = t.TenderNumber,
        ProcuringEntity = t.ProcuringEntity,
        Deadline = t.Deadline,
        Category = t.Category,
        SubCategory = t.SubCategory,
        Summary = t.Summary,
        Description = t.Description,
        DocumentUrl = t.DocumentUrl,
        TenderNoticeUrl = t.TenderNoticeUrl,
        BidBondRequired = t.BidBondRequired,
        BidBondAmount = t.BidBondAmount,
        TenderFee = t.TenderFee,
        DocumentReleaseDate = t.DocumentReleaseDate,
        ProcurementMethod = t.ProcurementMethod,
        SubmissionMethodName = t.SubmissionMethodName,
        BidValidityDays = t.BidValidityDays,
        Venue = t.Venue,
        PeEmail = t.PeEmail,
        PePhone = t.PePhone,
        PeAddress = t.PeAddress,
        StartDate = t.StartDate,
        EndDate = t.EndDate,
        CreatedAt = t.CreatedAt,
        DocumentDetails = t.DocumentDetail is null ? null : ToDocDetailDto(t.DocumentDetail)
    };

    private static TenderDocumentDetailDto ToDocDetailDto(TenderDocumentDetail d) => new()
    {
        Id = d.Id,
        TenderId = d.TenderId,
        BidBondAmount = d.BidBondAmount,
        BidBondForm = d.BidBondForm,
        BidBondValidity = d.BidBondValidity,
        BidValidityPeriod = d.BidValidityPeriod,
        SubmissionDeadline = d.SubmissionDeadline,
        SubmissionMethod = d.SubmissionMethod,
        PreBidMeetingDate = d.PreBidMeetingDate,
        PreBidMeetingLink = d.PreBidMeetingLink,
        ClarificationDeadline = d.ClarificationDeadline,
        MandatorySiteVisit = d.MandatorySiteVisit,
        NumberOfBidCopies = d.NumberOfBidCopies,
        MinAnnualTurnover = d.MinAnnualTurnover,
        MinLiquidAssets = d.MinLiquidAssets,
        MinSingleContractValue = d.MinSingleContractValue,
        MinCombinedContractValue = d.MinCombinedContractValue,
        CashFlowRequirement = d.CashFlowRequirement,
        AuditedFinancialsYears = d.AuditedFinancialsYears,
        KeyRequirementsRaw = d.KeyRequirementsRaw,
        FinancialQualificationsRaw = d.FinancialQualificationsRaw,
        DocumentParsed = d.DocumentParsed,
        ParseError = d.ParseError,
    };
}
