namespace TenderHub.API.Services;

public class EmailNotConfirmedException(string email)
    : Exception("Please verify your email address before signing in.")
{
    public string Email { get; } = email;
}
