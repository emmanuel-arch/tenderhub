using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderHub.API.Data;
using TenderHub.API.DTOs.Banks;
using TenderHub.API.Models;

namespace TenderHub.API.Controllers;

[ApiController]
[Route("api/banks")]
public class BanksController(ApplicationDbContext db) : ControllerBase
{
    /// <summary>List all active banks.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<BankDto>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var banks = await db.Banks
            .Where(b => b.IsActive)
            .OrderBy(b => b.Name)
            .Select(b => ToDto(b))
            .ToListAsync();

        return Ok(banks);
    }

    /// <summary>Get a single bank by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BankDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var bank = await db.Banks.FindAsync(id);
        return bank is null ? NotFound() : Ok(ToDto(bank));
    }

    /// <summary>Create a bank. Admin only.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(BankDto), 201)]
    public async Task<IActionResult> Create([FromBody] CreateBankDto dto)
    {
        var institutionType = Enum.TryParse<InstitutionType>(dto.InstitutionType, true, out var it) ? it : InstitutionType.Bank;
        var bank = new Bank
        {
            Name = dto.Name,
            Logo = dto.Logo,
            ProcessingTime = dto.ProcessingTime,
            Fees = dto.Fees,
            DigitalOption = dto.DigitalOption,
            Rating = dto.Rating,
            InstitutionType = institutionType
        };

        db.Banks.Add(bank);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = bank.Id }, ToDto(bank));
    }

    /// <summary>Update a bank. Admin only.</summary>
    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(BankDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBankDto dto)
    {
        var bank = await db.Banks.FindAsync(id);
        if (bank is null) return NotFound();

        if (dto.Name is not null) bank.Name = dto.Name;
        if (dto.Logo is not null) bank.Logo = dto.Logo;
        if (dto.ProcessingTime is not null) bank.ProcessingTime = dto.ProcessingTime;
        if (dto.Fees is not null) bank.Fees = dto.Fees;
        if (dto.DigitalOption.HasValue) bank.DigitalOption = dto.DigitalOption.Value;
        if (dto.Rating.HasValue) bank.Rating = dto.Rating.Value;
        if (dto.IsActive.HasValue) bank.IsActive = dto.IsActive.Value;
        if (dto.InstitutionType is not null && Enum.TryParse<InstitutionType>(dto.InstitutionType, true, out var updatedIt))
            bank.InstitutionType = updatedIt;
        bank.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(ToDto(bank));
    }

    /// <summary>Delete a bank. Admin only.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var bank = await db.Banks.FindAsync(id);
        if (bank is null) return NotFound();
        db.Banks.Remove(bank);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static BankDto ToDto(Bank b) => new()
    {
        Id = b.Id,
        Name = b.Name,
        Logo = b.Logo,
        ProcessingTime = b.ProcessingTime,
        Fees = b.Fees,
        DigitalOption = b.DigitalOption,
        Rating = b.Rating,
        IsActive = b.IsActive,
        InstitutionType = b.InstitutionType.ToString()
    };
}
