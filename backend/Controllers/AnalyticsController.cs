using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderHub.API.Data;
using TenderHub.API.Models;

namespace TenderHub.API.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize(Roles = "Admin")]
public class AnalyticsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var now = DateTime.UtcNow;

        // ── Applications with tender + bank joins ─────────────────────────────
        var apps = await db.Applications
            .Include(a => a.Tender)
            .Include(a => a.Bank)
            .AsNoTracking()
            .ToListAsync();

        // ── Category breakdown (tender sub-category) ──────────────────────────
        var byCategory = apps
            .GroupBy(a => a.Tender?.SubCategory.ToString() ?? "Unknown")
            .Select(g => new { category = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToList();

        // ── Institution type breakdown ─────────────────────────────────────────
        var byInstitution = apps
            .GroupBy(a => a.Bank?.InstitutionType.ToString() ?? "Unknown")
            .Select(g => new { institution = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToList();

        // ── Status breakdown ──────────────────────────────────────────────────
        var byStatus = apps
            .GroupBy(a => a.Status.ToString())
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToList();

        // ── Monthly applications — last 6 months ──────────────────────────────
        var sixMonthsAgo = now.AddMonths(-5);
        var byMonth = Enumerable.Range(0, 6)
            .Select(i => now.AddMonths(-5 + i))
            .Select(month => new
            {
                month = month.ToString("MMM yyyy"),
                count = apps.Count(a =>
                    a.SubmittedAt.Year == month.Year &&
                    a.SubmittedAt.Month == month.Month)
            })
            .ToList();

        // ── Unique applicants (distinct companies) ────────────────────────────
        var uniqueCompanies = apps
            .Select(a => a.CompanyName.ToLower().Trim())
            .Distinct()
            .Count();

        // ── Registered users ──────────────────────────────────────────────────
        var totalUsers = await db.Users.CountAsync();

        // ── Total bond value submitted ────────────────────────────────────────
        var totalBondValue = apps
            .Where(a => a.BondAmount.HasValue)
            .Sum(a => a.BondAmount!.Value);

        // ── Top procuring entities ────────────────────────────────────────────
        var topEntities = apps
            .GroupBy(a => a.Tender?.ProcuringEntity ?? "Unknown")
            .Select(g => new { entity = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(5)
            .ToList();

        return Ok(new
        {
            summary = new
            {
                totalApplications = apps.Count,
                totalUsers,
                uniqueCompanies,
                totalBondValue,
                approved = apps.Count(a => a.Status == ApplicationStatus.Approved),
                pending  = apps.Count(a => a.Status == ApplicationStatus.Pending || a.Status == ApplicationStatus.Submitted),
                rejected = apps.Count(a => a.Status == ApplicationStatus.Rejected),
            },
            byCategory,
            byInstitution,
            byStatus,
            byMonth,
            topEntities,
        });
    }
}
