using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Travel.Api.Data;
using Travel.Api.Models;

namespace Travel.Api.Services;

public class BookingService : IBookingService
{
    private readonly ApplicationDbContext _context;
    private readonly IOtpService _otpService;
    private readonly IMessageQueueService _messageQueueService;
    private readonly ILogger<BookingService> _logger;

    public BookingService(
        ApplicationDbContext context,
        IOtpService otpService,
        IMessageQueueService messageQueueService,
        ILogger<BookingService> logger)
    {
        _context = context;
        _otpService = otpService;
        _messageQueueService = messageQueueService;
        _logger = logger;
    }

    public async Task<(bool Success, string Message)> ConfirmBookingWithOtpAsync(int bookingId, string email)
    {
        _logger.LogInformation("Confirming booking {BookingId} for email {Email}", bookingId, email);

        var booking = await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.BookingDestinations)
            .ThenInclude(bd => bd.Destination)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId);

        if (booking == null)
        {
            _logger.LogWarning("Booking not found for confirmation: {BookingId}", bookingId);
            return (false, "Booking not found");
        }

        if (booking.User == null)
        {
            _logger.LogWarning("User information not found for booking confirmation: {BookingId}", bookingId);
            return (false, "User information not found");
        }

        if (booking.User.Email != email)
        {
            _logger.LogWarning("Email mismatch for booking confirmation {BookingId}: Expected {Expected}, got {Got}",
                bookingId, booking.User.Email, email);
            return (false, "Email mismatch");
        }

        booking.Status = BookingStatus.Confirmed;
        booking.Confirmed = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Booking status updated to Confirmed for booking {BookingId}", bookingId);

        await _otpService.MarkOtpAsUsedAsync(bookingId, email);

        var destinations = booking.BookingDestinations.Select(bd => bd.Destination?.Name).Where(n => n != null).Cast<string>().ToArray();
        
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
            _logger.LogInformation("Booking confirmation message published to queue for booking {BookingId}", bookingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish booking confirmation message to queue for booking {BookingId}: {Message}",
                bookingId, ex.Message);
        }

        return (true, "Booking confirmed successfully");
    }

    public async Task<(bool Success, string Message)> RescheduleBookingAsync(int bookingId, string email, DateTime newStartDate, int? newDestinationId)
    {
        _logger.LogInformation("Rescheduling booking {BookingId} for email {Email} to date {NewStartDate}", bookingId, email, newStartDate);

        var booking = await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.BookingDestinations)
            .ThenInclude(bd => bd.Destination)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId);

        if (booking == null)
        {
            _logger.LogWarning("Booking not found for reschedule: {BookingId}", bookingId);
            return (false, "Booking not found");
        }

        if (booking.User == null)
        {
            _logger.LogWarning("User information not found for booking reschedule: {BookingId}", bookingId);
            return (false, "User information not found");
        }

        if (booking.User.Email != email)
        {
            _logger.LogWarning("Email mismatch for booking reschedule {BookingId}", bookingId);
            return (false, "Email mismatch");
        }

        var oldStartDate = booking.StartDate;
        booking.StartDate = newStartDate;
        booking.UpdatedAt = DateTime.UtcNow;

        if (newDestinationId.HasValue)
        {
            var newDestination = await _context.Destinations.FindAsync(newDestinationId.Value);
            if (newDestination == null)
            {
                _logger.LogWarning("New destination not found for reschedule: {DestinationId}", newDestinationId);
                return (false, "New destination not found");
            }

            booking.BookingDestinations.Clear();
            booking.BookingDestinations.Add(new BookingDestination
            {
                DestinationId = newDestinationId.Value
            });
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Booking {BookingId} rescheduled from {OldDate} to {NewDate}", bookingId, oldStartDate, newStartDate);

        await _otpService.MarkRescheduleOtpAsUsedAsync(bookingId, email);

        var destinations = booking.BookingDestinations.Select(bd => bd.Destination?.Name).Where(n => n != null).Cast<string>().ToArray();
        var destinationName = destinations.Length > 0 ? string.Join(", ", destinations) : "Unknown";

        var endDate = booking.StartDate.AddDays(booking.Nights);

        var bookingMessage = new RescheduleMessage
        {
            MessageId = Guid.NewGuid().ToString("N"),
            Type = MessageType.RescheduleConfirmation,
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
            EndDate = endDate,
            CreatedAt = booking.CreatedAt
        };

        try
        {
            await _messageQueueService.PublishRescheduleMessageAsync(bookingMessage);
            _logger.LogInformation("Reschedule confirmation message published to queue for booking {BookingId}", bookingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish reschedule confirmation message to queue for booking {BookingId}: {Message}",
                bookingId, ex.Message);
        }

        return (true, "Booking rescheduled successfully");
    }
}
