using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Travel.Api.Data;
using Travel.Api.Models;

namespace Travel.Api.Services;

public class AuthTokenService : IAuthTokenService
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthTokenService(ApplicationDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public TokenResponse GenerateTokenResponse(User user)
    {
        var jwtKey = _configuration["JWT:Key"] ?? "dev_secret_key_change_me";
        var accessTokenExpireMinutes = int.Parse(_configuration["JWT:AccessTokenExpireMinutes"] ?? "15");

        var accessToken = GenerateAccessToken(user, jwtKey, accessTokenExpireMinutes);
        var refreshToken = GenerateRefreshToken();

        return new TokenResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = accessTokenExpireMinutes * 60,
            TokenType = "Bearer"
        };
    }

    public async Task StoreRefreshTokenAsync(int userId, string refreshToken)
    {
        var refreshTokenExpireDays = int.Parse(_configuration["JWT:RefreshTokenExpireDays"] ?? "7");
        var tokenEntity = new RefreshToken
        {
            UserId = userId,
            Token = refreshToken,
            ExpiryDate = DateTime.UtcNow.AddDays(refreshTokenExpireDays),
            CreatedAt = DateTime.UtcNow
        };

        _db.RefreshTokens.Add(tokenEntity);
        await _db.SaveChangesAsync();
    }

    public async Task<(string accessToken, string refreshToken)?> RefreshTokenAsync(string refreshToken)
    {
        var tokenEntity = await _db.RefreshTokens.FirstOrDefaultAsync(rt =>
            rt.Token == refreshToken && !rt.IsRevoked && !rt.IsExpired);

        if (tokenEntity == null)
        {
            return null;
        }

        var user = await _db.Users.FindAsync(tokenEntity.UserId);
        if (user == null)
        {
            return null;
        }

        var jwtKey = _configuration["JWT:Key"] ?? "dev_secret_key_change_me";
        var accessTokenExpireMinutes = int.Parse(_configuration["JWT:AccessTokenExpireMinutes"] ?? "15");

        var newAccessToken = GenerateAccessToken(user, jwtKey, accessTokenExpireMinutes);
        var newRefreshToken = GenerateRefreshToken();

        tokenEntity.RevokedAt = DateTime.UtcNow;

        var newTokenEntity = new RefreshToken
        {
            UserId = user.UserId,
            Token = newRefreshToken,
            ExpiryDate = DateTime.UtcNow.AddDays(int.Parse(_configuration["JWT:RefreshTokenExpireDays"] ?? "7")),
            CreatedAt = DateTime.UtcNow
        };

        _db.RefreshTokens.Update(tokenEntity);
        _db.RefreshTokens.Add(newTokenEntity);
        await _db.SaveChangesAsync();

        return (newAccessToken, newRefreshToken);
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        var tokenEntity = await _db.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (tokenEntity != null)
        {
            tokenEntity.RevokedAt = DateTime.UtcNow;
            _db.RefreshTokens.Update(tokenEntity);
            await _db.SaveChangesAsync();
        }
    }

    private string GenerateAccessToken(User user, string jwtKey, int expireMinutes)
    {
        var jwtIssuer = _configuration["JWT:Issuer"] ?? "travel-api";
        var jwtAudience = _configuration["JWT:Audience"] ?? "travel-client";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expireMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        Span<byte> buffer = stackalloc byte[32];
        RandomNumberGenerator.Fill(buffer);
        return WebEncoders.Base64UrlEncode(buffer);
    }
}
