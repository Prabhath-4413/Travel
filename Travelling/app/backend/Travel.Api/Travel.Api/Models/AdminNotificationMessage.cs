using System.ComponentModel.DataAnnotations;

namespace Travel.Api.Models;

public class AdminNotificationMessage : BaseMessage
{
    [Required]
    [EmailAddress]
    public required string AdminEmail { get; init; }

    [Required]
    [MaxLength(150)]
    public required string Subject { get; init; }

    [Required]
    public required string Body { get; init; }

    public int? BookingId { get; init; }

    public int? UserId { get; init; }

    public string? UserName { get; init; }

    public string? UserEmail { get; init; }

    public Dictionary<string, object>? Metadata { get; init; }
}
