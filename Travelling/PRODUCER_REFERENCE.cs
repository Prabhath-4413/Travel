using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using RabbitMQ.Client;
using Travel.Api.Models;

namespace Travel.Api.Services;

public class BookingProducerService
{
    private readonly IConnection _connection;
    private readonly IModel _channel;
    private readonly ILogger<BookingProducerService> _logger;
    private readonly RabbitMqConfig _config;
    private const string BookingQueue = "travel.bookings";

    public BookingProducerService(
        IConnection connection,
        IModel channel,
        ILogger<BookingProducerService> logger,
        IConfiguration configuration)
    {
        _connection = connection;
        _channel = channel;
        _logger = logger;
        _config = configuration.GetSection("RabbitMQ").Get<RabbitMqConfig>()
            ?? throw new InvalidOperationException("RabbitMQ configuration is missing");
    }

    public async Task PublishBookingConfirmationAsync(
        Booking booking,
        User user,
        List<Destination> destinations)
    {
        ArgumentNullException.ThrowIfNull(booking);
        ArgumentNullException.ThrowIfNull(user);
        ArgumentNullException.ThrowIfNull(destinations);

        var destinationNames = destinations.Select(d => d.Name).ToList();

        var message = new BookingMessage
        {
            MessageId = Guid.NewGuid().ToString(),
            Type = MessageType.BookingConfirmation,
            BookingId = booking.BookingId,
            UserName = user.Name,
            UserEmail = user.Email,
            Destination = string.Join(", ", destinationNames),
            TotalPrice = booking.TotalPrice,
            Guests = booking.Guests,
            Nights = booking.Nights,
            StartDate = booking.StartDate,
            BookingDate = booking.BookingDate,
            PaymentId = ""
        };

        await PublishMessageAsync(message);
    }

    private async Task PublishMessageAsync(BookingMessage message)
    {
        try
        {
            if (!_channel.IsOpen)
            {
                _logger.LogWarning("Channel is closed, attempting to reconnect...");
                throw new InvalidOperationException("RabbitMQ channel is not open");
            }

            var json = JsonSerializer.Serialize(message, new JsonSerializerOptions
            {
                WriteIndented = false,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var body = Encoding.UTF8.GetBytes(json);

            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;
            properties.ContentType = "application/json";
            properties.MessageId = message.MessageId;
            properties.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());
            properties.Headers = new Dictionary<string, object?>
            {
                { "message-type", message.Type.ToString() },
                { "retry-count", message.RetryCount }
            };

            _channel.BasicPublish(
                exchange: string.Empty,
                routingKey: BookingQueue,
                mandatory: false,
                basicProperties: properties,
                body: body
            );

            _logger.LogInformation(
                "📤 BookingConfirmation published | BookingId: {BookingId} | MessageId: {MessageId}",
                message.BookingId,
                message.MessageId);

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to publish BookingConfirmation message");
            throw;
        }
    }
}

public class BookingMessageBuilderService
{
    private readonly ILogger<BookingMessageBuilderService> _logger;

    public BookingMessageBuilderService(ILogger<BookingMessageBuilderService> logger)
    {
        _logger = logger;
    }

    public BookingMessage BuildBookingMessage(
        int bookingId,
        string userName,
        string userEmail,
        string destination,
        decimal totalPrice = 0,
        int guests = 0,
        int nights = 0,
        DateTime? startDate = null,
        DateTime? bookingDate = null,
        string paymentId = "")
    {
        ValidateRequiredFields(bookingId, userName, userEmail, destination);

        var message = new BookingMessage
        {
            MessageId = Guid.NewGuid().ToString(),
            Type = MessageType.BookingConfirmation,
            BookingId = bookingId,
            UserName = userName,
            UserEmail = userEmail,
            Destination = destination,
            TotalPrice = totalPrice,
            Guests = guests,
            Nights = nights,
            StartDate = startDate ?? DateTime.UtcNow,
            BookingDate = bookingDate ?? DateTime.UtcNow,
            PaymentId = paymentId,
            RetryCount = 0,
            Timestamp = DateTime.UtcNow
        };

        _logger.LogInformation(
            "✅ BookingMessage built | BookingId: {BookingId} | User: {UserName} | Destination: {Destination}",
            bookingId,
            userName,
            destination);

        return message;
    }

    private void ValidateRequiredFields(int bookingId, string userName, string userEmail, string destination)
    {
        var missingFields = new List<string>();

        if (bookingId <= 0)
            missingFields.Add(nameof(bookingId));

        if (string.IsNullOrWhiteSpace(userName))
            missingFields.Add(nameof(userName));

        if (string.IsNullOrWhiteSpace(userEmail))
            missingFields.Add(nameof(userEmail));

        if (string.IsNullOrWhiteSpace(destination))
            missingFields.Add(nameof(destination));

        if (missingFields.Count > 0)
        {
            var error = $"Required fields missing: {string.Join(", ", missingFields)}";
            _logger.LogError("❌ {Error}", error);
            throw new ArgumentException(error);
        }
    }
}

public static class ProducerDependencyInjection
{
    public static IServiceCollection AddBookingProducer(this IServiceCollection services)
    {
        services.AddScoped<BookingProducerService>();
        services.AddScoped<BookingMessageBuilderService>();
        return services;
    }
}