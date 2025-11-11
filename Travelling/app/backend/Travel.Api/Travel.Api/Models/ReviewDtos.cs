using System.ComponentModel.DataAnnotations;

namespace Travel.Api.Models
{
    public class ReviewRequestDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int DestinationId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }
    }

    public class ReviewResponseDto
    {
        public int ReviewId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int DestinationId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ReviewAverageDto
    {
        public int DestinationId { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
    }
}