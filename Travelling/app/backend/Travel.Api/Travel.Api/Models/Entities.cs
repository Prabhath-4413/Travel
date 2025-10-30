
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
    Completed = 3
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

    public ICollection<BookingDestination> BookingDestinations { get; set; } = new List<BookingDestination>();

    public ICollection<TripCancellation> TripCancellations { get; set; } = new List<TripCancellation>();
}

public class BookingDestination
{
    [Column("booking_id")]
    public int BookingId { get; set; }
    public Booking? Booking { get; set; }

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

