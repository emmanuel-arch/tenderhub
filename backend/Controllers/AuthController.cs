using Microsoft.AspNetCore.Mvc;
using TenderHub.API.DTOs.Auth;
using TenderHub.API.Services;

namespace TenderHub.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>Register a new client account. Returns a prompt to verify email — no JWT issued yet.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var result = await authService.RegisterAsync(request);
            return StatusCode(201, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Login and receive a JWT token. Blocked until email is verified.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var result = await authService.LoginAsync(request);
            return Ok(result);
        }
        catch (EmailNotConfirmedException ex)
        {
            return StatusCode(403, new
            {
                message   = ex.Message,
                errorCode = "EMAIL_NOT_CONFIRMED",
                email     = ex.Email,
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>Verify email address using the token sent to the user's inbox.</summary>
    [HttpPost("verify-email")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        try
        {
            await authService.VerifyEmailAsync(request.Token);
            return Ok(new { message = "Email verified successfully. You can now sign in." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Resend a verification email. Silently succeeds even for unknown emails.</summary>
    [HttpPost("resend-verification")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
    {
        await authService.ResendVerificationAsync(request.Email);
        return Ok(new { message = "If this email is registered and unverified, a new verification link has been sent." });
    }

    /// <summary>Request a password-reset email. Silently succeeds even for unknown emails.</summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await authService.ForgotPasswordAsync(request.Email);
        return Ok(new { message = "If this email is registered, a password reset link has been sent." });
    }

    /// <summary>Set a new password using the token from the reset email.</summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            await authService.ResetPasswordAsync(request.Token, request.NewPassword);
            return Ok(new { message = "Password reset successfully. You can now sign in with your new password." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
