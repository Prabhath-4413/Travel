using System.ComponentModel.DataAnnotations;

namespace Travel.Api.Models
{
    public class TripCancellationRequestDto
    {
        [Required]
        public int BookingId { get; set; }

        [Required]
        public int UserId { get; set; }

        [MaxLength(1000)]
        public string? Reason { get; set; }
    }

    public class TripCancellationDecisionDto
    {
        [Required]
        public int TripCancellationId { get; set; }

        [MaxLength(1000)]
        public string? AdminComment { get; set; }
    }

    public class TripCancellationSummaryDto
    {
        public int TripCancellationId { get; set; }
        public int BookingId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public TripCancellationStatus Status { get; set; }
        public CancellationStatus BookingCancellationStatus { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? Reason { get; set; }
        public string? AdminComment { get; set; }
        public decimal TotalPrice { get; set; }
        public int Nights { get; set; }
        public DateTime StartDate { get; set; }
        public IEnumerable<string> Destinations { get; set; } = Enumerable.Empty<string>();
    }
}