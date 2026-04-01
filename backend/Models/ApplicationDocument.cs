namespace TenderHub.API.Models;

public class ApplicationDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ApplicationId { get; set; }
    public string Name { get; set; } = string.Empty;      // e.g. "Tax Compliance Certificate"
    public string FileName { get; set; } = string.Empty;  // original filename
    public string ContentType { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;  // server-side path / object key
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public Application Application { get; set; } = null!;
}
