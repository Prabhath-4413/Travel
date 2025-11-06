using System.ComponentModel.DataAnnotations;

namespace Travel.Api.Models;

public enum MessageType
{
    BookingConfirmation = 0,
    BookingCancelled = 1,
    CancellationRequested = 2,
    CancellationRequest = CancellationRequested,
    CancellationDecision = 3,
    AdminNotification = 4
}

public abstract class BaseMessage
{
    [Required]
    public required string MessageId { get; init; }

    [Required]
    public required MessageType Type { get; init; }

    [Required]
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    public int RetryCount { get; set; } = 0;
}
