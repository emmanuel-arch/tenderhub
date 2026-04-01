namespace TenderHub.API.Services;

public interface IFileService
{
    Task<(string storagePath, string fileName)> SaveFileAsync(IFormFile file, string folder);
    Task DeleteFileAsync(string storagePath);
    string GetFileUrl(string storagePath);
}

public class LocalFileService(IConfiguration config, IWebHostEnvironment env) : IFileService
{
    private readonly string _baseDir = Path.Combine(
        env.ContentRootPath,
        config.GetValue<string>("Storage:LocalPath", "uploads")!);

    private readonly string _baseUrl = config.GetValue<string>("Storage:BaseUrl", "/files")!;

    public async Task<(string storagePath, string fileName)> SaveFileAsync(IFormFile file, string folder)
    {
        var dir = Path.Combine(_baseDir, folder);
        Directory.CreateDirectory(dir);

        var ext = Path.GetExtension(file.FileName);
        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var relativePath = Path.Combine(folder, uniqueName);
        var fullPath = Path.Combine(_baseDir, relativePath);

        await using var stream = File.Create(fullPath);
        await file.CopyToAsync(stream);

        return (relativePath, file.FileName);
    }

    public Task DeleteFileAsync(string storagePath)
    {
        var fullPath = Path.Combine(_baseDir, storagePath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
        return Task.CompletedTask;
    }

    public string GetFileUrl(string storagePath) =>
        $"{_baseUrl}/{storagePath.Replace('\\', '/')}";
}
