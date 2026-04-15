using TenderHub.API.DTOs.Auth;

namespace TenderHub.API.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<RegisterResponse> RegisterAsync(RegisterRequest request);
    Task VerifyEmailAsync(string token);
    Task ResendVerificationAsync(string email);
    Task ForgotPasswordAsync(string email);
    Task ResetPasswordAsync(string token, string newPassword);
    Task<bool> IsSetupDoneAsync();
    Task SetupSuperAdminAsync(SetupRequest request);
    Task InviteAdminAsync(InviteAdminRequest request);
    Task ChangePasswordAsync(Guid userId, string newPassword);
}
