using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travel.Api.Data;
using Travel.Api.Models;
using Travel.Api.Services;

namespace Travel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly JwtHelper _jwtHelper;
    private readonly IConfiguration _configuration;

    public BookingController(
        ApplicationDbContext context,
        IEmailService emailService,
        JwtHelper jwtHelper,
        IConfiguration configuration)
    {
        _context = context;
        _emailService = emailService;
        _jwtHelper = jwtHelper;
        _configuration = configuration;
    }

    [HttpPost("confirm-destination")]
    public async Task<IActionResult> ConfirmDestination([FromBody] ConfirmDestinationRequest request)
    {
        var booking = await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.BookingDestinations)
            .ThenInclude(bd => bd.Destination)
            .FirstOrDefaultAsync(b => b.BookingId == request.BookingId);

        if (booking == null)
        {
            return NotFound("Booking not found");
        }

        if (booking.Status != BookingStatus.Active)
        {
            return BadRequest("Booking is not in active state");
        }

        // Update booking status to PendingPayment
        booking.Status = BookingStatus.PendingPayment;
        await _context.SaveChangesAsync();

        // Generate short-lived token for secure payment link
        var token = _jwtHelper.GeneratePaymentToken(booking.BookingId);

        // Get frontend URL from config
        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
        var paymentUrl = $"{frontendUrl}/payment?bookingId={booking.BookingId}&token={token}";

        // Send confirmation email with Pay Now button
        var destinations = string.Join(", ", booking.BookingDestinations.Select(bd => bd.Destination?.Name));
        var emailBody = GenerateConfirmDestinationEmail(booking, destinations, paymentUrl);

        await _emailService.SendEmailAsync(
            booking.User!.Email,
            "Confirm Your Destination - Payment Required",
            emailBody
        );

        return Ok(new { message = "Destination confirmed. Payment email sent." });
    }

    private string GenerateConfirmDestinationEmail(Booking booking, string destinations, string paymentUrl)
    {
        return $@"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>Confirm Your Destination</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #2c3e50;'>Confirm Your Destination</h2>
                <p>Dear {booking.User?.Name},</p>
                <p>Your destination has been confirmed for your upcoming trip. Here are the details:</p>

                <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <p><strong>Booking ID:</strong> {booking.BookingId}</p>
                    <p><strong>Destinations:</strong> {destinations}</p>
                    <p><strong>Total Amount:</strong> ₹{booking.TotalPrice:N2}</p>
                    <p><strong>Guests:</strong> {booking.Guests}</p>
                    <p><strong>Nights:</strong> {booking.Nights}</p>
                    <p><strong>Start Date:</strong> {booking.StartDate:dd/MM/yyyy}</p>
                </div>

                <p>To complete your booking, please proceed with the payment:</p>

                <div style='text-align: center; margin: 30px 0;'>
                    <a href='{paymentUrl}' style='background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Pay Now</a>
                </div>

                <p><em>This payment link will expire in 24 hours for security reasons.</em></p>

                <p>If you have any questions, please contact our support team.</p>

                <p>Best regards,<br>Travel App Team</p>
            </div>
        </body>
        </html>";
    }
}

public class ConfirmDestinationRequest
{
    public int BookingId { get; set; }
}