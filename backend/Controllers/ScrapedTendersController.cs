using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderHub.API.Data;
using TenderHub.API.DTOs.Common;
using TenderHub.API.DTOs.ScrapedTenders;
using TenderHub.API.Models;
using TenderHub.API.Services;

namespace TenderHub.API.Controllers;

[ApiController]
[Route("api/scraped-tenders")]
public class ScrapedTendersController(ScrapedDbContext db, TendersGoKeSyncService syncService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ScrapedTenderDto>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] ScrapedTenderListParams p)
    {
        var query = db.ScrapedTenders.AsNoTracking()
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
        var t = await db.ScrapedTenders.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return t is null ? NotFound() : Ok(ToDto(t));
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

    [HttpPost("sync")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> Sync(CancellationToken ct)
    {
        var (inserted, updated) = await syncService.SyncAsync(ct);
        return Ok(new { inserted, updated });
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
        StartDate = t.StartDate,
        EndDate = t.EndDate,
        CreatedAt = t.CreatedAt
    };
}
