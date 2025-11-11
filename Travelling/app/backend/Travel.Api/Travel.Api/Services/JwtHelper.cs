using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Travel.Api.Services;

public class JwtHelper
{
    private readonly IConfiguration _configuration;

    public JwtHelper(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GeneratePaymentToken(int bookingId)
    {
        var jwtKey = _configuration["JWT:Key"] ?? throw new InvalidOperationException("JWT Key not found");
        var issuer = _configuration["JWT:Issuer"] ?? "TravelApp";
        var audience = _configuration["JWT:Audience"] ?? "TravelAppUsers";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, bookingId.ToString()),
            new Claim("purpose", "payment"),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24), // Short-lived token for payment
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public bool ValidatePaymentToken(string token, out int bookingId)
    {
        bookingId = 0;

        try
        {
            var jwtKey = _configuration["JWT:Key"] ?? throw new InvalidOperationException("JWT Key not found");
            var issuer = _configuration["JWT:Issuer"] ?? "TravelApp";
            var audience = _configuration["JWT:Audience"] ?? "TravelAppUsers";

            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            var purposeClaim = principal.FindFirst("purpose")?.Value;
            if (purposeClaim != "payment")
            {
                return false;
            }

            var subClaim = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (!int.TryParse(subClaim, out bookingId))
            {
                return false;
            }

            return true;
        }
        catch
        {
            return false;
        }
    }
}