using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TenderHub.API.Data;
using TenderHub.API.DTOs.TendersGoKe;
using TenderHub.API.Models;

namespace TenderHub.API.Services;

public class TendersGoKeSyncService(
    IHttpClientFactory httpClientFactory,
    ScrapedDbContext db,
    ILogger<TendersGoKeSyncService> logger)
{
    private const string Source = "tenders.go.ke";
    private const string BaseUrl = "https://tenders.go.ke/api/active-tenders";
    private const string BaseWebUrl = "https://tenders.go.ke";
    private const int TenderDocumentTypeId = 1;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<(int inserted, int updated)> SyncAsync(CancellationToken ct = default)
    {
        var client = httpClientFactory.CreateClient("TendersGoKe");
        int inserted = 0, updated = 0, page = 1, lastPage = 1;

        // Load all existing records for this source once — avoids per-record DB lookups
        var allExisting = await db.ScrapedTenders
            .Where(s => s.Source == Source)
            .ToListAsync(ct);
        var existingByExternalId = allExisting
            .Where(s => !string.IsNullOrEmpty(s.ExternalId))
            .GroupBy(s => s.ExternalId!)
            .ToDictionary(g => g.Key, g => g.First());
        var existingByTitle = allExisting
            .Where(s => !string.IsNullOrEmpty(s.Title))
            .GroupBy(s => s.Title!)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        do
        {
            var url = $"{BaseUrl}?perpage=50&order=asc&page={page}";
            logger.LogInformation("Fetching {Url}", url);

            TendersGoKeResponse? response = null;
            for (int attempt = 1; attempt <= 5; attempt++)
            {
                try
                {
                    var httpResponse = await client.GetAsync(url, ct);
                    if (httpResponse.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                    {
                        var retryAfter = httpResponse.Headers.RetryAfter?.Delta ?? TimeSpan.FromSeconds(attempt * 10);
                        logger.LogWarning("Rate limited on page {Page}, waiting {Seconds}s (attempt {Attempt})", page, retryAfter.TotalSeconds, attempt);
                        await Task.Delay(retryAfter, ct);
                        continue;
                    }
                    httpResponse.EnsureSuccessStatusCode();
                    var json = await httpResponse.Content.ReadAsStringAsync(ct);
                    response = JsonSerializer.Deserialize<TendersGoKeResponse>(json, JsonOptions);
                    break;
                }
                catch (OperationCanceledException) { throw; }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to fetch page {Page} from tenders.go.ke (attempt {Attempt})", page, attempt);
                    if (attempt == 5) goto nextPage;
                    await Task.Delay(TimeSpan.FromSeconds(attempt * 5), ct);
                }
            }

            if (response?.Data is null or { Count: 0 }) break;
            // polite delay between pages to avoid rate limiting
            if (page > 1) await Task.Delay(TimeSpan.FromSeconds(2), ct);

            lastPage = response.LastPage;
            var now = DateTime.UtcNow;

            foreach (var t in response.Data)
            {
                var externalId = t.Id.ToString();
                var closeAt = ParseDate(t.CloseAt);
                var publishedAt = ParseDate(t.PublishedAt);
                var openingDate = ParseDate(t.OpeningDate);
                var bidBondRequired = (t.BidSecurityValue ?? 0) > 0 || (t.BidSecurityPercent ?? 0) > 0;
                var tenderDoc = t.Documents.FirstOrDefault(d => d.DocumentTypeId == TenderDocumentTypeId)
                             ?? t.Documents.FirstOrDefault();
                var documentUrl = tenderDoc?.Url is { } u
                    ? (u.StartsWith("http") ? u : BaseWebUrl + u)
                    : null;

                // Skip expired tenders entirely
                if (closeAt.HasValue && closeAt.Value < now) continue;

                // Deduplicate by ExternalId first, then fall back to title to avoid unique constraint violation
                if (!existingByExternalId.TryGetValue(externalId, out var existing))
                    existingByTitle.TryGetValue(t.Title ?? "", out existing);

                if (existing is not null)
                {
                    existing.ExternalId = externalId; // keep ExternalId in sync
                    existing.Title = t.Title;
                    existing.TenderNumber = t.TenderRef;
                    existing.ProcuringEntity = t.Pe?.Name;
                    existing.Deadline = closeAt;
                    existing.SubCategory = t.ProcurementCategory?.Name;
                    existing.ProcurementMethod = t.ProcurementMethod?.Name;
                    existing.BidBondRequired = bidBondRequired;
                    existing.BidBondAmount = t.BidSecurityValue ?? 0;
                    existing.TenderFee = t.TenderFee;
                    existing.DocumentReleaseDate = publishedAt;
                    existing.StartDate = publishedAt;
                    existing.EndDate = openingDate;
                    existing.DocumentUrl = documentUrl;
                    existing.UpdatedAt = now;
                    updated++;
                }
                else
                {
                    var record = new ScrapedTender
                    {
                        Id = Guid.NewGuid(),
                        Source = Source,
                        ExternalId = externalId,
                        Title = t.Title,
                        TenderNumber = t.TenderRef,
                        ProcuringEntity = t.Pe?.Name,
                        Deadline = closeAt,
                        Category = "Government",
                        SubCategory = t.ProcurementCategory?.Name,
                        ProcurementMethod = t.ProcurementMethod?.Name,
                        BidBondRequired = bidBondRequired,
                        BidBondAmount = t.BidSecurityValue ?? 0,
                        TenderFee = t.TenderFee,
                        DocumentReleaseDate = publishedAt,
                        StartDate = publishedAt,
                        EndDate = openingDate,
                        DocumentUrl = documentUrl,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    db.ScrapedTenders.Add(record);
                    existingByExternalId[externalId] = record;
                    if (!string.IsNullOrEmpty(record.Title))
                        existingByTitle[record.Title] = record;
                    inserted++;
                }
            }

            // Save once per page instead of once per record
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Page {Page}/{Last} done", page, lastPage);
            nextPage:
            page++;
        } while (page <= lastPage);

        logger.LogInformation("tenders.go.ke sync complete — inserted: {Inserted}, updated: {Updated}", inserted, updated);
        return (inserted, updated);
    }

    private static DateTime? ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var formats = new[] { "yyyy-MM-ddTHH:mm:ss.ffffffZ", "yyyy-MM-ddTHH:mm:ssZ", "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd" };
        if (DateTime.TryParseExact(value.TrimEnd('Z'), formats, null, System.Globalization.DateTimeStyles.AssumeUniversal, out var dt))
            return dt.ToUniversalTime();
        if (DateTime.TryParse(value, null, System.Globalization.DateTimeStyles.AdjustToUniversal, out var dt2))
            return dt2;
        return null;
    }
}
