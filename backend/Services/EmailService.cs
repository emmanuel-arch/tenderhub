using System.Text;
using System.Text.Json;

namespace TenderHub.API.Services;

public class EmailService(
    IConfiguration config,
    ILogger<EmailService> logger,
    IHttpClientFactory httpClientFactory) : IEmailService
{
    public Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl)
    {
        logger.LogInformation("=== EMAIL VERIFICATION LINK ===");
        logger.LogInformation("To:   {Email}", toEmail);
        logger.LogInformation("Link: {Url}", verificationUrl);
        logger.LogInformation("================================");

        var subject = "Verify your TenderHub Kenya email";
        var body = $"""
            Hi {toName},

            Thank you for registering with TenderHub Kenya.

            Please verify your email address by clicking the link below:

            {verificationUrl}

            This link expires in 24 hours. If you did not create an account, you can safely ignore this email.

            — TenderHub Kenya Team
            """;

        return SendAsync(toEmail, toName, subject, body);
    }

    public Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetUrl)
    {
        logger.LogInformation("=== PASSWORD RESET LINK ===");
        logger.LogInformation("To:   {Email}", toEmail);
        logger.LogInformation("Link: {Url}", resetUrl);
        logger.LogInformation("===========================");

        var subject = "Reset your TenderHub Kenya password";
        var body = $"""
            Hi {toName},

            We received a request to reset your TenderHub Kenya password.

            Click the link below to set a new password:

            {resetUrl}

            This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.

            — TenderHub Kenya Team
            """;

        return SendAsync(toEmail, toName, subject, body);
    }

    public Task SendAdminInviteEmailAsync(string toEmail, string toName, string tempPassword, string loginUrl)
    {
        logger.LogInformation("=== ADMIN INVITE ===");
        logger.LogInformation("To:   {Email}", toEmail);
        logger.LogInformation("Temp: {Password}", tempPassword);
        logger.LogInformation("Link: {Url}", loginUrl);
        logger.LogInformation("====================");

        var subject = "You've been invited as a TenderHub Kenya Admin";
        var body = $"""
            Hi {toName},

            You have been invited to join TenderHub Kenya as an administrator.

            Your login credentials:
              Email:    {toEmail}
              Password: {tempPassword}

            Sign in here: {loginUrl}

            You will be required to change your password after signing in for the first time.

            — TenderHub Kenya Team
            """;

        return SendAsync(toEmail, toName, subject, body);
    }

    // ── Shared sender ─────────────────────────────────────────────────────────

    private async Task SendAsync(string toEmail, string toName, string subject, string body)
    {
        var apiKey = config["Mail:ResendApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return; // Dev mode: log only

        var fromAddr = config["Mail:From"] ?? "onboarding@resend.dev";
        var fromName = config["Mail:FromName"] ?? "TenderHub Kenya";

        var payload = new
        {
            from    = $"{fromName} <{fromAddr}>",
            to      = new[] { toEmail },
            subject,
            text    = body,
        };

        var json    = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var client = httpClientFactory.CreateClient("Resend");
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        var response = await client.PostAsync("https://api.resend.com/emails", content);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            logger.LogError("Resend API error {Status}: {Body}", response.StatusCode, error);
        }
    }
}
