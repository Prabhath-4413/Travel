using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Travel.Api.Data;
using Travel.Api.Models;
using Travel.Api.Services;

namespace Travel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IOtpService _otpService;
    private readonly IBookingService _bookingService;
    private readonly ILogger<BookingController> _logger;

    public BookingController(
        ApplicationDbContext context,
        IOtpService otpService,
        IBookingService bookingService,
        ILogger<BookingController> logger)
    {
        _context = context;
        _otpService = otpService;
        _bookingService = bookingService;
        _logger = logger;
    }

    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        _logger.LogInformation("SendOtp request received for booking {BookingId}", request.BookingId);

        var booking = await _context.Bookings
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.BookingId == request.BookingId);

        if (booking == null)
        {
            _logger.LogWarning("Booking not found for booking {BookingId}", request.BookingId);
            return NotFound(new { message = "Booking not found" });
        }

        if (booking.User == null)
        {
            _logger.LogWarning("User information not found for booking {BookingId}", request.BookingId);
            return BadRequest(new { message = "User information not found" });
        }

        var (otp, message, statusCode) = await _otpService.GenerateOtpAsync(booking.BookingId, booking.User.Email);

        if (statusCode != 200)
        {
            _logger.LogWarning("OTP generation failed for booking {BookingId}: {Message} (Status: {StatusCode})",
                request.BookingId, message, statusCode);
            return StatusCode(statusCode, new { message });
        }

        _logger.LogInformation("OTP sent successfully for booking {BookingId}", request.BookingId);
        return Ok(new { message = "OTP sent successfully to your email" });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        _logger.LogInformation("VerifyOtp request received for booking {BookingId}", request.BookingId);

        var booking = await _context.Bookings
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.BookingId == request.BookingId);

        if (booking == null)
        {
            _logger.LogWarning("Booking not found for verification attempt on booking {BookingId}", request.BookingId);
            return NotFound(new { message = "Booking not found" });
        }

        if (booking.User == null)
        {
            _logger.LogWarning("User information not found for verification attempt on booking {BookingId}", request.BookingId);
            return BadRequest(new { message = "User information not found" });
        }

        var isOtpValid = await _otpService.ValidateOtpAsync(booking.BookingId, booking.User.Email, request.Otp);
        if (!isOtpValid)
        {
            _logger.LogWarning("OTP verification failed for booking {BookingId}: Invalid or expired OTP", request.BookingId);
            return BadRequest(new { message = "Invalid or expired OTP" });
        }

        _logger.LogInformation("OTP verified successfully for booking {BookingId}", request.BookingId);
        return Ok(new { message = "OTP verified successfully", bookingId = booking.BookingId, email = booking.User.Email });
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> ConfirmBooking([FromBody] ConfirmBookingRequest request)
    {
        _logger.LogInformation("ConfirmBooking request received for booking {BookingId}, email {Email}",
            request.BookingId, request.Email);

        var (success, message) = await _bookingService.ConfirmBookingWithOtpAsync(request.BookingId, request.Email);

        if (!success)
        {
            _logger.LogWarning("Booking confirmation failed for booking {BookingId}: {Message}", request.BookingId, message);
            return BadRequest(new { message });
        }

        _logger.LogInformation("Booking confirmed successfully for booking {BookingId}", request.BookingId);
        return Ok(new { message = "Booking confirmed successfully", bookingId = request.BookingId });
    }

}

public class SendOtpRequest
{
    public int BookingId { get; set; }
}

public class VerifyOtpRequest
{
    public int BookingId { get; set; }
    public string Otp { get; set; } = string.Empty;
}

public class ConfirmBookingRequest
{
    public int BookingId { get; set; }
    public string Email { get; set; } = string.Empty;
}