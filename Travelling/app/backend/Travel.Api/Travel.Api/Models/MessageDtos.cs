namespace Travel.Api.Models;

public class BookingMessage : BaseMessage
{
    public required int BookingId { get; init; }

    public required int UserId { get; init; }

    public required string UserName { get; init; }

    public required string UserEmail { get; init; }

    public required string[] Destinations { get; init; }

    public decimal TotalPrice { get; init; }

    public int Guests { get; init; }

    public int Nights { get; init; }

    public DateTime StartDate { get; init; }

    public bool Confirmed { get; init; }

    public bool ReminderSent { get; init; }

    public int CancellationStatus { get; init; }

    public DateTime CreatedAt { get; init; }
}

public class CancellationMessage : BaseMessage
{
    public required int CancellationId { get; init; }

    public required int BookingId { get; init; }

    public required int UserId { get; init; }

    public required string UserName { get; init; }

    public required string UserEmail { get; init; }

    public string? Email { get; init; }

    public string? Reason { get; init; }

    public DateTime RequestedAt { get; init; }

    public DateTime? ReviewedAt { get; init; }

    public int Status { get; init; }

    public string? AdminComment { get; init; }

    public string? AdminEmail { get; init; }

    public string? Destination { get; init; }

    public DateTime? TripStartDate { get; init; }

    public int? Nights { get; init; }

    public bool? Approved { get; init; }
}

public class RescheduleMessage : BaseMessage
{
    public required int BookingId { get; init; }

    public required int UserId { get; init; }

    public required string UserName { get; init; }

    public required string UserEmail { get; init; }

    public required string[] Destinations { get; init; }

    public decimal TotalPrice { get; init; }

    public int Guests { get; init; }

    public int Nights { get; init; }

    public DateTime StartDate { get; init; }

    public DateTime EndDate { get; init; }

    public DateTime CreatedAt { get; init; }
}
