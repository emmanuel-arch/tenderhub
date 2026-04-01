using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TenderHub.API.Data;
using TenderHub.API.Models;
using TenderHub.API.Services;

namespace TenderHub.API.Controllers;

[ApiController]
[Route("api/applications/{applicationId:guid}/documents")]
[Authorize]
public class DocumentsController(ApplicationDbContext db, IFileService fileService) : ControllerBase
{
    private static readonly string[] AllowedTypes =
        ["application/pdf", "image/jpeg", "image/png"];

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException());

    private bool IsAdmin => User.IsInRole("Admin");

    /// <summary>Upload a document to an application.</summary>
    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Upload(
        Guid applicationId,
        IFormFile file,
        [FromForm] string documentName)
    {
        var app = await db.Applications.FindAsync(applicationId);
        if (app is null) return NotFound();
        if (!IsAdmin && app.UserId != CurrentUserId) return Forbid();

        if (file.Length > MaxFileSizeBytes)
            return BadRequest(new { message = $"File exceeds the {MaxFileSizeBytes / 1024 / 1024} MB limit." });

        if (!AllowedTypes.Contains(file.ContentType))
            return BadRequest(new { message = "Unsupported file type. Use PDF, JPG, or PNG." });

        var (storagePath, originalName) = await fileService.SaveFileAsync(
            file, $"applications/{applicationId}");

        var doc = new ApplicationDocument
        {
            ApplicationId = applicationId,
            Name = documentName,
            FileName = originalName,
            ContentType = file.ContentType,
            StoragePath = storagePath,
            FileSizeBytes = file.Length
        };

        db.ApplicationDocuments.Add(doc);
        await db.SaveChangesAsync();

        return StatusCode(201, new
        {
            id = doc.Id,
            name = doc.Name,
            fileName = doc.FileName,
            contentType = doc.ContentType,
            fileSizeBytes = doc.FileSizeBytes,
            uploadedAt = doc.UploadedAt,
            url = fileService.GetFileUrl(storagePath)
        });
    }

    /// <summary>Delete a document.</summary>
    [HttpDelete("{documentId:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid applicationId, Guid documentId)
    {
        var doc = await db.ApplicationDocuments
            .Include(d => d.Application)
            .FirstOrDefaultAsync(d => d.Id == documentId && d.ApplicationId == applicationId);

        if (doc is null) return NotFound();
        if (!IsAdmin && doc.Application.UserId != CurrentUserId) return Forbid();

        await fileService.DeleteFileAsync(doc.StoragePath);
        db.ApplicationDocuments.Remove(doc);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
