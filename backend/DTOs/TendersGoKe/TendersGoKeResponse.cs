using System.Text.Json.Serialization;

namespace TenderHub.API.DTOs.TendersGoKe;

public class TendersGoKeResponse
{
    [JsonPropertyName("data")]
    public List<TendersGoKeTenderDto> Data { get; set; } = [];

    [JsonPropertyName("current_page")]
    public int CurrentPage { get; set; }

    [JsonPropertyName("last_page")]
    public int LastPage { get; set; }

    [JsonPropertyName("next_page_url")]
    public string? NextPageUrl { get; set; }
}

public class TendersGoKeTenderDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("tender_ref")]
    public string? TenderRef { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("published_at")]
    public string? PublishedAt { get; set; }

    [JsonPropertyName("close_at")]
    public string? CloseAt { get; set; }

    [JsonPropertyName("opening_date")]
    public string? OpeningDate { get; set; }

    [JsonPropertyName("venue")]
    public string? Venue { get; set; }

    [JsonPropertyName("tender_fee")]
    public decimal? TenderFee { get; set; }

    [JsonPropertyName("bid_security_percent")]
    public decimal? BidSecurityPercent { get; set; }

    [JsonPropertyName("bid_security_value")]
    public decimal? BidSecurityValue { get; set; }

    [JsonPropertyName("validity_in_days")]
    public int? ValidityInDays { get; set; }

    [JsonPropertyName("is_agpo")]
    public bool? IsAgpo { get; set; }

    [JsonPropertyName("pe")]
    public TendersGoKePeDto? Pe { get; set; }

    [JsonPropertyName("procurement_method")]
    public TendersGoKeNamedDto? ProcurementMethod { get; set; }

    [JsonPropertyName("procurement_category")]
    public TendersGoKeNamedDto? ProcurementCategory { get; set; }

    [JsonPropertyName("documents")]
    public List<TendersGoKeDocumentDto> Documents { get; set; } = [];
}

public class TendersGoKePeDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }
}

public class TendersGoKeNamedDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }
}

public class TendersGoKeDocumentDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("url")]
    public string? Url { get; set; }

    [JsonPropertyName("document_type_id")]
    public int? DocumentTypeId { get; set; }
}
