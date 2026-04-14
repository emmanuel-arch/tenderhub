namespace TenderHub.API.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl);
    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetUrl);
}
