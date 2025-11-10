using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travel.Api.Data;
using Travel.Api.Models;
using Google.Apis.Auth;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;

namespace Travel.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthController(ApplicationDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
    {
        try
        {
            // Validate Google JWT token
            var payload = await GoogleJsonWebSignature.ValidateAsync(dto.Credential, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _configuration["Google:ClientId"] ?? throw new InvalidOperationException("Google ClientId not configured") }
            });

            // Check if user exists by GoogleId or Email
            var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject || u.Email == payload.Email);

            if (user == null)
            {
                // Create new user
                user = new User
                {
                    Name = payload.Name,
                    Email = payload.Email,
                    Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // Random password for Google users
                    Role = "user",
                    GoogleId = payload.Subject,
                    Picture = payload.Picture
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }
            else
            {
                // Update existing user with Google info if not already set
                if (string.IsNullOrEmpty(user.GoogleId))
                {
                    user.GoogleId = payload.Subject;
                }
                if (string.IsNullOrEmpty(user.Picture))
                {
                    user.Picture = payload.Picture;
                }
                await _db.SaveChangesAsync();
            }

            // Generate JWT token
            var token = CreateJwt(user);

            return Ok(new
            {
                token = token,
                userId = user.UserId,
                name = user.Name,
                email = user.Email,
                role = user.Role,
                picture = user.Picture
            });
        }
        catch (InvalidJwtException)
        {
            return BadRequest(new { message = "Invalid Google credential" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    private string CreateJwt(User user)
    {
        var jwtKey = _configuration["JWT:Key"] ?? "dev_secret_key_change_me";
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
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class GoogleLoginDto
{
    public string Credential { get; set; } = string.Empty;
}