using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderHub.API.Data;
using TenderHub.API.DTOs.Common;
using TenderHub.API.DTOs.Tenders;
using TenderHub.API.Models;

namespace TenderHub.API.Controllers;

[ApiController]
[Route("api/tenders")]
public class TendersController(ApplicationDbContext db) : ControllerBase
{
    /// <summary>List tenders with optional filters and pagination.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<TenderDto>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] TenderListParams p)
    {
        var query = db.Tenders.AsQueryable();

        if (!string.IsNullOrWhiteSpace(p.ExternalId))
            query = query.Where(t => t.ExternalId == p.ExternalId);

        if (!string.IsNullOrWhiteSpace(p.Search))
            query = query.Where(t =>
                t.Title.Contains(p.Search) ||
                t.TenderNumber.Contains(p.Search) ||
                t.ProcuringEntity.Contains(p.Search));

        if (!string.IsNullOrWhiteSpace(p.Category) &&
            Enum.TryParse<TenderCategory>(p.Category, true, out var cat))
            query = query.Where(t => t.Category == cat);

        if (!string.IsNullOrWhiteSpace(p.SubCategory) &&
            Enum.TryParse<TenderSubCategory>(p.SubCategory, true, out var sub))
            query = query.Where(t => t.SubCategory == sub);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((p.Page - 1) * p.PageSize)
            .Take(p.PageSize)
            .Select(t => ToDto(t))
            .ToListAsync();

        return Ok(new PagedResult<TenderDto>
        {
            Data = items,
            CurrentPage = p.Page,
            PageSize = p.PageSize,
            TotalCount = total
        });
    }

    /// <summary>Get a single tender by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TenderDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var t = await db.Tenders.FindAsync(id);
        return t is null ? NotFound() : Ok(ToDto(t));
    }

    /// <summary>Create a tender. Any authenticated user (used for syncing external tenders).</summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(TenderDto), 201)]
    public async Task<IActionResult> Create([FromBody] CreateTenderDto dto)
    {
        if (!Enum.TryParse<TenderCategory>(dto.Category, true, out var cat))
            return BadRequest(new { message = "Invalid category." });
        if (!Enum.TryParse<TenderSubCategory>(dto.SubCategory, true, out var sub))
            return BadRequest(new { message = "Invalid subCategory." });

        var tender = new Tender
        {
            ExternalId = dto.ExternalId,
            Title = dto.Title,
            TenderNumber = dto.TenderNumber,
            ProcuringEntity = dto.ProcuringEntity,
            Deadline = dto.Deadline,
            Industry = dto.Industry,
            BidBondRequired = dto.BidBondRequired,
            BidBondAmount = dto.BidBondAmount,
            Category = cat,
            SubCategory = sub,
            Summary = dto.Summary,
            Description = dto.Description,
            DocumentUrl = dto.DocumentUrl,
            RequiredDocuments = dto.RequiredDocuments.Count > 0
                ? JsonSerializer.Serialize(dto.RequiredDocuments)
                : null
        };

        db.Tenders.Add(tender);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = tender.Id }, ToDto(tender));
    }

    /// <summary>Delete a tender. Admin only.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tender = await db.Tenders.FindAsync(id);
        if (tender is null) return NotFound();
        db.Tenders.Remove(tender);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Mapping ──────────────────────────────────────────────────────────────
    private static TenderDto ToDto(Tender t) => new()
    {
        Id = t.Id,
        ExternalId = t.ExternalId,
        Title = t.Title,
        TenderNumber = t.TenderNumber,
        ProcuringEntity = t.ProcuringEntity,
        Deadline = t.Deadline,
        Industry = t.Industry,
        BidBondRequired = t.BidBondRequired,
        BidBondAmount = t.BidBondAmount,
        Category = t.Category.ToString(),
        SubCategory = t.SubCategory.ToString(),
        Summary = t.Summary,
        Description = t.Description,
        DocumentUrl = t.DocumentUrl,
        RequiredDocuments = t.RequiredDocuments is not null
            ? JsonSerializer.Deserialize<List<string>>(t.RequiredDocuments) ?? []
            : [],
        CreatedAt = t.CreatedAt
    };
}
