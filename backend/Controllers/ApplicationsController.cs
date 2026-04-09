using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderHub.API.Data;
using TenderHub.API.DTOs.Applications;
using TenderHub.API.DTOs.Common;
using TenderHub.API.Models;

namespace TenderHub.API.Controllers;

[ApiController]
[Route("api/applications")]
[Authorize]
public class ApplicationsController(ApplicationDbContext db) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtClaimTypes.Sub)
            ?? throw new UnauthorizedAccessException());

    private bool IsAdmin => User.IsInRole("Admin");

    /// <summary>
    /// List applications.
    /// Clients see only their own. Admins see all.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ApplicationDto>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = db.Applications
            .Include(a => a.Documents)
            .Include(a => a.StatusHistory)
            .Include(a => a.Bank)
            .AsQueryable();

        if (!IsAdmin)
            query = query.Where(a => a.UserId == CurrentUserId);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.SubmittedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        var dtos = items.Select(a => ToDto(a)).ToList();

        return Ok(new PagedResult<ApplicationDto>
        {
            Data = dtos,
            CurrentPage = page,
            PageSize = pageSize,
            TotalCount = total
        });
    }

    /// <summary>Get a single application.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApplicationDto), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var app = await db.Applications
            .Include(a => a.Documents)
            .Include(a => a.StatusHistory)
            .Include(a => a.Bank)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (app is null) return NotFound();
        if (!IsAdmin && app.UserId != CurrentUserId) return Forbid();

        return Ok(ToDto(app));
    }

    /// <summary>Validate step-1 fields without saving anything.</summary>
    [HttpPost("validate/step1")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public IActionResult ValidateStep1([FromBody] ValidateStep1Dto dto) => Ok();

    /// <summary>Validate step-2 fields without saving anything.</summary>
    [HttpPost("validate/step2")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public IActionResult ValidateStep2([FromBody] ValidateStep2Dto dto) => Ok();

    /// <summary>Submit a new bid bond application.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApplicationDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Create([FromBody] CreateApplicationDto dto)
    {
        var tender = await db.Tenders.FindAsync(dto.TenderId);
        if (tender is null) return NotFound(new { message = "Tender not found." });

        var bank = await db.Banks.FindAsync(dto.BankId);
        if (bank is null) return NotFound(new { message = "Bank not found." });

        var userId = CurrentUserId;

        var application = new Application
        {
            UserId = userId,
            TenderId = tender.Id,
            BankId = bank.Id,
            TenderTitle = tender.Title,
            TenderNumber = tender.TenderNumber,
            BankName = bank.Name,
            BondAmount = tender.BidBondAmount,
            Status = ApplicationStatus.Pending,
            CompanyName = dto.CompanyName,
            BusinessRegistrationNumber = dto.BusinessRegistrationNumber,
            ContactPerson = dto.ContactPerson,
            PhoneNumber = dto.PhoneNumber,
            ContactEmail = dto.ContactEmail,
            PhysicalAddress = dto.PhysicalAddress,
            AnnualRevenue = dto.AnnualRevenue,
            CompanyNetWorth = dto.CompanyNetWorth,
            BankAccountNumber = dto.BankAccountNumber
        };

        application.StatusHistory.Add(new StatusHistory
        {
            Status = ApplicationStatus.Pending.ToString(),
            Notes = "Application submitted.",
            ChangedByUserId = userId
        });

        db.Applications.Add(application);
        await db.SaveChangesAsync();

        var created = await db.Applications
            .Include(a => a.Documents)
            .Include(a => a.StatusHistory)
            .FirstAsync(a => a.Id == application.Id);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToDto(created));
    }

    /// <summary>Update application status. Admin only.</summary>
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApplicationDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateApplicationStatusDto dto)
    {
        if (!Enum.TryParse<ApplicationStatus>(dto.Status, true, out var status))
            return BadRequest(new { message = "Invalid status value." });

        var app = await db.Applications
            .Include(a => a.Documents)
            .Include(a => a.StatusHistory)
            .Include(a => a.Bank)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (app is null) return NotFound();

        app.Status = status;
        app.UpdatedAt = DateTime.UtcNow;

        if (status == ApplicationStatus.Approved)
            app.ApprovedAt = DateTime.UtcNow;

        if (dto.RejectionReason is not null)
            app.RejectionReason = dto.RejectionReason;

        if (dto.DocumentUrl is not null)
            app.DocumentUrl = dto.DocumentUrl;

        app.StatusHistory.Add(new StatusHistory
        {
            Status = status.ToString(),
            Notes = dto.Notes ?? string.Empty,
            ChangedByUserId = CurrentUserId
        });

        await db.SaveChangesAsync();
        return Ok(ToDto(app));
    }

    // ── Mapping ──────────────────────────────────────────────────────────────
    private static ApplicationDto ToDto(Application a) => new()
    {
        Id = a.Id,
        UserId = a.UserId,
        TenderId = a.TenderId,
        BankId = a.BankId,
        TenderTitle = a.TenderTitle,
        TenderNumber = a.TenderNumber,
        BankName = a.BankName,
        BankInstitutionType = a.Bank?.InstitutionType.ToString(),
        Status = a.Status.ToString(),
        RejectionReason = a.RejectionReason,
        DocumentUrl = a.DocumentUrl,
        BondAmount = a.BondAmount,
        CompanyName = a.CompanyName,
        BusinessRegistrationNumber = a.BusinessRegistrationNumber,
        ContactPerson = a.ContactPerson,
        PhoneNumber = a.PhoneNumber,
        ContactEmail = a.ContactEmail,
        PhysicalAddress = a.PhysicalAddress,
        AnnualRevenue = a.AnnualRevenue,
        CompanyNetWorth = a.CompanyNetWorth,
        BankAccountNumber = a.BankAccountNumber,
        SubmittedAt = a.SubmittedAt,
        ApprovedAt = a.ApprovedAt,
        Documents = a.Documents.Select(d => new DocumentDto
        {
            Id = d.Id,
            Name = d.Name,
            FileName = d.FileName,
            ContentType = d.ContentType,
            FileSizeBytes = d.FileSizeBytes,
            UploadedAt = d.UploadedAt
        }).ToList(),
        StatusHistory = a.StatusHistory
            .OrderBy(s => s.ChangedAt)
            .Select(s => new StatusHistoryDto
            {
                Id = s.Id,
                Status = s.Status,
                Notes = s.Notes,
                ChangedAt = s.ChangedAt
            }).ToList()
    };
}

// Alias so we don't need a separate using just for the sub claim name
file static class JwtClaimTypes
{
    public const string Sub = "sub";
}
