using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Travel.Api.Data;
using Travel.Api.Models;

namespace Travel.Api.Services;

public interface IOtpService
{
    Task<(string? Otp, string Message, int StatusCode)> GenerateOtpAsync(int bookingId, string email);
    Task<bool> ValidateOtpAsync(int bookingId, string email, string otp);
    Task MarkOtpAsUsedAsync(int bookingId, string email);
    Task<bool> IsOtpExpiredAsync(int bookingId, string email);
    Task<(string? Otp, string Message, int StatusCode)> GenerateRescheduleOtpAsync(int bookingId, string email, DateTime newStartDate, int? newDestinationId);
    Task<bool> ValidateRescheduleOtpAsync(int bookingId, string email, string otp, out DateTime newStartDate, out int? newDestinationId);
    Task MarkRescheduleOtpAsUsedAsync(int bookingId, string email);
}

public class OtpService : IOtpService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IOtpRateLimiter _rateLimiter;
    private readonly ILogger<OtpService> _logger;
    private const int OTP_LENGTH = 6;
    private const int OTP_EXPIRY_MINUTES = 5;

    public OtpService(
        ApplicationDbContext context, 
        IEmailService emailService,
        IOtpRateLimiter rateLimiter,
        ILogger<OtpService> logger)
    {
        _context = context;
        _emailService = emailService;
        _rateLimiter = rateLimiter;
        _logger = logger;
    }

    public async Task<(string? Otp, string Message, int StatusCode)> GenerateOtpAsync(int bookingId, string email)
    {
        _logger.LogInformation("OTP generation requested for booking {BookingId}, email {Email}", bookingId, email);

        var (allowed, rateLimitMessage) = await _rateLimiter.CheckRateLimitAsync(bookingId);
        if (!allowed)
        {
            _logger.LogWarning("OTP generation blocked due to rate limit for booking {BookingId}: {Message}", bookingId, rateLimitMessage);
            return (null, rateLimitMessage, 429);
        }

        var existingOtp = await _context.BookingOtps
            .FirstOrDefaultAsync(bo =>
                bo.BookingId == bookingId &&
                bo.Email == email &&
                !bo.Used &&
                bo.Expiry > DateTime.UtcNow);

        if (existingOtp != null)
        {
            _logger.LogInformation("Valid OTP already exists for booking {BookingId}, reusing existing OTP. Valid until {Expiry}",
                bookingId, existingOtp.Expiry);
            try
            {
                await SendOtpEmailAsync(email, existingOtp.Otp);
                await _rateLimiter.RecordOtpRequestAsync(bookingId);
                return (existingOtp.Otp, "OTP sent successfully to your email", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send OTP email for booking {BookingId}, email {Email}", bookingId, email);
                return (null, "Email failed to send", 500);
            }
        }

        var otp = GenerateRandomOtp();
        var expiry = DateTime.UtcNow.AddMinutes(OTP_EXPIRY_MINUTES);

        _logger.LogInformation("Generated new OTP for booking {BookingId}, expiry {Expiry}", bookingId, expiry);

        var bookingOtp = new BookingOtp
        {
            Email = email,
            BookingId = bookingId,
            Otp = otp,
            Expiry = expiry,
            Used = false
        };

        var existingUnusedOtps = _context.BookingOtps
            .Where(bo => bo.BookingId == bookingId && bo.Email == email && !bo.Used);

        _context.BookingOtps.RemoveRange(existingUnusedOtps);
        _context.BookingOtps.Add(bookingOtp);
        await _context.SaveChangesAsync();

        try
        {
            await SendOtpEmailAsync(email, otp);
            _logger.LogInformation("OTP email sent successfully for booking {BookingId} to {Email}", bookingId, email);
            await _rateLimiter.RecordOtpRequestAsync(bookingId);
            return (otp, "OTP sent successfully to your email", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP email for booking {BookingId}, email {Email}", bookingId, email);
            return (null, "Email failed to send", 500);
        }
    }

    public async Task<bool> ValidateOtpAsync(int bookingId, string email, string otp)
    {
        _logger.LogInformation("OTP validation requested for booking {BookingId}, email {Email}", bookingId, email);

        var bookingOtp = await _context.BookingOtps
            .FirstOrDefaultAsync(bo =>
                bo.BookingId == bookingId &&
                bo.Email == email &&
                bo.Otp == otp &&
                !bo.Used &&
                bo.Expiry > DateTime.UtcNow);

        if (bookingOtp != null)
        {
            _logger.LogInformation("OTP validation successful for booking {BookingId}", bookingId);
            return true;
        }

        _logger.LogWarning("OTP validation failed for booking {BookingId}: Invalid or expired OTP", bookingId);
        return false;
    }

    public async Task MarkOtpAsUsedAsync(int bookingId, string email)
    {
        _logger.LogInformation("Marking OTP as used for booking {BookingId}, email {Email}", bookingId, email);

        var bookingOtp = await _context.BookingOtps
            .FirstOrDefaultAsync(bo =>
                bo.BookingId == bookingId &&
                bo.Email == email &&
                !bo.Used);

        if (bookingOtp != null)
        {
            bookingOtp.Used = true;
            await _context.SaveChangesAsync();
            _logger.LogInformation("OTP marked as used for booking {BookingId}", bookingId);
        }
        else
        {
            _logger.LogWarning("Could not find unused OTP to mark as used for booking {BookingId}", bookingId);
        }
    }

    public async Task<bool> IsOtpExpiredAsync(int bookingId, string email)
    {
        var bookingOtp = await _context.BookingOtps
            .FirstOrDefaultAsync(bo =>
                bo.BookingId == bookingId &&
                bo.Email == email &&
                !bo.Used);

        var isExpired = bookingOtp == null || bookingOtp.Expiry <= DateTime.UtcNow;
        _logger.LogInformation("OTP expiry check for booking {BookingId}: {IsExpired}", bookingId, isExpired);
        return isExpired;
    }

    private string GenerateRandomOtp()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[4];
        rng.GetBytes(bytes);
        var number = BitConverter.ToUInt32(bytes, 0) % 1000000;
        var generatedOtp = number.ToString("D6");
        _logger.LogDebug("Generated OTP: {Otp}", generatedOtp);
        return generatedOtp;
    }

    private async Task SendOtpEmailAsync(string email, string otp)
    {
        _logger.LogInformation("Sending OTP email to {Email}", email);
        var subject = "Your OTP for Booking Verification";
        var body = EmailTemplates.VerificationOtp(otp);

        try
        {
            await _emailService.SendEmailAsync(email, subject, body);
            _logger.LogInformation("OTP email sent successfully to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP email to {Email}: {Message}", email, ex.Message);
            throw;
        }
    }

    public async Task<(string? Otp, string Message, int StatusCode)> GenerateRescheduleOtpAsync(int bookingId, string email, DateTime newStartDate, int? newDestinationId)
    {
        _logger.LogInformation("Reschedule OTP generation requested for booking {BookingId}, email {Email}", bookingId, email);

        var (allowed, rateLimitMessage) = await _rateLimiter.CheckRateLimitAsync(bookingId);
        if (!allowed)
        {
            _logger.LogWarning("Reschedule OTP generation blocked due to rate limit for booking {BookingId}: {Message}", bookingId, rateLimitMessage);
            return (null, rateLimitMessage, 429);
        }

        var existingOtp = await _context.RescheduleOtps
            .FirstOrDefaultAsync(ro =>
                ro.BookingId == bookingId &&
                ro.Email == email &&
                !ro.Used &&
                ro.Expiry > DateTime.UtcNow);

        if (existingOtp != null)
        {
            _logger.LogInformation("Valid reschedule OTP already exists for booking {BookingId}", bookingId);
            try
            {
                await SendRescheduleOtpEmailAsync(email, existingOtp.Otp);
                await _rateLimiter.RecordOtpRequestAsync(bookingId);
                return (existingOtp.Otp, "OTP sent successfully to your email", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send reschedule OTP email for booking {BookingId}", bookingId);
                return (null, "Email failed to send", 500);
            }
        }

        var otp = GenerateRandomOtp();
        var expiry = DateTime.UtcNow.AddMinutes(OTP_EXPIRY_MINUTES);

        var rescheduleOtp = new RescheduleOtp
        {
            Email = email,
            BookingId = bookingId,
            Otp = otp,
            NewStartDate = newStartDate,
            NewDestinationId = newDestinationId,
            Expiry = expiry,
            Used = false
        };

        var existingUnusedOtps = _context.RescheduleOtps
            .Where(ro => ro.BookingId == bookingId && ro.Email == email && !ro.Used);

        _context.RescheduleOtps.RemoveRange(existingUnusedOtps);
        _context.RescheduleOtps.Add(rescheduleOtp);
        await _context.SaveChangesAsync();

        try
        {
            await SendRescheduleOtpEmailAsync(email, otp);
            _logger.LogInformation("Reschedule OTP email sent successfully for booking {BookingId}", bookingId);
            await _rateLimiter.RecordOtpRequestAsync(bookingId);
            return (otp, "OTP sent successfully to your email", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send reschedule OTP email for booking {BookingId}", bookingId);
            return (null, "Email failed to send", 500);
        }
    }

    public async Task<bool> ValidateRescheduleOtpAsync(int bookingId, string email, string otp, out DateTime newStartDate, out int? newDestinationId)
    {
        _logger.LogInformation("Reschedule OTP validation requested for booking {BookingId}", bookingId);
        newStartDate = DateTime.MinValue;
        newDestinationId = null;

        var rescheduleOtp = await _context.RescheduleOtps
            .FirstOrDefaultAsync(ro =>
                ro.BookingId == bookingId &&
                ro.Email == email &&
                ro.Otp == otp &&
                !ro.Used &&
                ro.Expiry > DateTime.UtcNow);

        if (rescheduleOtp != null)
        {
            newStartDate = rescheduleOtp.NewStartDate;
            newDestinationId = rescheduleOtp.NewDestinationId;
            _logger.LogInformation("Reschedule OTP validation successful for booking {BookingId}", bookingId);
            return true;
        }

        _logger.LogWarning("Reschedule OTP validation failed for booking {BookingId}", bookingId);
        return false;
    }

    public async Task MarkRescheduleOtpAsUsedAsync(int bookingId, string email)
    {
        _logger.LogInformation("Marking reschedule OTP as used for booking {BookingId}", bookingId);

        var rescheduleOtp = await _context.RescheduleOtps
            .FirstOrDefaultAsync(ro =>
                ro.BookingId == bookingId &&
                ro.Email == email &&
                !ro.Used);

        if (rescheduleOtp != null)
        {
            rescheduleOtp.Used = true;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Reschedule OTP marked as used for booking {BookingId}", bookingId);
        }
        else
        {
            _logger.LogWarning("Could not find unused reschedule OTP to mark as used for booking {BookingId}", bookingId);
        }
    }

    private async Task SendRescheduleOtpEmailAsync(string email, string otp)
    {
        _logger.LogInformation("Sending reschedule OTP email to {Email}", email);
        var subject = "Your OTP for Trip Reschedule Verification";
        var body = EmailTemplates.RescheduleOtp(otp);

        try
        {
            await _emailService.SendEmailAsync(email, subject, body);
            _logger.LogInformation("Reschedule OTP email sent successfully to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send reschedule OTP email to {Email}: {Message}", email, ex.Message);
            throw;
        }
    }
}