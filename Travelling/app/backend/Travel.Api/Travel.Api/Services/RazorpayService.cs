using System.Security.Cryptography;
using System.Text;

namespace Travel.Api.Services;

public class RazorpayService : IRazorpayService
{
    private readonly IConfiguration _configuration;
    private readonly string _keyId;
    private readonly string _keySecret;
    private readonly string _webhookSecret;

    public RazorpayService(IConfiguration configuration)
    {
        _configuration = configuration;
        _keyId = _configuration["Razorpay:KeyId"] ?? throw new InvalidOperationException("Razorpay KeyId not configured");
        _keySecret = _configuration["Razorpay:KeySecret"] ?? throw new InvalidOperationException("Razorpay KeySecret not configured");
        _webhookSecret = _configuration["Razorpay:WebhookSecret"] ?? throw new InvalidOperationException("Razorpay WebhookSecret not configured");
    }

    public async Task<OrderResponse> CreateOrderAsync(decimal amount, string receipt)
    {
        // Note: This is a simplified implementation. In production, you should use the official Razorpay .NET SDK
        // For now, this demonstrates the structure. You'll need to install Razorpay package and replace this logic.

        // Convert amount to paisa (Razorpay expects amount in smallest currency unit)
        var amountInPaisa = (int)(amount * 100);

        // Generate a unique order ID (in production, this would come from Razorpay API)
        var orderId = $"order_{Guid.NewGuid().ToString().Replace("-", "")}";

        // In a real implementation, you would make an API call to Razorpay here
        // For demonstration, we'll return a mock response
        var orderResponse = new OrderResponse
        {
            OrderId = orderId,
            Amount = amount,
            Currency = "INR",
            Receipt = receipt
        };

        return await Task.FromResult(orderResponse);
    }

    public bool VerifyPaymentSignature(string orderId, string paymentId, string signature)
    {
        try
        {
            // Create the expected signature
            var payload = $"{orderId}|{paymentId}";
            var expectedSignature = GenerateHmacSha256(payload, _keySecret);

            // Use constant-time comparison to prevent timing attacks
            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expectedSignature),
                Encoding.UTF8.GetBytes(signature)
            );
        }
        catch
        {
            return false;
        }
    }

    public bool VerifyWebhookSignature(string payload, string signature)
    {
        try
        {
            var expectedSignature = GenerateHmacSha256(payload, _webhookSecret);

            // Razorpay sends signature as "sha256=<signature>"
            if (signature.StartsWith("sha256="))
            {
                signature = signature.Substring(7);
            }

            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expectedSignature),
                Encoding.UTF8.GetBytes(signature)
            );
        }
        catch
        {
            return false;
        }
    }

    private string GenerateHmacSha256(string message, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}