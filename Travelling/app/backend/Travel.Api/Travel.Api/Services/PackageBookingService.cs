using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Travel.Api.Data;
using Travel.Api.Models;

namespace Travel.Api.Services;

public interface IPackageBookingService
{
    Task<(int BookingId, decimal Price, string Message)> CreatePackageBookingAsync(
        int userId,
        int packageId,
        int guests,
        int nights,
        DateTime startDate);

    Task<(bool Success, string Message)> ConfirmPackageBookingWithOtpAsync(
        int bookingId,
        string email);

    Task<bool> IsOtpVerifiedAsync(int bookingId, string email);
}

public class PackageBookingService : IPackageBookingService
{
    private readonly ApplicationDbContext _context;
    private readonly IPricingService _pricingService;
    private readonly IMessageQueueService _messageQueueService;
    private readonly IOtpService _otpService;
    private readonly ILogger<PackageBookingService> _logger;

    public PackageBookingService(
        ApplicationDbContext context,
        IPricingService pricingService,
        IMessageQueueService messageQueueService,
        IOtpService otpService,
        ILogger<PackageBookingService> logger)
    {
        _context = context;
        _pricingService = pricingService;
        _messageQueueService = messageQueueService;
        _otpService = otpService;
        _logger = logger;
    }

    public async Task<(int BookingId, decimal Price, string Message)> CreatePackageBookingAsync(
        int userId,
        int packageId,
        int guests,
        int nights,
        DateTime startDate)
    {
        _logger.LogInformation("Creating package booking for user {UserId}, package {PackageId}", userId, packageId);

        // Validate user
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId);
        if (user is null)
        {
            _logger.LogWarning("User not found for package booking: {UserId}", userId);
            return (0, 0, "User not found");
        }

        // Validate package
        var package = await _context.TravelPackages
            .Include(p => p.TravelPackageDestinations)
            .ThenInclude(tpd => tpd.Destination)
            .FirstOrDefaultAsync(p => p.PackageId == packageId);

        if (package is null)
        {
            _logger.LogWarning("Package not found for booking: {PackageId}", packageId);
            return (0, 0, "Package not found");
        }

        if (package.TravelPackageDestinations == null || package.TravelPackageDestinations.Count == 0)
        {
            _logger.LogWarning("Package has no destinations: {PackageId}", packageId);
            return (0, 0, "Package has no destinations");
        }

        var destinations = package.TravelPackageDestinations
            .Select(tpd => tpd.Destination)
            .Where(d => d != null)
            .Cast<Destination>()
            .ToList();

        if (destinations.Count == 0)
        {
            _logger.LogWarning("No valid destinations found for package: {PackageId}", packageId);
            return (0, 0, "No valid destinations in package");
        }

        // Validate input
        if (guests <= 0 || nights <= 0)
        {
            _logger.LogWarning("Invalid guests or nights: guests={Guests}, nights={Nights}", guests, nights);
            return (0, 0, "Guests and nights must be greater than zero");
        }

        // Normalize start date
        var normalizedStartDate = startDate.Kind switch
        {
            DateTimeKind.Unspecified => DateTime.SpecifyKind(startDate, DateTimeKind.Utc),
            DateTimeKind.Local => startDate.ToUniversalTime(),
            _ => startDate
        };

        // Calculate pricing with GST
        var totalPrice = _pricingService.CalculatePackageBookingPrice(
            destinations,
            normalizedStartDate,
            guests,
            nights,
            out var breakdown);

        _logger.LogInformation("Pricing calculated: Base={Base}, GST={Gst}, Total={Total}",
            breakdown.BasePrice, breakdown.GstAmount, totalPrice);

        // Create booking
        var booking = new Booking
        {
            UserId = userId,
            TotalPrice = totalPrice,
            Guests = guests,
            Nights = nights,
            StartDate = normalizedStartDate,
            BookingDate = DateTime.UtcNow,
            Confirmed = false,
            CancellationStatus = CancellationStatus.None,
            Status = BookingStatus.Active
        };

        // Link destinations from package
        foreach (var destination in destinations)
        {
            booking.BookingDestinations.Add(new BookingDestination
            {
                DestinationId = destination.DestinationId
            });
        }

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Package booking created successfully: {BookingId}", booking.BookingId);

        return (booking.BookingId, totalPrice, "Package booking created successfully. OTP sent to your email.");
    }

    public async Task<(bool Success, string Message)> ConfirmPackageBookingWithOtpAsync(
        int bookingId,
        string email)
    {
        _logger.LogInformation("Confirming package booking {BookingId} for email {Email}", bookingId, email);

        var booking = await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.BookingDestinations)
            .ThenInclude(bd => bd.Destination)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId);

        if (booking == null)
        {
            _logger.LogWarning("Booking not found for package booking confirmation: {BookingId}", bookingId);
            return (false, "Booking not found");
        }

        if (booking.User == null)
        {
            _logger.LogWarning("User information not found for booking confirmation: {BookingId}", bookingId);
            return (false, "User information not found");
        }

        if (booking.User.Email != email)
        {
            _logger.LogWarning("Email mismatch for booking confirmation {BookingId}", bookingId);
            return (false, "Email mismatch");
        }

        var isOtpVerified = await IsOtpVerifiedAsync(bookingId, email);
        if (!isOtpVerified)
        {
            _logger.LogWarning("OTP not verified for booking {BookingId}. Cannot confirm booking.", bookingId);
            return (false, "OTP verification required before confirming booking");
        }

        // Update booking status
        booking.Status = BookingStatus.Confirmed;
        booking.Confirmed = true;
        booking.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Booking status updated to Confirmed for booking {BookingId}", bookingId);

        // Prepare destinations array
        var destinations = booking.BookingDestinations
            .Select(bd => bd.Destination?.Name)
            .Where(n => n != null)
            .Cast<string>()
            .ToArray();

        // Publish booking confirmation message to RabbitMQ
        var bookingMessage = new BookingMessage
        {
            MessageId = Guid.NewGuid().ToString("N"),
            Type = MessageType.BookingConfirmation,
            Timestamp = DateTime.UtcNow,
            BookingId = booking.BookingId,
            UserId = booking.UserId,
            UserName = booking.User.Name,
            UserEmail = booking.User.Email,
            Destinations = destinations,
            TotalPrice = booking.TotalPrice,
            Guests = booking.Guests,
            Nights = booking.Nights,
            StartDate = booking.StartDate,
            Confirmed = booking.Confirmed,
            ReminderSent = booking.ReminderSent,
            CancellationStatus = (int)booking.CancellationStatus,
            CreatedAt = booking.CreatedAt
        };

        try
        {
            await _messageQueueService.PublishBookingMessageAsync(bookingMessage);
            _logger.LogInformation("Package booking confirmation message published to queue for booking {BookingId}", bookingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish package booking confirmation message to queue for booking {BookingId}: {Message}",
                bookingId, ex.Message);
            // Don't fail the confirmation if message publishing fails
            // The email consumer will still be triggered
        }

        return (true, "Package booking confirmed successfully");
    }

    public async Task<bool> IsOtpVerifiedAsync(int bookingId, string email)
    {
        _logger.LogInformation("Checking if OTP is verified for booking {BookingId}, email {Email}", bookingId, email);

        var usedOtp = await _context.BookingOtps
            .FirstOrDefaultAsync(bo =>
                bo.BookingId == bookingId &&
                bo.Email == email &&
                bo.Used);

        var isVerified = usedOtp != null;
        _logger.LogInformation("OTP verification status for booking {BookingId}: {IsVerified}", bookingId, isVerified);
        return isVerified;
    }
}
