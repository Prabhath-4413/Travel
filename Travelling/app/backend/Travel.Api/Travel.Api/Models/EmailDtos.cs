using System.ComponentModel.DataAnnotations;

namespace Travel.Api.Models
{
    /// <summary>
    /// Request payload for sending an email notification.
    /// </summary>
    public class EmailRequestDto
    {
        [Required]
        [EmailAddress]
        public required string To { get; init; }

        /// <summary>
        /// Optional display name for the sender; falls back to the configured "From" address if omitted.
        /// </summary>
        public string? DisplayName { get; init; }

        [Required]
        [MaxLength(150)]
        public required string Subject { get; init; }

        [Required]
        public required string Body { get; init; }
    }

    /// <summary>
    /// Response payload returned by email endpoints to indicate success or failure.
    /// </summary>
    public record EmailResponseDto(bool Success, string Message);
}