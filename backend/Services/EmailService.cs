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
        logger.LogInformation("=== EMAIL VERIFICATION LINK === To: {Email} | Link: {Url}", toEmail, verificationUrl);

        return SendAsync(toEmail, toName,
            subject: "Verify your TenderHub Kenya email",
            text: $"Hi {toName},\n\nVerify your email: {verificationUrl}\n\nThis link expires in 24 hours.\n\n— TenderHub Kenya",
            html: HtmlTemplate(toName,
                heading: "Verify your email",
                body: "Thank you for registering with <strong>TenderHub Kenya</strong>. Click the button below to verify your email address.",
                buttonText: "Verify Email",
                buttonUrl: verificationUrl,
                footer: "This link expires in 24 hours. If you didn't create an account, you can ignore this email."));
    }

    public Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetUrl)
    {
        logger.LogInformation("=== PASSWORD RESET LINK === To: {Email} | Link: {Url}", toEmail, resetUrl);

        return SendAsync(toEmail, toName,
            subject: "Reset your TenderHub Kenya password",
            text: $"Hi {toName},\n\nReset your password: {resetUrl}\n\nThis link expires in 1 hour.\n\n— TenderHub Kenya",
            html: HtmlTemplate(toName,
                heading: "Reset your password",
                body: "We received a request to reset your <strong>TenderHub Kenya</strong> password. Click the button below to set a new password.",
                buttonText: "Reset Password",
                buttonUrl: resetUrl,
                footer: "This link expires in 1 hour. If you didn't request a reset, you can ignore this email."));
    }

    public Task SendAdminInviteEmailAsync(string toEmail, string toName, string tempPassword, string loginUrl)
    {
        logger.LogInformation("=== ADMIN INVITE === To: {Email} | Temp: {Password} | Link: {Url}", toEmail, tempPassword, loginUrl);

        return SendAsync(toEmail, toName,
            subject: "You've been invited as a TenderHub Kenya Admin",
            text: $"Hi {toName},\n\nYou've been invited as an admin.\nEmail: {toEmail}\nPassword: {tempPassword}\n\nSign in: {loginUrl}\n\nYou'll be asked to change your password on first sign-in.\n\n— TenderHub Kenya",
            html: HtmlTemplate(toName,
                heading: "You're invited as an Admin",
                body: $"""
                    You have been invited to join <strong>TenderHub Kenya</strong> as an administrator.
                    Your temporary login credentials are below — you will be required to change your password after signing in.
                    <div style="margin:24px 0;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-family:monospace;font-size:14px;">
                      <div style="margin-bottom:6px;"><span style="color:#64748b;">Email &nbsp;&nbsp;&nbsp;</span> {toEmail}</div>
                      <div><span style="color:#64748b;">Password </span> {tempPassword}</div>
                    </div>
                    """,
                buttonText: "Sign In",
                buttonUrl: loginUrl,
                footer: "If you weren't expecting this invitation, please ignore this email."));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string HtmlTemplate(string name, string heading, string body, string buttonText, string buttonUrl, string footer) => $"""
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
            <tr><td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

                <!-- Logo -->
                <tr><td style="padding-bottom:24px;text-align:center;">
                  <span style="display:inline-block;background:#0f172a;color:#fff;font-weight:700;font-size:15px;padding:8px 16px;border-radius:8px;letter-spacing:0.3px;">TenderHub Kenya</span>
                </td></tr>

                <!-- Card -->
                <tr><td style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:40px 36px;">
                  <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">{heading}</h2>
                  <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Hi {name},</p>
                  <p style="margin:0 0 28px;color:#334155;font-size:15px;line-height:1.6;">{body}</p>
                  <a href="{buttonUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;">{buttonText}</a>
                  <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;">{footer}</p>
                </td></tr>

                <!-- Footer -->
                <tr><td style="padding:20px 0;text-align:center;font-size:12px;color:#94a3b8;">
                  © {DateTime.UtcNow.Year} TenderHub Kenya. All rights reserved.
                </td></tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;

    private async Task SendAsync(string toEmail, string toName, string subject, string text, string html)
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
            text,
            html,
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
