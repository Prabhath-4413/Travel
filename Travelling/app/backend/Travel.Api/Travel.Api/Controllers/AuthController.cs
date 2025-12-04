using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travel.Api.Data;
using Travel.Api.Models;
using Travel.Api.Services;
using Google.Apis.Auth;

namespace Travel.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IAuthTokenService _tokenService;

    public AuthController(ApplicationDbContext db, IAuthTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest(new { message = "Email and password are required" });
            }

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var tokenResponse = _tokenService.GenerateTokenResponse(user);

            await _tokenService.StoreRefreshTokenAsync(user.UserId, tokenResponse.RefreshToken);

            Response.Cookies.Append("refreshToken", tokenResponse.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Ok(new
            {
                accessToken = tokenResponse.AccessToken,
                refreshToken = tokenResponse.RefreshToken,
                expiresIn = tokenResponse.ExpiresIn,
                tokenType = tokenResponse.TokenType,
                userId = user.UserId,
                name = user.Name,
                email = user.Email,
                role = user.Role,
                picture = user.Picture
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
    {
        try
        {
            var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();

            var payload = await GoogleJsonWebSignature.ValidateAsync(dto.Credential, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { configuration["Google:ClientId"] ?? throw new InvalidOperationException("Google ClientId not configured") }
            });

            var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject || u.Email == payload.Email);

            if (user == null)
            {
                user = new User
                {
                    Name = payload.Name,
                    Email = payload.Email,
                    Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                    Role = "user",
                    GoogleId = payload.Subject,
                    Picture = payload.Picture
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }
            else
            {
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

            var tokenResponse = _tokenService.GenerateTokenResponse(user);

            await _tokenService.StoreRefreshTokenAsync(user.UserId, tokenResponse.RefreshToken);

            Response.Cookies.Append("refreshToken", tokenResponse.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Ok(new
            {
                accessToken = tokenResponse.AccessToken,
                refreshToken = tokenResponse.RefreshToken,
                expiresIn = tokenResponse.ExpiresIn,
                tokenType = tokenResponse.TokenType,
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

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.RefreshToken))
            {
                return BadRequest(new { message = "Refresh token is required" });
            }

            var result = await _tokenService.RefreshTokenAsync(dto.RefreshToken);

            if (result == null)
            {
                return Unauthorized(new { message = "Invalid or expired refresh token" });
            }

            var (newAccessToken, newRefreshToken) = result.Value;

            var accessTokenExpireMinutes = int.Parse(HttpContext.RequestServices.GetRequiredService<IConfiguration>()["JWT:AccessTokenExpireMinutes"] ?? "15");

            Response.Cookies.Append("refreshToken", newRefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Ok(new
            {
                accessToken = newAccessToken,
                refreshToken = newRefreshToken,
                expiresIn = accessTokenExpireMinutes * 60,
                tokenType = "Bearer"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest dto)
    {
        try
        {
            if (!string.IsNullOrEmpty(dto.RefreshToken))
            {
                await _tokenService.RevokeRefreshTokenAsync(dto.RefreshToken);
            }

            Response.Cookies.Delete("refreshToken");

            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }
}

public class GoogleLoginDto
{
    public string Credential { get; set; } = string.Empty;
}