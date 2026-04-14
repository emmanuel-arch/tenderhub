using System.ComponentModel.DataAnnotations;

namespace TenderHub.API.DTOs.Auth;

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(2)]
    public string Name { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Optional. If this matches Admin:RegistrationCode in config, the account is created as Admin.
    /// </summary>
    public string? AdminCode { get; set; }
}

public class RegisterResponse
{
    public bool RequiresEmailVerification { get; set; } = true;
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class VerifyEmailRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;
}

public class ResendVerificationRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}
