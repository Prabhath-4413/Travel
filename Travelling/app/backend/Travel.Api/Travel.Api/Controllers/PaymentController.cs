using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travel.Api.Data;
using Travel.Api.Models;
using Travel.Api.Services;

namespace Travel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IRazorpayService _razorpayService;
    private readonly IEmailService _emailService;
    private readonly JwtHelper _jwtHelper;
    private readonly IConfiguration _configuration;

    public PaymentController(
        ApplicationDbContext context,
        IRazorpayService razorpayService,
        IEmailService emailService,
        JwtHelper jwtHelper,
        IConfiguration configuration)
    {
        _context = context;
        _razorpayService = razorpayService;
        _emailService = emailService;
        _jwtHelper = jwtHelper;
        _configuration = configuration;
    }

    [HttpPost("create-order")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        // Validate token
        if (!_jwtHelper.ValidatePaymentToken(request.Token, out var bookingId))
        {
            return Unauthorized("Invalid or expired token");
        }

        var booking = await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.BookingDestinations)
            .ThenInclude(bd => bd.Destination)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId);

        if (booking == null)
        {
            return NotFound("Booking not found");
        }

        if (booking.Status != BookingStatus.PendingPayment)
        {
            return BadRequest("Booking is not ready for payment");
        }

        // Create Razorpay order
        var orderResponse = await _razorpayService.CreateOrderAsync(
            booking.TotalPrice,
            booking.BookingId.ToString()
        );

        // Create payment record
        var payment = new Payment
        {
            RazorpayOrderId = orderResponse.OrderId,
            Amount = booking.TotalPrice,
            BookingId = booking.BookingId,
            Status = PaymentStatus.Pending
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            order_id = orderResponse.OrderId,
            amount = (int)(booking.TotalPrice * 100), // Razorpay expects amount in paisa
            currency = "INR",
            key = _configuration["Razorpay:KeyId"]
        });
    }

    [HttpPost("verify-payment")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequest request)
    {
        // Verify Razorpay signature
        var isValid = _razorpayService.VerifyPaymentSignature(
            request.RazorpayOrderId,
            request.RazorpayPaymentId,
            request.RazorpaySignature
        );

        if (!isValid)
        {
            return BadRequest("Invalid payment signature");
        }

        // Find payment and booking
        var payment = await _context.Payments
            .Include(p => p.Booking)
            .ThenInclude(b => b.User)
            .Include(p => p.Booking)
            .ThenInclude(b => b.BookingDestinations)
            .ThenInclude(bd => bd.Destination)
            .FirstOrDefaultAsync(p => p.RazorpayOrderId == request.RazorpayOrderId);

        if (payment == null)
        {
            return NotFound("Payment not found");
        }

        // Update payment
        payment.RazorpayPaymentId = request.RazorpayPaymentId;
        payment.Status = PaymentStatus.Captured;
        payment.UpdatedAt = DateTime.UtcNow;

        // Update booking
        payment.Booking!.Status = BookingStatus.Paid;

        await _context.SaveChangesAsync();

        // Send booking confirmed email with QR code
        var destinations = string.Join(", ", payment.Booking.BookingDestinations.Select(bd => bd.Destination?.Name));
        var qrCodeData = $"BookingId:{payment.Booking.BookingId};Amount:{payment.Amount};Date:{DateTime.UtcNow:yyyy-MM-dd}";
        var emailBody = GenerateBookingConfirmedEmail(payment.Booking, destinations, qrCodeData);

        await _emailService.SendEmailAsync(
            payment.Booking.User!.Email,
            "Booking Confirmed - Payment Successful",
            emailBody
        );

        return Ok(new { message = "Payment verified and booking confirmed" });
    }

    private string GenerateBookingConfirmedEmail(Booking booking, string destinations, string qrCodeData)
    {
        // Generate QR code as base64
        var qrCodeBase64 = _emailService.GenerateQrCode(qrCodeData);

        return $@"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>Booking Confirmed</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #27ae60;'>Booking Confirmed!</h2>
                <p>Dear {booking.User?.Name},</p>
                <p>Your payment has been successfully processed. Your booking is now confirmed!</p>

                <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <h3>Booking Details</h3>
                    <p><strong>Booking ID:</strong> {booking.BookingId}</p>
                    <p><strong>Destinations:</strong> {destinations}</p>
                    <p><strong>Total Amount Paid:</strong> ₹{booking.TotalPrice:N2}</p>
                    <p><strong>Guests:</strong> {booking.Guests}</p>
                    <p><strong>Nights:</strong> {booking.Nights}</p>
                    <p><strong>Start Date:</strong> {booking.StartDate:dd/MM/yyyy}</p>
                    <p><strong>Payment Date:</strong> {DateTime.UtcNow:dd/MM/yyyy HH:mm UTC}</p>
                </div>

                <div style='text-align: center; margin: 30px 0;'>
                    <h3>Your Booking QR Code</h3>
                    <img src='data:image/png;base64,{qrCodeBase64}' alt='Booking QR Code' style='max-width: 200px; height: auto;' />
                    <p style='font-size: 12px; color: #666; margin-top: 10px;'>Present this QR code at check-in</p>
                </div>

                <p>Thank you for choosing our travel service. We wish you a wonderful trip!</p>

                <p>If you need to make any changes or have questions, please contact our support team.</p>

                <p>Best regards,<br>Travel App Team</p>
            </div>
        </body>
        </html>";
    }
}

public class CreateOrderRequest
{
    public string Token { get; set; } = string.Empty;
}

public class VerifyPaymentRequest
{
    public string RazorpayOrderId { get; set; } = string.Empty;
    public string RazorpayPaymentId { get; set; } = string.Empty;
    public string RazorpaySignature { get; set; } = string.Empty;
}