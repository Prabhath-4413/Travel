
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Travel.Api.Models;

public enum CancellationStatus
{
    None = 0,
    Requested = 1,
    Approved = 2,
    Rejected = 3
}

public enum TripCancellationStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public enum BookingStatus
{
    Active = 0,
    Cancelled = 1,
    Confirmed = 2,
    Completed = 3,
    PendingPayment = 4,
    Paid = 5,
    RefundPending = 6
}

public class User
{
    [Key]
    [Column("user_id")]
    public int UserId { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Role { get; set; } = "user";

    [MaxLength(255)]
    public string? GoogleId { get; set; }

    [MaxLength(500)]
    public string? Picture { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}

public class Destination
{
    [Key]
    [Column("destination_id")]
    public int DestinationId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; }

    public string? ImageUrl { get; set; }

    [Column(TypeName = "decimal(9,6)")]
    public decimal? Latitude { get; set; }

    [Column(TypeName = "decimal(9,6)")]
    public decimal? Longitude { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BookingDestination> BookingDestinations { get; set; } = new List<BookingDestination>();

    [JsonIgnore]
    public ICollection<TravelPackage> TravelPackages { get; set; } = new List<TravelPackage>();

    [JsonIgnore]
    public ICollection<TravelPackageDestination> TravelPackageDestinations { get; set; } = new List<TravelPackageDestination>();
}

public class Booking
{
    [Key]
    [Column("booking_id")]
    public int BookingId { get; set; }

    [ForeignKey(nameof(User))]
    [Column("user_id")]
    public int UserId { get; set; }
    public User? User { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal TotalPrice { get; set; }

    public int Guests { get; set; }

    public int Nights { get; set; }

    public DateTime BookingDate { get; set; } = DateTime.UtcNow;

    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    public bool Confirmed { get; set; } = false;

    public bool ReminderSent { get; set; } = false;

    public BookingStatus Status { get; set; } = BookingStatus.Active;

    [Column("CancellationStatus")]
    public CancellationStatus CancellationStatus { get; set; } = CancellationStatus.None;

    // Optional user rating/review after completion
    public int? Rating { get; set; }
    public string? Review { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    public ICollection<BookingDestination> BookingDestinations { get; set; } = new List<BookingDestination>();

    public ICollection<TripCancellation> TripCancellations { get; set; } = new List<TripCancellation>();
}

public class BookingDestination
{
    [Key]
    [Column("booking_id")]
    public int BookingId { get; set; }
    public Booking? Booking { get; set; }

    [Key]
    [Column("destination_id")]
    public int DestinationId { get; set; }
    public Destination? Destination { get; set; }
}

public class TripCancellation
{
    [Key]
    [Column("trip_cancellation_id")]
    public int TripCancellationId { get; set; }

    [Column("booking_id")]
    public int BookingId { get; set; }
    public Booking? Booking { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }
    public User? User { get; set; }

    [MaxLength(1000)]
    public string? Reason { get; set; }

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReviewedAt { get; set; }

    public TripCancellationStatus Status { get; set; } = TripCancellationStatus.Pending;

    [MaxLength(1000)]
    public string? AdminComment { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class TravelPackageDestination
{
    [Key]
    [Column("package_id")]
    public int TravelPackageId { get; set; }
    public TravelPackage? TravelPackage { get; set; }

    [Key]
    [Column("destination_id")]
    public int DestinationId { get; set; }
    public Destination? Destination { get; set; }
}

public class Review
{
    [Key]
    [Column("review_id")]
    public int ReviewId { get; set; }

    [ForeignKey(nameof(User))]
    [Column("user_id")]
    public int UserId { get; set; }
    public User? User { get; set; }

    [ForeignKey(nameof(Destination))]
    [Column("destination_id")]
    public int DestinationId { get; set; }
    public Destination? Destination { get; set; }

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }  // 1–5

    [MaxLength(1000)]
    public string? Comment { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class BookingOtp
{
    [Key]
    [Column("booking_otp_id")]
    public int BookingOtpId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [ForeignKey(nameof(Booking))]
    [Column("booking_id")]
    public int BookingId { get; set; }
    public Booking? Booking { get; set; }

    [Required]
    [MaxLength(6)]
    public string Otp { get; set; } = string.Empty;

    [Column("expiry")]
    public DateTime Expiry { get; set; }

    public bool Used { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class UserBookingDto
{
    public int BookingId { get; set; }
    public string Destinations { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public int Guests { get; set; }
    public int Nights { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class SendRescheduleOtpRequest
{
    public int BookingId { get; set; }
    public DateTime NewStartDate { get; set; }
    public int? NewDestinationId { get; set; }
}

public class VerifyRescheduleOtpRequest
{
    public int BookingId { get; set; }
    public string Otp { get; set; } = string.Empty;
    public DateTime NewStartDate { get; set; }
    public int? NewDestinationId { get; set; }
}

public class RescheduleOtp
{
    [Key]
    [Column("reschedule_otp_id")]
    public int RescheduleOtpId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [ForeignKey(nameof(Booking))]
    [Column("booking_id")]
    public int BookingId { get; set; }
    public Booking? Booking { get; set; }

    [Required]
    [MaxLength(6)]
    public string Otp { get; set; } = string.Empty;

    public DateTime NewStartDate { get; set; }

    public int? NewDestinationId { get; set; }

    [Column("expiry")]
    public DateTime Expiry { get; set; }

    public bool Used { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

