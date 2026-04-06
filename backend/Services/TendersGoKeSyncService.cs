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
    private const int TenderNoticeDocTypeId = 7;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<(int inserted, int updated)> SyncAsync(CancellationToken ct = default)
    {
        var client = httpClientFactory.CreateClient("TendersGoKe");
        int inserted = 0, updated = 0, page = 1, lastPage = 1;

        // Load all existing ExternalIds for this source once — avoids per-record DB lookups
        var existingByExternalId = await db.ScrapedTenders
            .Where(s => s.Source == Source)
            .ToDictionaryAsync(s => s.ExternalId ?? "", s => s, ct);

        do
        {
            var url = $"{BaseUrl}?perpage=50&order=asc&page={page}";
            logger.LogInformation("Fetching {Url}", url);

            TendersGoKeResponse? response;
            try
            {
                var json = await client.GetStringAsync(url, ct);
                response = JsonSerializer.Deserialize<TendersGoKeResponse>(json, JsonOptions);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to fetch page {Page} from tenders.go.ke", page);
                break;
            }

            if (response?.Data is null or { Count: 0 }) break;

            lastPage = response.LastPage;
            var now = DateTime.UtcNow;

            foreach (var t in response.Data)
            {
                var externalId = t.Id.ToString();
                var closeAt = ParseDate(t.CloseAt);
                var publishedAt = ParseDate(t.PublishedAt);
                var openingDate = ParseDate(t.OpeningDate);
                var bidBondRequired = (t.BidSecurityValue ?? 0) > 0 || (t.BidSecurityPercent ?? 0) > 0;
                var noticeDoc = t.Documents.FirstOrDefault(d => d.DocumentTypeId == TenderNoticeDocTypeId)
                             ?? t.Documents.FirstOrDefault();
                var documentUrl = noticeDoc?.Url is { } u ? BaseWebUrl + u : null;
                var tenderNoticeUrl = documentUrl;

                // Skip expired tenders entirely
                if (closeAt.HasValue && closeAt.Value < now) continue;

                if (existingByExternalId.TryGetValue(externalId, out var existing))
                {
                    existing.Title = t.Title;
                    existing.TenderNumber = t.TenderRef;
                    existing.ProcuringEntity = t.Pe?.Name;
                    existing.Deadline = closeAt;
                    existing.SubCategory = t.ProcurementCategory?.Name;
                    existing.ProcurementMethod = t.ProcurementMethod?.Name;
                    existing.BidBondRequired = bidBondRequired;
                    existing.BidBondAmount = t.BidSecurityValue ?? 0;
                    existing.DocumentReleaseDate = publishedAt;
                    existing.StartDate = publishedAt;
                    existing.EndDate = openingDate;
                    existing.DocumentUrl = documentUrl;
                    existing.TenderNoticeUrl = tenderNoticeUrl;
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
                        DocumentReleaseDate = publishedAt,
                        StartDate = publishedAt,
                        EndDate = openingDate,
                        DocumentUrl = documentUrl,
                        TenderNoticeUrl = tenderNoticeUrl,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    db.ScrapedTenders.Add(record);
                    existingByExternalId[externalId] = record;
                    inserted++;
                }
            }

            // Save once per page instead of once per record
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Page {Page}/{Last} done", page, lastPage);
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
