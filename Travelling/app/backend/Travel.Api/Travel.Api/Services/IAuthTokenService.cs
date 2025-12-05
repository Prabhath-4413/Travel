using Travel.Api.Models;

namespace Travel.Api.Services;

public class TokenResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
    public string TokenType { get; set; } = "Bearer";
}

public interface IAuthTokenService
{
    TokenResponse GenerateTokenResponse(User user);
    Task StoreRefreshTokenAsync(int userId, string refreshToken);
    Task<(string accessToken, string refreshToken)?> RefreshTokenAsync(string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
}
