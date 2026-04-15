using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderHub.API.Data;
using TenderHub.API.DTOs.Auth;
using TenderHub.API.Models;

namespace TenderHub.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "SuperAdmin")]
public class UsersController(ApplicationDbContext db) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
     ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)!);

    /// <summary>Temporary: demote all Admin users to Client.</summary>
    [HttpPost("demote-admins-to-client")]
    [AllowAnonymous]
    public async Task<IActionResult> DemoteAdminsToClient()
    {
        var count = await db.Users
            .Where(u => u.Role == UserRole.Admin)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.Role, UserRole.Client));
        return Ok(new { updated = count });
    }

    /// <summary>List all users.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserDto
            {
                Id             = u.Id,
                Name           = u.Name,
                Email          = u.Email,
                Role           = u.Role.ToString(),
                IsActive       = u.IsActive,
                EmailConfirmed = u.EmailConfirmed,
                CreatedAt      = u.CreatedAt,
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>Deactivate a user account.</summary>
    [HttpPatch("{id:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        if (id == CurrentUserId)
            return BadRequest(new { message = "You cannot deactivate your own account." });

        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = false;
        await db.SaveChangesAsync();
        return Ok(new { message = $"{user.Name}'s account has been deactivated." });
    }

    /// <summary>Reactivate a user account.</summary>
    [HttpPatch("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = true;
        await db.SaveChangesAsync();
        return Ok(new { message = $"{user.Name}'s account has been reactivated." });
    }

    /// <summary>Delete a user account permanently.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (id == CurrentUserId)
            return BadRequest(new { message = "You cannot delete your own account." });

        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (user.Role == UserRole.SuperAdmin)
            return BadRequest(new { message = "Super admin accounts cannot be deleted." });

        // Remove related applications first
        var apps = db.Applications.Where(a => a.UserId == id);
        db.Applications.RemoveRange(apps);

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return Ok(new { message = $"{user.Name}'s account has been permanently deleted." });
    }
}
