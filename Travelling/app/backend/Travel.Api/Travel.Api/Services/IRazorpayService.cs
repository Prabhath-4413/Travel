namespace Travel.Api.Services;

public interface IRazorpayService
{
    Task<OrderResponse> CreateOrderAsync(decimal amount, string receipt);
    bool VerifyPaymentSignature(string orderId, string paymentId, string signature);
    bool VerifyWebhookSignature(string payload, string signature);
}

public class OrderResponse
{
    public string OrderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string Receipt { get; set; } = string.Empty;
}