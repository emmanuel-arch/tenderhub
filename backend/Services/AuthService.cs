using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TenderHub.API.Data;
using TenderHub.API.DTOs.Auth;
using TenderHub.API.Models;
// PasswordResetToken and EmailVerificationToken are in TenderHub.API.Models

namespace TenderHub.API.Services;

public class AuthService(
    ApplicationDbContext db,
    IConfiguration config,
    IEmailService emailService) : IAuthService
{
    // ── Login ────────────────────────────────────────────────────────────────

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower())
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!user.EmailConfirmed)
            throw new EmailNotConfirmedException(user.Email);

        if (!user.IsActive)
            throw new UnauthorizedAccessException("This account has been deactivated. Contact your administrator.");

        return BuildResponse(user);
    }

    // ── Register ─────────────────────────────────────────────────────────────

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request)
    {
        var exists = await db.Users.AnyAsync(u => u.Email == request.Email.ToLower());
        if (exists)
            throw new InvalidOperationException("An account with this email already exists.");

        var user = new User
        {
            Email          = request.Email.ToLower(),
            Name           = request.Name,
            PasswordHash   = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role           = UserRole.Client,
            EmailConfirmed = false,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        await SendVerificationTokenAsync(user);

        return new RegisterResponse
        {
            RequiresEmailVerification = true,
            Email   = user.Email,
            Message = "Account created. Please check your email to verify your address.",
        };
    }

    // ── Verify Email ─────────────────────────────────────────────────────────

    public async Task VerifyEmailAsync(string rawToken)
    {
        var hash = HashToken(rawToken);

        var record = await db.EmailVerificationTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash)
            ?? throw new InvalidOperationException("Verification link is invalid or has already been used.");

        if (record.ExpiresAt < DateTime.UtcNow)
        {
            db.EmailVerificationTokens.Remove(record);
            await db.SaveChangesAsync();
            throw new InvalidOperationException("Verification link has expired. Please request a new one.");
        }

        record.User.EmailConfirmed = true;
        db.EmailVerificationTokens.Remove(record);
        await db.SaveChangesAsync();
    }

    // ── Resend Verification ───────────────────────────────────────────────────

    public async Task ResendVerificationAsync(string email)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == email.ToLower());

        // Silently return for unknown emails or already-confirmed accounts (security)
        if (user == null || user.EmailConfirmed) return;

        // Invalidate all previous tokens for this user
        var old = db.EmailVerificationTokens.Where(t => t.UserId == user.Id);
        db.EmailVerificationTokens.RemoveRange(old);
        await db.SaveChangesAsync();

        await SendVerificationTokenAsync(user);
    }

    // ── Forgot Password ───────────────────────────────────────────────────────

    public async Task ForgotPasswordAsync(string email)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower());
        if (user == null) return; // Silently succeed — don't reveal whether email exists

        // Invalidate any existing reset tokens
        var old = db.PasswordResetTokens.Where(t => t.UserId == user.Id);
        db.PasswordResetTokens.RemoveRange(old);
        await db.SaveChangesAsync();

        var rawBytes = RandomNumberGenerator.GetBytes(64);
        var rawToken = Convert.ToBase64String(rawBytes)
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId    = user.Id,
            TokenHash = HashToken(rawToken),
            ExpiresAt = DateTime.UtcNow.AddHours(1),
        });
        await db.SaveChangesAsync();

        var appUrl   = config["AppUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
        var resetUrl = $"{appUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}";

        await emailService.SendPasswordResetEmailAsync(user.Email, user.Name, resetUrl);
    }

    // ── Reset Password ────────────────────────────────────────────────────────

    public async Task ResetPasswordAsync(string rawToken, string newPassword)
    {
        var hash = HashToken(rawToken);

        var record = await db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash)
            ?? throw new InvalidOperationException("Reset link is invalid or has already been used.");

        if (record.ExpiresAt < DateTime.UtcNow)
        {
            db.PasswordResetTokens.Remove(record);
            await db.SaveChangesAsync();
            throw new InvalidOperationException("Reset link has expired. Please request a new one.");
        }

        record.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        db.PasswordResetTokens.Remove(record);
        await db.SaveChangesAsync();
    }

    // ── Setup ─────────────────────────────────────────────────────────────────

    public async Task<bool> IsSetupDoneAsync()
    {
        return await db.Users.AnyAsync(u => u.Role == UserRole.SuperAdmin || u.Role == UserRole.Admin);
    }

    public async Task SetupSuperAdminAsync(SetupRequest request)
    {
        var alreadySetup = await IsSetupDoneAsync();
        if (alreadySetup)
            throw new InvalidOperationException("Setup has already been completed.");

        var user = new User
        {
            Email              = request.Email.ToLower(),
            Name               = request.Name,
            PasswordHash       = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role               = UserRole.SuperAdmin,
            EmailConfirmed     = true,
            MustChangePassword = false,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
    }

    // ── Invite Admin ─────────────────────────────────────────────────────────

    public async Task InviteAdminAsync(InviteAdminRequest request)
    {
        var exists = await db.Users.AnyAsync(u => u.Email == request.Email.ToLower());
        if (exists)
            throw new InvalidOperationException("An account with this email already exists.");

        var tempPassword = GenerateTempPassword();

        var user = new User
        {
            Email              = request.Email.ToLower(),
            Name               = request.Name,
            PasswordHash       = BCrypt.Net.BCrypt.HashPassword(tempPassword),
            Role               = UserRole.Admin,
            EmailConfirmed     = true,
            MustChangePassword = true,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var appUrl   = config["AppUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
        var loginUrl = $"{appUrl}/login";

        await emailService.SendAdminInviteEmailAsync(user.Email, user.Name, tempPassword, loginUrl);
    }

    // ── Change Password ───────────────────────────────────────────────────────

    public async Task ChangePasswordAsync(Guid userId, string newPassword)
    {
        var user = await db.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("User not found.");

        user.PasswordHash       = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.MustChangePassword = false;
        await db.SaveChangesAsync();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task SendVerificationTokenAsync(User user)
    {
        // Generate a cryptographically random 64-byte token
        var rawBytes = RandomNumberGenerator.GetBytes(64);
        var rawToken = Convert.ToBase64String(rawBytes)
            .Replace('+', '-').Replace('/', '_').TrimEnd('='); // URL-safe base64

        var token = new EmailVerificationToken
        {
            UserId    = user.Id,
            TokenHash = HashToken(rawToken),
            ExpiresAt = DateTime.UtcNow.AddHours(24),
        };

        db.EmailVerificationTokens.Add(token);
        await db.SaveChangesAsync();

        var appUrl = config["AppUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
        var verificationUrl = $"{appUrl}/verify-email?token={Uri.EscapeDataString(rawToken)}";

        await emailService.SendVerificationEmailAsync(user.Email, user.Name, verificationUrl);
    }

    private static string GenerateTempPassword()
    {
        const string upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string lower   = "abcdefghjkmnpqrstuvwxyz";
        const string digits  = "23456789";
        const string special = "@#$!%";
        const string all     = upper + lower + digits + special;

        var rng = RandomNumberGenerator.GetBytes(12);
        // Guarantee at least one of each required character class
        var chars = new char[12];
        chars[0] = upper[rng[0]   % upper.Length];
        chars[1] = lower[rng[1]   % lower.Length];
        chars[2] = digits[rng[2]  % digits.Length];
        chars[3] = special[rng[3] % special.Length];
        for (int i = 4; i < 12; i++)
            chars[i] = all[rng[i] % all.Length];

        // Shuffle
        var shuffleBytes = RandomNumberGenerator.GetBytes(12);
        for (int i = chars.Length - 1; i > 0; i--)
        {
            int j = shuffleBytes[i] % (i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }
        return new string(chars);
    }

    private static string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private LoginResponse BuildResponse(User user)
    {
        var expiry = DateTime.UtcNow.AddHours(
            config.GetValue<int>("Jwt:ExpiryHours", 24));

        return new LoginResponse
        {
            Token     = GenerateToken(user, expiry),
            ExpiresAt = expiry,
            User = new UserProfile
            {
                Id                 = user.Id,
                Email              = user.Email,
                Name               = user.Name,
                Role               = user.Role.ToString(),
                MustChangePassword = user.MustChangePassword,
            }
        };
    }

    private string GenerateToken(User user, DateTime expiry)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(config["Jwt:Secret"]
                ?? throw new InvalidOperationException("Jwt:Secret is not configured.")));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name,               user.Name),
            new Claim(ClaimTypes.Role,               user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString())
        };

        var jwt = new JwtSecurityToken(
            issuer:             config["Jwt:Issuer"],
            audience:           config["Jwt:Audience"],
            claims:             claims,
            expires:            expiry,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }
}
