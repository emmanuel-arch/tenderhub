namespace TenderHub.API.Services;

public class TendersGoKeBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<TendersGoKeBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan SyncInterval = TimeSpan.FromHours(6);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Run immediately on startup
        await RunSyncAsync(stoppingToken);

        // Then repeat every 6 hours
        using var timer = new PeriodicTimer(SyncInterval);
        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunSyncAsync(stoppingToken);
        }
    }

    private async Task RunSyncAsync(CancellationToken ct)
    {
        logger.LogInformation("Starting tenders.go.ke sync...");
        try
        {
            using var scope = scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<TendersGoKeSyncService>();
            var (inserted, updated) = await svc.SyncAsync(ct);
            logger.LogInformation("tenders.go.ke sync done — inserted: {Inserted}, updated: {Updated}", inserted, updated);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "tenders.go.ke sync failed");
        }
    }
}
