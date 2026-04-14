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
}
