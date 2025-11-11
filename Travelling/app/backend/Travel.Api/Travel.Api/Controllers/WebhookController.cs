using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travel.Api.Data;
using Travel.Api.Models;
using Travel.Api.Services;
using System.Text.Json;

namespace Travel.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhookController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IRazorpayService _razorpayService;
    private readonly IEmailService _emailService;
    private readonly ILogger<WebhookController> _logger;

    public WebhookController(
        ApplicationDbContext context,
        IRazorpayService razorpayService,
        IEmailService emailService,
        ILogger<WebhookController> logger)
    {
        _context = context;
        _razorpayService = razorpayService;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("razorpay")]
    public async Task<IActionResult> RazorpayWebhook()
    {
        try
        {
            // Read the raw request body
            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync();

            // Get the signature from headers
            var signature = Request.Headers["X-Razorpay-Signature"].ToString();
            if (string.IsNullOrEmpty(signature))
            {
                _logger.LogWarning("Missing Razorpay signature header");
                return BadRequest("Missing signature");
            }

            // Verify webhook signature
            if (!_razorpayService.VerifyWebhookSignature(body, signature))
            {
                _logger.LogWarning("Invalid Razorpay webhook signature");
                return BadRequest("Invalid signature");
            }

            // Parse the webhook payload
            var webhookData = JsonSerializer.Deserialize<RazorpayWebhookPayload>(body);
            if (webhookData == null)
            {
                _logger.LogWarning("Failed to parse webhook payload");
                return BadRequest("Invalid payload");
            }

            _logger.LogInformation($"Received webhook event: {webhookData.Event}");

            // Handle different event types
            switch (webhookData.Event)
            {
                case "payment.captured":
                    await HandlePaymentCapturedAsync(webhookData);
                    break;

                case "refund.processed":
                    await HandleRefundProcessedAsync(webhookData);
                    break;

                default:
                    _logger.LogInformation($"Unhandled webhook event: {webhookData.Event}");
                    break;
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Razorpay webhook");
            return StatusCode(500, "Internal server error");
        }
    }

    private async Task HandlePaymentCapturedAsync(RazorpayWebhookPayload webhookData)
    {
        var paymentEntity = webhookData.Payload.Payment.Entity;

        // Find and update payment
        var payment = await _context.Payments
            .Include(p => p.Booking)
            .ThenInclude(b => b.User)
            .FirstOrDefaultAsync(p => p.RazorpayOrderId == paymentEntity.OrderId);

        if (payment == null)
        {
            _logger.LogWarning($"Payment not found for order ID: {paymentEntity.OrderId}");
            return;
        }

        // Update payment details
        payment.RazorpayPaymentId = paymentEntity.Id;
        payment.Status = PaymentStatus.Captured;
        payment.UpdatedAt = DateTime.UtcNow;

        // Update booking status if not already updated
        if (payment.Booking!.Status == BookingStatus.PendingPayment)
        {
            payment.Booking.Status = BookingStatus.Paid;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation($"Payment captured for booking ID: {payment.BookingId}");
    }

    private async Task HandleRefundProcessedAsync(RazorpayWebhookPayload webhookData)
    {
        var refundEntity = webhookData.Payload.Refund.Entity;

        // Find payment
        var payment = await _context.Payments
            .Include(p => p.Booking)
            .ThenInclude(b => b.User)
            .FirstOrDefaultAsync(p => p.RazorpayPaymentId == refundEntity.PaymentId);

        if (payment == null)
        {
            _logger.LogWarning($"Payment not found for refund payment ID: {refundEntity.PaymentId}");
            return;
        }

        // Create or update refund record
        var refund = await _context.Refunds
            .FirstOrDefaultAsync(r => r.RazorpayRefundId == refundEntity.Id);

        if (refund == null)
        {
            refund = new Refund
            {
                RazorpayRefundId = refundEntity.Id,
                PaymentId = payment.PaymentId,
                Amount = refundEntity.Amount / 100m, // Convert from paisa to rupees
                Status = RefundStatus.Processed,
                ProcessedAt = DateTime.UtcNow
            };
            _context.Refunds.Add(refund);
        }
        else
        {
            refund.Status = RefundStatus.Processed;
            refund.ProcessedAt = DateTime.UtcNow;
        }

        // Update payment status
        payment.Status = PaymentStatus.Refunded;
        payment.UpdatedAt = DateTime.UtcNow;

        // Update booking status
        payment.Booking!.Status = BookingStatus.RefundPending;

        await _context.SaveChangesAsync();

        // Send refund email
        var emailBody = GenerateRefundEmail(payment.Booking, refund.Amount);
        await _emailService.SendEmailAsync(
            payment.Booking.User!.Email,
            "Refund Processed",
            emailBody
        );

        _logger.LogInformation($"Refund processed for booking ID: {payment.BookingId}");
    }

    private string GenerateRefundEmail(Booking booking, decimal refundAmount)
    {
        return $@"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>Refund Processed</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #e74c3c;'>Refund Processed</h2>
                <p>Dear {booking.User?.Name},</p>
                <p>Your refund request has been processed successfully.</p>

                <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <p><strong>Booking ID:</strong> {booking.BookingId}</p>
                    <p><strong>Refund Amount:</strong> ₹{refundAmount:N2}</p>
                    <p><strong>Processed Date:</strong> {DateTime.UtcNow:dd/MM/yyyy HH:mm UTC}</p>
                </div>

                <p>Your refund will be credited to your original payment method within 3-7 working days.</p>

                <p>If you have any questions, please contact our support team.</p>

                <p>Best regards,<br>Travel App Team</p>
            </div>
        </body>
        </html>";
    }
}

// Webhook payload models
public class RazorpayWebhookPayload
{
    public string Event { get; set; } = string.Empty;
    public WebhookPayload Payload { get; set; } = new();
}

public class WebhookPayload
{
    public PaymentPayload Payment { get; set; } = new();
    public RefundPayload Refund { get; set; } = new();
}

public class PaymentPayload
{
    public PaymentEntity Entity { get; set; } = new();
}

public class RefundPayload
{
    public RefundEntity Entity { get; set; } = new();
}

public class PaymentEntity
{
    public string Id { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public int Amount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class RefundEntity
{
    public string Id { get; set; } = string.Empty;
    public string PaymentId { get; set; } = string.Empty;
    public int Amount { get; set; }
    public string Status { get; set; } = string.Empty;
}