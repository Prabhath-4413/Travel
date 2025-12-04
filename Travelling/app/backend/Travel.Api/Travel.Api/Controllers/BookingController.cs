using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using Travel.Api.Data;
using Travel.Api.Models;
using Travel.Api.Services;
using Microsoft.AspNetCore.Authorization;


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

    [HttpGet("user-bookings")]
    [Authorize]
    public async Task<IActionResult> GetUserBookings()
    {
        try
        {
            _logger.LogInformation("GetUserBookings request received");

            var userId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
            if (userId == 0)
            {
                _logger.LogWarning("Unable to extract user ID from claims");
                return Unauthorized(new { message = "User ID not found in token" });
            }

            var bookings = await _context.Bookings
                .Include(b => b.BookingDestinations)
                .ThenInclude(bd => bd.Destination)
                .Where(b => b.UserId == userId && (b.Status == BookingStatus.Active || b.Status == BookingStatus.Confirmed) && b.Confirmed)
                .OrderByDescending(b => b.StartDate)
                .ToListAsync();

            var userBookings = bookings.Select(b => new UserBookingDto
            {
                BookingId = b.BookingId,
                Destinations = b.BookingDestinations != null && b.BookingDestinations.Any() 
                    ? string.Join(", ", b.BookingDestinations.Select(bd => bd.Destination?.Name ?? "Unknown"))
                    : "Unknown",
                StartDate = b.StartDate,
                Guests = b.Guests,
                Nights = b.Nights,
                TotalPrice = b.TotalPrice,
                Status = b.Status.ToString()
            }).ToList();

            _logger.LogInformation("Retrieved {Count} bookings for user {UserId}", userBookings.Count, userId);
            return Ok(userBookings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user bookings");
            return StatusCode(500, new { message = "Error retrieving bookings", error = ex.Message });
        }
    }

    [HttpPost("send-reschedule-otp")]
    [Authorize]
    public async Task<IActionResult> SendRescheduleOtp([FromBody] SendRescheduleOtpRequest request)
    {
        _logger.LogInformation("SendRescheduleOtp request received for booking {BookingId}", request.BookingId);

        var userId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
        if (userId == 0)
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        var booking = await _context.Bookings
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.BookingId == request.BookingId && b.UserId == userId);

        if (booking == null)
        {
            _logger.LogWarning("Booking not found for reschedule OTP: {BookingId}", request.BookingId);
            return NotFound(new { message = "Booking not found" });
        }

        if (booking.User == null)
        {
            _logger.LogWarning("User information not found for booking {BookingId}", request.BookingId);
            return BadRequest(new { message = "User information not found" });
        }

        if (request.NewStartDate <= DateTime.UtcNow)
        {
            _logger.LogWarning("Invalid date for reschedule: {NewStartDate}", request.NewStartDate);
            return BadRequest(new { message = "New start date must be in the future" });
        }

        var (otp, message, statusCode) = await _otpService.GenerateRescheduleOtpAsync(
            request.BookingId, 
            booking.User.Email, 
            request.NewStartDate,
            request.NewDestinationId);

        if (statusCode != 200)
        {
            _logger.LogWarning("Reschedule OTP generation failed for booking {BookingId}: {Message}", request.BookingId, message);
            return StatusCode(statusCode, new { message });
        }

        _logger.LogInformation("Reschedule OTP sent successfully for booking {BookingId}", request.BookingId);
        return Ok(new { message = "OTP sent successfully to your email" });
    }

    [HttpPost("verify-reschedule-otp")]
    [Authorize]
    public async Task<IActionResult> VerifyRescheduleOtp([FromBody] VerifyRescheduleOtpRequest request)
    {
        _logger.LogInformation("VerifyRescheduleOtp request received for booking {BookingId}", request.BookingId);

        var userId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
        if (userId == 0)
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        var booking = await _context.Bookings
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.BookingId == request.BookingId && b.UserId == userId);

        if (booking == null)
        {
            _logger.LogWarning("Booking not found for reschedule verification: {BookingId}", request.BookingId);
            return NotFound(new { message = "Booking not found" });
        }

        if (booking.User == null)
        {
            _logger.LogWarning("User information not found for reschedule verification: {BookingId}", request.BookingId);
            return BadRequest(new { message = "User information not found" });
        }

        var result = await _otpService.ValidateRescheduleOtpAsync(
    request.BookingId,
    booking.User.Email,
    request.Otp);

        if (!result.Success)
        {
            _logger.LogWarning("Reschedule OTP verification failed for booking {BookingId}", request.BookingId);
            return BadRequest(new { message = "Invalid or expired OTP" });
        }

        var newStartDate = result.NewStartDate;
        var newDestinationId = result.NewDestinationId;

        var (success, rescheduleMessage) = await _bookingService.RescheduleBookingAsync(
            request.BookingId,
            booking.User.Email,
            newStartDate,
            newDestinationId);


        if (!success)
        {
            _logger.LogWarning("Booking reschedule failed for booking {BookingId}: {Message}", request.BookingId, rescheduleMessage);
            return BadRequest(new { message = rescheduleMessage });
        }

        _logger.LogInformation("Booking rescheduled successfully for booking {BookingId}", request.BookingId);
        return Ok(new { message = "Booking rescheduled successfully", bookingId = request.BookingId });
    }

    [HttpPost("packages/create")]
    [Authorize]
    public async Task<IActionResult> CreatePackageBooking([FromBody] CreatePackageBookingRequest request)
    {
        _logger.LogInformation("CreatePackageBooking request received for user {UserId}, package {PackageId}", 
            request.UserId, request.PackageId);

        var userId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
        if (userId != request.UserId)
        {
            _logger.LogWarning("User ID mismatch: token user {TokenUser} vs request user {RequestUser}", userId, request.UserId);
            return Unauthorized(new { message = "User ID mismatch" });
        }

        var packageBookingService = HttpContext.RequestServices.GetRequiredService<IPackageBookingService>();
        
        var (bookingId, price, message) = await packageBookingService.CreatePackageBookingAsync(
            request.UserId,
            request.PackageId,
            request.Guests,
            request.Nights,
            request.StartDate);

        if (bookingId == 0)
        {
            _logger.LogWarning("Failed to create package booking: {Message}", message);
            return BadRequest(new { message });
        }

        _logger.LogInformation("Package booking created: {BookingId}", bookingId);
        return Ok(new { bookingId, price, message });
    }

    [HttpPost("packages/generate-otp")]
    public async Task<IActionResult> GeneratePackageOtp([FromBody] SendOtpRequest request)
    {
        _logger.LogInformation("GeneratePackageOtp request received for booking {BookingId}", request.BookingId);

        var booking = await _context.Bookings
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.BookingId == request.BookingId);

        if (booking == null)
        {
            _logger.LogWarning("Booking not found for OTP generation: {BookingId}", request.BookingId);
            return NotFound(new { message = "Booking not found" });
        }

        if (booking.User == null)
        {
            _logger.LogWarning("User information not found for booking {BookingId}", request.BookingId);
            return BadRequest(new { message = "User information not found" });
        }

        try
        {
            var (otp, otpMessage, statusCode) = await _otpService.GenerateOtpAsync(booking.BookingId, booking.User.Email);

            if (statusCode != 200)
            {
                _logger.LogWarning("OTP generation failed for booking {BookingId}: {Message} (Status: {StatusCode})",
                    request.BookingId, otpMessage, statusCode);
                return StatusCode(statusCode, new { message = otpMessage });
            }

            _logger.LogInformation("OTP sent successfully for package booking {BookingId}", booking.BookingId);
            return Ok(new { message = "OTP sent successfully to your email" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while generating OTP for booking {BookingId}: {Message}",
                request.BookingId, ex.Message);
            return StatusCode(500, new { message = $"Failed to send OTP: {ex.Message}" });
        }
    }

    [HttpPost("packages/verify-otp")]
    public async Task<IActionResult> VerifyPackageOtp([FromBody] VerifyOtpRequest request)
    {
        _logger.LogInformation("VerifyPackageOtp request received for booking {BookingId}", request.BookingId);

        var booking = await _context.Bookings
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.BookingId == request.BookingId);

        if (booking == null)
        {
            _logger.LogWarning("Booking not found for OTP verification: {BookingId}", request.BookingId);
            return NotFound(new { message = "Booking not found" });
        }

        if (booking.User == null)
        {
            _logger.LogWarning("User information not found for booking {BookingId}", request.BookingId);
            return BadRequest(new { message = "User information not found" });
        }

        var isOtpValid = await _otpService.ValidateOtpAsync(booking.BookingId, booking.User.Email, request.Otp);
        if (!isOtpValid)
        {
            _logger.LogWarning("OTP verification failed for booking {BookingId}: Invalid or expired OTP", request.BookingId);
            return BadRequest(new { message = "Invalid or expired OTP" });
        }

        await _otpService.MarkOtpAsUsedAsync(booking.BookingId, booking.User.Email);

        _logger.LogInformation("OTP verified successfully for package booking {BookingId}", booking.BookingId);
        return Ok(new { message = "OTP verified successfully", bookingId = booking.BookingId, email = booking.User.Email });
    }

    [HttpPost("packages/confirm")]
    public async Task<IActionResult> ConfirmPackageBooking([FromBody] ConfirmBookingRequest request)
    {
        _logger.LogInformation("ConfirmPackageBooking request received for booking {BookingId}, email {Email}",
            request.BookingId, request.Email);

        var packageBookingService = HttpContext.RequestServices.GetRequiredService<IPackageBookingService>();
        var (success, message) = await packageBookingService.ConfirmPackageBookingWithOtpAsync(request.BookingId, request.Email);

        if (!success)
        {
            _logger.LogWarning("Package booking confirmation failed for booking {BookingId}: {Message}", request.BookingId, message);
            return BadRequest(new { message });
        }

        _logger.LogInformation("Package booking confirmed successfully for booking {BookingId}", request.BookingId);
        return Ok(new { message = "Booking confirmed successfully", bookingId = request.BookingId });
    }

    [HttpGet("download-ticket/{bookingId}")]
    [Authorize]
    public async Task<IActionResult> DownloadTicket(int bookingId)
    {
        _logger.LogInformation("DownloadTicket request received for booking {BookingId}", bookingId);

        try
        {
            var userId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
            if (userId == 0)
            {
                _logger.LogWarning("Unable to extract user ID from claims for ticket download");
                return Unauthorized(new { message = "User ID not found in token" });
            }

            var booking = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.BookingDestinations)
                .ThenInclude(bd => bd.Destination)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId && b.UserId == userId);

            if (booking == null)
            {
                _logger.LogWarning("Booking not found or user not authorized for booking {BookingId}", bookingId);
                return StatusCode(403, new { message = "Booking not found or you are not authorized to access this booking" });
            }

            if (booking.User == null)
            {
                _logger.LogWarning("User information not found for booking {BookingId}", bookingId);
                return BadRequest(new { message = "User information not found" });
            }

            if (booking.Status != BookingStatus.Paid && booking.Status != BookingStatus.Confirmed)
            {
                _logger.LogWarning("Booking {BookingId} has invalid payment status: {Status}", bookingId, booking.Status);
                return BadRequest(new { message = "Ticket can only be downloaded for paid bookings" });
            }

            var destinationNames = booking.BookingDestinations?.Any() == true
                ? string.Join(", ", booking.BookingDestinations.Select(bd => bd.Destination?.Name ?? "Unknown"))
                : "Unknown";

            var destinations = booking.BookingDestinations?.Select(bd => bd.Destination?.DestinationId).FirstOrDefault() ?? 0;
            if (destinations == 0)
            {
                _logger.LogWarning("No destination found for booking {BookingId}", bookingId);
                return BadRequest(new { message = "Destination information not found" });
            }

            const decimal gstRate = 0.18m;
            var subTotal = booking.TotalPrice / (1 + gstRate);
            var gstAmount = booking.TotalPrice - subTotal;

            var ticketDetails = new TicketDetailsDto
            {
                BookingId = booking.BookingId,
                UserName = booking.User.Name,
                UserEmail = booking.User.Email,
                UserPhone = "Contact Support",
                Destinations = destinationNames,
                StartDate = booking.StartDate,
                Guests = booking.Guests,
                Nights = booking.Nights,
                SubTotal = Math.Round(subTotal, 2),
                GstAmount = Math.Round(gstAmount, 2),
                TotalAmount = booking.TotalPrice,
                PaymentStatus = "Paid",
                TicketNumber = $"TKT-{DateTime.UtcNow:yyyyMMdd}-{bookingId:D6}"
            };

            var ticketPdfService = HttpContext.RequestServices.GetRequiredService<ITicketPdfService>();
            var pdfBytes = await ticketPdfService.GenerateTicketPdfAsync(ticketDetails);

            var fileName = $"Ticket-{bookingId}-{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";

            _logger.LogInformation("Successfully generated ticket PDF for booking {BookingId}", bookingId);
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating ticket for booking {BookingId}: {Message}", bookingId, ex.Message);
            return StatusCode(500, new { message = "Error generating ticket", error = ex.Message });
        }
    }

    [HttpPost("verify-booking")]
    public async Task<IActionResult> VerifyBooking([FromBody] VerifyBookingQrDto request)
    {
        _logger.LogInformation("VerifyBooking request received");

        try
        {
            if (string.IsNullOrWhiteSpace(request.QrData))
            {
                _logger.LogWarning("QR data is empty or null");
                return BadRequest(new VerifyBookingResponseDto
                {
                    IsValid = false,
                    Message = "QR data cannot be empty"
                });
            }

            var qrData = System.Text.Json.JsonSerializer.Deserialize<TicketQrData>(request.QrData);

            if (qrData == null)
            {
                _logger.LogWarning("Failed to deserialize QR data");
                return BadRequest(new VerifyBookingResponseDto
                {
                    IsValid = false,
                    Message = "Invalid QR data format"
                });
            }

            var booking = await _context.Bookings
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.BookingId == qrData.BookingId && b.User!.Email == qrData.UserEmail);

            if (booking == null)
            {
                _logger.LogWarning("Booking verification failed: Booking {BookingId} with email {Email} not found", 
                    qrData.BookingId, qrData.UserEmail);
                return Ok(new VerifyBookingResponseDto
                {
                    IsValid = false,
                    Message = "Booking not found or email mismatch"
                });
            }

            if (booking.Status != BookingStatus.Paid && booking.Status != BookingStatus.Confirmed)
            {
                _logger.LogWarning("Booking {BookingId} verification failed: Invalid payment status {Status}", 
                    booking.BookingId, booking.Status);
                return Ok(new VerifyBookingResponseDto
                {
                    IsValid = false,
                    Message = "Booking payment not confirmed"
                });
            }

            if (booking.StartDate.Date != qrData.TravelDate.Date)
            {
                _logger.LogWarning("Booking {BookingId} verification failed: Travel date mismatch", booking.BookingId);
                return Ok(new VerifyBookingResponseDto
                {
                    IsValid = false,
                    Message = "Travel date mismatch"
                });
            }

            _logger.LogInformation("Booking {BookingId} verified successfully", booking.BookingId);
            return Ok(new VerifyBookingResponseDto
            {
                IsValid = true,
                BookingId = booking.BookingId,
                UserEmail = booking.User?.Email,
                TravelDate = booking.StartDate,
                Message = "Booking verified successfully"
            });
        }
        catch (System.Text.Json.JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error while verifying booking: {Message}", ex.Message);
            return BadRequest(new VerifyBookingResponseDto
            {
                IsValid = false,
                Message = "Invalid JSON format in QR data"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying booking: {Message}", ex.Message);
            return StatusCode(500, new VerifyBookingResponseDto
            {
                IsValid = false,
                Message = "Error verifying booking"
            });
        }
    }

    [HttpGet("{bookingId}")]
    public async Task<IActionResult> GetBookingDetails(int bookingId)
    {
        _logger.LogInformation("GetBookingDetails request received for booking {BookingId}", bookingId);

        try
        {
            var booking = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.BookingDestinations)
                .ThenInclude(bd => bd.Destination)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);

            if (booking == null)
            {
                _logger.LogWarning("Booking not found for booking {BookingId}", bookingId);
                return NotFound(new { message = "Booking not found" });
            }

            if (booking.User == null)
            {
                _logger.LogWarning("User information not found for booking {BookingId}", bookingId);
                return BadRequest(new { message = "User information not found" });
            }

            var destinationNames = booking.BookingDestinations?.Any() == true
                ? string.Join(", ", booking.BookingDestinations.Select(bd => bd.Destination?.Name ?? "Unknown"))
                : "Unknown";

            const decimal gstRate = 0.18m;
            var subTotal = booking.TotalPrice / (1 + gstRate);
            var gstAmount = booking.TotalPrice - subTotal;

            var paymentStatus = booking.Status switch
            {
                BookingStatus.Paid => "Paid",
                BookingStatus.PendingPayment => "Pending",
                BookingStatus.Confirmed => "Paid",
                _ => "Pending"
            };

            var bookingDetails = new BookingDetailsDto
            {
                BookingId = booking.BookingId,
                UserName = booking.User.Name,
                Email = booking.User.Email,
                PackageName = destinationNames,
                Date = booking.StartDate,
                Persons = booking.Guests,
                TotalAmount = booking.TotalPrice,
                GstAmount = Math.Round(gstAmount, 2),
                SubTotal = Math.Round(subTotal, 2),
                PaymentStatus = paymentStatus
            };

            _logger.LogInformation("Retrieved booking details for booking {BookingId}", bookingId);
            return Ok(bookingDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving booking details for booking {BookingId}: {Message}", bookingId, ex.Message);
            return StatusCode(500, new { message = "Error retrieving booking details", error = ex.Message });
        }
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

public class SendRescheduleOtpRequest
{
    public int BookingId { get; set; }
    public DateTime NewStartDate { get; set; }
    public int? NewDestinationId { get; set; }
}

public class VerifyRescheduleOtpRequest
{
    public int BookingId { get; set; }
    public string Otp { get; set; } = string.Empty;
}

public class CreatePackageBookingRequest
{
    public int UserId { get; set; }
    public int PackageId { get; set; }
    public int Guests { get; set; }
    public int Nights { get; set; }
    public DateTime StartDate { get; set; }
}