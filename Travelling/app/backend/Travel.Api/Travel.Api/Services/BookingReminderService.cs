using Microsoft.EntityFrameworkCore;
using Travel.Api.Data;
using Travel.Api.Models;

namespace Travel.Api.Services
{
    public class BookingReminderService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<BookingReminderService> _logger;

        public BookingReminderService(IServiceProvider services, ILogger<BookingReminderService> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("BookingReminderService started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _services.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                    var targetDate = DateTime.UtcNow.Date.AddDays(2);
                    var upcoming = await db.Bookings
                        .Include(b => b.User)
                        .Include(b => b.BookingDestinations)
                            .ThenInclude(bd => bd.Destination)
                        .Where(b => b.Confirmed && !b.ReminderSent && b.BookingDate.Date == targetDate)
                        .ToListAsync(stoppingToken);

                    foreach (var booking in upcoming)
                    {
                        try
                        {
                            await SendReminderEmail(booking, emailService);
                            booking.ReminderSent = true;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed sending reminder for booking {BookingId}", booking.BookingId);
                        }
                    }

                    if (upcoming.Count > 0)
                        await db.SaveChangesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "BookingReminderService loop error");
                }

                await Task.Delay(TimeSpan.FromHours(6), stoppingToken); // run every 6 hours
            }
        }

        private static async Task SendReminderEmail(Booking booking, IEmailService emailService)
        {
            var destinationNames = booking.BookingDestinations.Select(bd => bd.Destination!.Name);
            var body = $@"Hello {booking.User!.Name},

This is a friendly reminder that your trip starts on {booking.BookingDate:yyyy-MM-dd}.

Destinations: {string.Join(", ", destinationNames)}
Guests: {booking.Guests}
Nights: {booking.Nights}
Total Price: ₹{booking.TotalPrice:F2}

We wish you a safe and enjoyable journey!

Best regards,
Travel App Team";

            await emailService.SendAsync(new EmailMessage
            {
                ToEmail = booking.User!.Email,
                ToName = booking.User.Name,
                Subject = $"Upcoming Trip Reminder - {booking.BookingDate:yyyy-MM-dd}",
                Body = body
            });
        }
    }
}
