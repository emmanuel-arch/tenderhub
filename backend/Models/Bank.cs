namespace TenderHub.API.Models;

public class Bank
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Logo { get; set; } = string.Empty;
    public string ProcessingTime { get; set; } = string.Empty;   // e.g. "2-3 business days"
    public string Fees { get; set; } = string.Empty;             // e.g. "KES 15,000 + 1.5% of bond value"
    public bool DigitalOption { get; set; }
    public decimal Rating { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Application> Applications { get; set; } = [];
}
