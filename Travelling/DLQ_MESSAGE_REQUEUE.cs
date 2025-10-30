using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using Travel.Api.Models;

namespace Travel.Api.Services;

public class DeadLetterQueueService
{
    private readonly IConnection _connection;
    private readonly IModel _channel;
    private readonly ILogger<DeadLetterQueueService> _logger;

    public DeadLetterQueueService(
        IConnection connection,
        IModel channel,
        ILogger<DeadLetterQueueService> logger)
    {
        _connection = connection;
        _channel = channel;
        _logger = logger;
    }

    public async Task RequeueBookingMessagesFromDLQAsync(
        string dlqName = "travel.bookings.dlq",
        string targetQueue = "travel.bookings",
        int maxMessages = 100)
    {
        try
        {
            _logger.LogInformation(
                "🔄 Starting requeue process | DLQ: {DLQ} | Target: {Target} | MaxMessages: {Max}",
                dlqName, targetQueue, maxMessages);

            var consumer = new QueueingBasicConsumer(_channel);
            _channel.BasicConsume(queue: dlqName, autoAck: false, consumer: consumer);

            int requeuedCount = 0;
            var timeoutMs = 5000;

            while (requeuedCount < maxMessages)
            {
                var gotMessage = consumer.Queue.TryDequeue(timeoutMs, out var deliveryArgs);

                if (!gotMessage)
                {
                    _logger.LogInformation("✅ DLQ empty or timeout reached");
                    break;
                }

                try
                {
                    var body = deliveryArgs!.Body.ToArray();
                    var payload = Encoding.UTF8.GetString(body);

                    _logger.LogInformation("📨 Processing DLQ message: {Payload}", payload);

                    var properties = _channel.CreateBasicProperties();
                    properties.Persistent = true;
                    properties.ContentType = deliveryArgs.BasicProperties?.ContentType ?? "application/json";
                    properties.MessageId = deliveryArgs.BasicProperties?.MessageId ?? Guid.NewGuid().ToString();
                    properties.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());

                    var headers = deliveryArgs.BasicProperties?.Headers != null
                        ? new Dictionary<string, object?>(deliveryArgs.BasicProperties.Headers)
                        : new Dictionary<string, object?>();

                    headers["x-requeued"] = DateTime.UtcNow.ToString("O");
                    headers["x-requeued-from"] = dlqName;
                    properties.Headers = headers;

                    _channel.BasicPublish(
                        exchange: string.Empty,
                        routingKey: targetQueue,
                        basicProperties: properties,
                        body: body);

                    _channel.BasicAck(deliveryArgs.DeliveryTag, false);

                    requeuedCount++;
                    _logger.LogInformation(
                        "✅ Message requeued ({Count}/{Max}) | MessageId: {MessageId}",
                        requeuedCount, maxMessages, properties.MessageId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error processing DLQ message, sending to DLQ again");
                    _channel.BasicNack(deliveryArgs!.DeliveryTag, false, true);
                }
            }

            _logger.LogInformation("✅ Requeue complete | Total requeued: {Count}", requeuedCount);
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to requeue messages from DLQ");
            throw;
        }
    }

    public async Task<List<BookingMessage>> PeekDLQMessagesAsync(
        string dlqName = "travel.bookings.dlq",
        int maxMessages = 10)
    {
        var messages = new List<BookingMessage>();
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        try
        {
            var consumer = new QueueingBasicConsumer(_channel);
            _channel.BasicConsume(queue: dlqName, autoAck: true, consumer: consumer);

            int count = 0;
            while (count < maxMessages)
            {
                var gotMessage = consumer.Queue.TryDequeue(1000, out var deliveryArgs);

                if (!gotMessage)
                    break;

                try
                {
                    var body = deliveryArgs!.Body.ToArray();
                    var payload = Encoding.UTF8.GetString(body);
                    var message = JsonSerializer.Deserialize<BookingMessage>(payload, options);

                    if (message != null)
                    {
                        messages.Add(message);
                        count++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "⚠️ Failed to deserialize DLQ message");
                }
            }

            _logger.LogInformation("📊 Peeked {Count} messages from DLQ", messages.Count);
            return messages;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to peek DLQ messages");
            throw;
        }
    }

    public async Task PurgeQueueAsync(string queueName)
    {
        try
        {
            _channel.QueuePurge(queueName);
            _logger.LogWarning("🗑️ Queue purged: {Queue}", queueName);
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to purge queue: {Queue}", queueName);
            throw;
        }
    }
}

public class ManualMessagePublisher
{
    private readonly IModel _channel;
    private readonly ILogger<ManualMessagePublisher> _logger;

    public ManualMessagePublisher(IModel channel, ILogger<ManualMessagePublisher> logger)
    {
        _channel = channel;
        _logger = logger;
    }

    public async Task PublishManualBookingMessageAsync(
        int bookingId,
        string userName,
        string userEmail,
        string destination,
        decimal totalPrice = 0,
        int guests = 0,
        int nights = 0,
        string queueName = "travel.bookings")
    {
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
            StartDate = DateTime.UtcNow,
            BookingDate = DateTime.UtcNow,
            Timestamp = DateTime.UtcNow,
            RetryCount = 0,
            PaymentId = ""
        };

        try
        {
            var json = JsonSerializer.Serialize(message, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var body = Encoding.UTF8.GetBytes(json);

            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;
            properties.ContentType = "application/json";
            properties.MessageId = message.MessageId;
            properties.Headers = new Dictionary<string, object?>
            {
                { "message-type", "BookingConfirmation" }
            };

            _channel.BasicPublish(
                exchange: string.Empty,
                routingKey: queueName,
                basicProperties: properties,
                body: body);

            _logger.LogInformation(
                "✅ Manual message published | BookingId: {BookingId} | Queue: {Queue}",
                bookingId, queueName);

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to publish manual message");
            throw;
        }
    }

    public async Task ResendBookingMessageAsync(
        BookingMessage originalMessage,
        string targetQueue = "travel.bookings")
    {
        try
        {
            var message = new BookingMessage
            {
                MessageId = Guid.NewGuid().ToString(),
                Type = originalMessage.Type,
                BookingId = originalMessage.BookingId,
                UserName = originalMessage.UserName,
                UserEmail = originalMessage.UserEmail,
                Destination = originalMessage.Destination,
                TotalPrice = originalMessage.TotalPrice,
                Guests = originalMessage.Guests,
                Nights = originalMessage.Nights,
                StartDate = originalMessage.StartDate,
                BookingDate = originalMessage.BookingDate,
                Timestamp = DateTime.UtcNow,
                RetryCount = originalMessage.RetryCount + 1,
                PaymentId = originalMessage.PaymentId
            };

            var json = JsonSerializer.Serialize(message, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var body = Encoding.UTF8.GetBytes(json);

            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;
            properties.ContentType = "application/json";
            properties.MessageId = message.MessageId;
            properties.Headers = new Dictionary<string, object?>
            {
                { "message-type", message.Type.ToString() },
                { "retry-count", message.RetryCount },
                { "x-resent-from", DateTime.UtcNow.ToString("O") }
            };

            _channel.BasicPublish(
                exchange: string.Empty,
                routingKey: targetQueue,
                basicProperties: properties,
                body: body);

            _logger.LogInformation(
                "✅ Message resent | OriginalMessageId: {OriginalId} | NewMessageId: {NewId} | RetryCount: {Retry}",
                originalMessage.MessageId, message.MessageId, message.RetryCount);

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to resend message");
            throw;
        }
    }
}
