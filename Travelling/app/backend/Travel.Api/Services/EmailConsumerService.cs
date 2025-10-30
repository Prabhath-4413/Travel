using System;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MimeKit.Text;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Travel.Api.Models;

namespace Travel.Api.Services
{
    /// <summary>
    /// Background service for consuming booking messages and sending emails asynchronously
    /// </summary>
    public class EmailConsumerService : BackgroundService
    {
        private readonly ILogger<EmailConsumerService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly RabbitMqConfig _config;
        private IConnection? _connection;
        private IModel? _channel;
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public EmailConsumerService(
            ILogger<EmailConsumerService> logger,
            IServiceProvider serviceProvider,
            IConfiguration configuration)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
            _config = configuration.GetSection("RabbitMQ").Get<RabbitMqConfig>()
                ?? throw new InvalidOperationException("RabbitMQ configuration is missing");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 EmailConsumerService starting...");

            try
            {
                // Initialize RabbitMQ synchronously on a background thread to avoid blocking the host startup path
                await Task.Run(() => InitializeRabbitMQ(), stoppingToken);

                // Keep service running until cancellation requested
                await Task.Delay(Timeout.Infinite, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Expected on shutdown
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Fatal error in EmailConsumerService ExecuteAsync");
                throw;
            }
        }

        private void InitializeRabbitMQ()
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = _config.HostName,
                    Port = _config.Port,
                    UserName = _config.UserName,
                    Password = _config.Password,
                    VirtualHost = _config.VirtualHost,
                    AutomaticRecoveryEnabled = true,
                    NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
                };

                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();

                EnsureQueues();

                _channel.BasicQos(prefetchSize: 0, prefetchCount: 1, global: false);

                _logger.LogInformation("✅ Consumer connected to RabbitMQ");

                // Start consumers (these install AsyncEventingBasicConsumer handlers)
                StartConsuming(_config.BookingQueue, _config.BookingDLQ);
                StartConsumingAdminQueue(_config.AdminQueue, _config.AdminDLQ);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to initialize RabbitMQ consumer");
                throw;
            }
        }

        private void EnsureQueues()
        {
            if (_channel == null)
                throw new InvalidOperationException("Channel is not initialized");

            // Ensure DLX exchange
            _channel.ExchangeDeclare(
                exchange: "dlx.exchange",
                type: ExchangeType.Direct,
                durable: true,
                autoDelete: false);

            DeclareQueue(_config.BookingQueue, _config.BookingDLQ);
            DeclareQueue(_config.AdminQueue, _config.AdminDLQ);
        }

        private void DeclareQueue(string queueName, string dlqName)
        {
            if (_channel == null)
                throw new InvalidOperationException("Channel is not initialized");

            // Declare DLQ
            _channel.QueueDeclare(
                queue: dlqName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null);

            // Bind DLQ to DLX with routing key = queueName
            _channel.QueueBind(
                queue: dlqName,
                exchange: "dlx.exchange",
                routingKey: queueName);

            var queueArgs = new Dictionary<string, object?>
            {
                { "x-dead-letter-exchange", "dlx.exchange" },
                { "x-dead-letter-routing-key", queueName }
            };

            _channel.QueueDeclare(
                queue: queueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: queueArgs);
        }

        private void StartConsuming(string queueName, string dlqName)
        {
            if (_channel == null)
                throw new InvalidOperationException("Channel is not initialized");

            var consumer = new AsyncEventingBasicConsumer(_channel);

            // Async handler for received messages
            consumer.Received += async (model, ea) =>
            {
                var body = ea.Body.ToArray();
                var messageJson = Encoding.UTF8.GetString(body);
                var messageId = ea.BasicProperties?.MessageId ?? "unknown";

                try
                {
                    _logger.LogInformation("📩 Message received from '{Queue}' | ID: {MessageId}", queueName, messageId);

                    var resolvedType = ResolveMessageType(ea.BasicProperties, messageJson);
                    if (resolvedType is null)
                    {
                        _logger.LogError("❌ Unknown message type | ID: {MessageId}", messageId);
                        _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                        return;
                    }

                    var handled = await HandleMessageByTypeAsync(resolvedType.Value, messageJson, messageId, ea, CancellationToken.None);
                    if (!handled)
                    {
                        // Handler decided to nack/reject already
                        return;
                    }

                    // Acknowledge successful processing
                    _channel.BasicAck(ea.DeliveryTag, multiple: false);
                    _logger.LogInformation("✅ Message processed successfully | ID: {MessageId}", messageId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error processing message | ID: {MessageId}", messageId);

                    // Get retry count from headers (safely)
                    var retryCount = 0;
                    if (ea.BasicProperties?.Headers != null && ea.BasicProperties.Headers.TryGetValue("retry-count", out var retryObj))
                    {
                        var retryStr = ConvertHeaderToString(retryObj);
                        if (int.TryParse(retryStr, out var parsed))
                            retryCount = parsed;
                    }

                    if (retryCount < _config.RetryAttempts)
                    {
                        // Retry: requeue approach (incrementing header would require republish).
                        _logger.LogWarning("🔄 Retrying message | ID: {MessageId} | Attempt: {Retry}/{Max}",
                            messageId, retryCount + 1, _config.RetryAttempts);

                        // Simple backoff (non-blocking would be better in production)
                        await Task.Delay(TimeSpan.FromSeconds(_config.RetryDelaySeconds));

                        // Requeue so that message will be retried
                        _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: true);
                    }
                    else
                    {
                        // Send to DLQ by nack without requeue (assuming DLX configured)
                        _logger.LogError("💀 Max retries exceeded, sending to DLQ | ID: {MessageId}", messageId);
                        _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                    }
                }
            };

            _channel.BasicConsume(
                queue: queueName,
                autoAck: false,
                consumer: consumer);

            _logger.LogInformation("👂 Started consuming from queue: {Queue}", queueName);
        }

        private void StartConsumingAdminQueue(string queueName, string dlqName)
        {
            if (_channel == null)
                throw new InvalidOperationException("Channel is not initialized");

            var consumer = new AsyncEventingBasicConsumer(_channel);

            consumer.Received += async (model, ea) =>
            {
                var body = ea.Body.ToArray();
                var messageJson = Encoding.UTF8.GetString(body);
                var messageId = ea.BasicProperties?.MessageId ?? "unknown";

                try
                {
                    _logger.LogInformation("📩 Admin message received | ID: {MessageId}", messageId);

                    var message = JsonSerializer.Deserialize<AdminNotificationMessage>(messageJson, JsonOptions);

                    if (message == null)
                    {
                        _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                        return;
                    }

                    await ProcessAdminNotificationAsync(message, CancellationToken.None);
                    _channel.BasicAck(ea.DeliveryTag, multiple: false);
                    _logger.LogInformation("✅ Admin notification processed | ID: {MessageId}", messageId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error processing admin notification | ID: {MessageId}", messageId);
                    _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                }
            };

            _channel.BasicConsume(
                queue: queueName,
                autoAck: false,
                consumer: consumer);

            _logger.LogInformation("👂 Started consuming from admin queue: {Queue}", queueName);
        }

        private async Task<bool> HandleMessageByTypeAsync(MessageType messageType, string messageJson, string messageId, BasicDeliverEventArgs ea, CancellationToken stoppingToken)
        {
            if (_channel == null)
                throw new InvalidOperationException("Channel is not initialized");

            switch (messageType)
            {
                case MessageType.CancellationRequested:
                case MessageType.CancellationDecision:
                    {
                        var cancellationMessage = JsonSerializer.Deserialize<CancellationMessage>(messageJson, JsonOptions);
                        if (cancellationMessage == null)
                        {
                            _logger.LogError("❌ Failed to deserialize cancellation message | ID: {MessageId}", messageId);
                            _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                            return false;
                        }

                        await ProcessCancellationMessageAsync(cancellationMessage, stoppingToken);
                        return true;
                    }
                case MessageType.BookingConfirmation:
                case MessageType.BookingCancelled:
                    {
                        var bookingMessage = JsonSerializer.Deserialize<BookingMessage>(messageJson, JsonOptions);
                        if (bookingMessage == null)
                        {
                            _logger.LogError("❌ Failed to deserialize booking message | ID: {MessageId}", messageId);
                            _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                            return false;
                        }

                        // Basic validation to avoid null reference exceptions and infinite requeues
                        if (string.IsNullOrWhiteSpace(bookingMessage.UserEmail))
                        {
                            _logger.LogWarning("⚠️ Booking message missing UserEmail. Acking and skipping. ID: {MessageId}", messageId);
                            _channel.BasicAck(ea.DeliveryTag, multiple: false);
                            return false;
                        }

                        await ProcessBookingMessageAsync(bookingMessage, stoppingToken);
                        return true;
                    }
                case MessageType.AdminNotification:
                    {
                        _logger.LogWarning("⚠️ Unexpected admin notification message on booking queue | ID: {MessageId}", messageId);
                        _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                        return false;
                    }
                default:
                    {
                        _logger.LogError("❌ Unsupported message type | ID: {MessageId} | Type: {Type}", messageId, messageType);
                        _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                        return false;
                    }
            }
        }

        private static MessageType? ResolveMessageType(IBasicProperties? properties, string messageJson)
        {
            // Try header first
            try
            {
                if (properties?.Headers?.TryGetValue("message-type", out var typeObj) == true)
                {
                    var headerValue = ConvertHeaderToString(typeObj);
                    if (!string.IsNullOrWhiteSpace(headerValue) && Enum.TryParse(headerValue, true, out MessageType headerType))
                    {
                        return headerType;
                    }
                }
            }
            catch
            {
                // ignore and fallback to JSON
            }

            // Try JSON field "type"
            try
            {
                using var document = JsonDocument.Parse(messageJson);
                var root = document.RootElement;
                if (root.TryGetProperty("type", out var typeElement))
                {
                    if (typeElement.ValueKind == JsonValueKind.String)
                    {
                        var jsonValue = typeElement.GetString();
                        if (!string.IsNullOrWhiteSpace(jsonValue) && Enum.TryParse(jsonValue, true, out MessageType parsedType))
                        {
                            return parsedType;
                        }
                    }
                    else if (typeElement.ValueKind == JsonValueKind.Number && typeElement.TryGetInt32(out var typeNumber))
                    {
                        if (Enum.IsDefined(typeof(MessageType), typeNumber))
                        {
                            return (MessageType)typeNumber;
                        }
                    }
                }
            }
            catch (JsonException)
            {
                return null;
            }

            return null;
        }

        private static string? ConvertHeaderToString(object? value)
        {
            return value switch
            {
                null => null,
                byte[] bytes => Encoding.UTF8.GetString(bytes),
                ReadOnlyMemory<byte> memory => Encoding.UTF8.GetString(memory.Span),
                ArraySegment<byte> seg => Encoding.UTF8.GetString(seg.Array ?? Array.Empty<byte>(), seg.Offset, seg.Count),
                _ => value.ToString()
            };
        }

        private async Task ProcessBookingMessageAsync(BookingMessage message, CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
            var templateBuilder = scope.ServiceProvider.GetRequiredService<IEmailTemplateBuilder>();

            string subject;
            string body;

            switch (message.Type)
            {
                case MessageType.BookingConfirmation:
                    subject = $"Booking Confirmation #{message.BookingId}";
                    body = BuildBookingConfirmationBody(templateBuilder, message);
                    break;

                case MessageType.BookingCancelled:
                    subject = $"Booking Cancelled #{message.BookingId}";
                    body = BuildCancellationBody(message);
                    break;

                default:
                    _logger.LogWarning("⚠️ Unknown message type: {Type}", message.Type);
                    return;
            }

            var emailMessage = new EmailMessage
            {
                ToEmail = message.UserEmail,
                ToName = message.UserName,
                Subject = subject,
                Body = body,
                IsHtml = true
            };

            await emailService.SendAsync(emailMessage, cancellationToken);
            _logger.LogInformation("📧 Email sent successfully | To: {Email} | Type: {Type}",
                message.UserEmail, message.Type);
        }

        private async Task ProcessAdminNotificationAsync(AdminNotificationMessage message, CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            var emailMessage = new EmailMessage
            {
                ToEmail = message.AdminEmail,
                ToName = "Admin",
                Subject = message.Subject,
                Body = message.Body,
                IsHtml = false
            };

            await emailService.SendAsync(emailMessage, cancellationToken);
            _logger.LogInformation("📧 Admin notification sent | To: {Email}", message.AdminEmail);
        }

        private string BuildBookingConfirmationBody(IEmailTemplateBuilder templateBuilder, BookingMessage message)
        {
            var booking = new Booking
            {
                BookingId = message.BookingId,
                Guests = message.Guests,
                Nights = message.Nights,
                TotalPrice = message.TotalPrice,
                BookingDate = message.BookingDate
            };

            var destinations = (message.Destination ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(d => d.Trim());

            return templateBuilder.BuildBookingConfirmationBody(message.UserName, booking, destinations);
        }

        private string BuildCancellationBody(BookingMessage message)
        {
            return $@"
Hello {message.UserName},

Your booking #{message.BookingId} has been cancelled.

Destination: {message.Destination}

If you have any questions, please contact our support team.

Best regards,
Travel App Team
";
        }

        private async Task ProcessCancellationMessageAsync(CancellationMessage message, CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
            var templateBuilder = scope.ServiceProvider.GetRequiredService<IEmailTemplateBuilder>();

            string subject;
            string body;

            switch (message.Type)
            {
                case MessageType.CancellationRequested:
                    subject = $"Trip Cancellation Request Received - Booking #{message.BookingId}";
                    body = BuildCancellationRequestBody(message);
                    break;

                case MessageType.CancellationDecision:
                    subject = message.Approved == true
                        ? $"Trip Cancellation Approved - Booking #{message.BookingId}"
                        : $"Trip Cancellation Rejected - Booking #{message.BookingId}";
                    body = BuildCancellationDecisionBody(message);
                    break;

                default:
                    _logger.LogWarning("⚠️ Unknown cancellation message type: {Type}", message.Type);
                    return;
            }

            var emailMessage = new EmailMessage
            {
                ToEmail = message.UserEmail,
                ToName = message.UserName,
                Subject = subject,
                Body = body,
                IsHtml = true
            };

            await emailService.SendAsync(emailMessage, cancellationToken);
            _logger.LogInformation("📧 Cancellation email sent successfully | To: {Email} | Type: {Type}",
                message.UserEmail, message.Type);
        }

        private string BuildCancellationRequestBody(CancellationMessage message)
        {
            var tripEnd = message.TripStartDate?.AddDays(message.Nights);
            var tripStartStr = message.TripStartDate?.ToString("yyyy-MM-dd") ?? string.Empty;
            var tripEndStr = tripEnd?.ToString("yyyy-MM-dd") ?? string.Empty;

            return $@"
Hello {message.UserName},

We have received your trip cancellation request.

Booking ID: {message.BookingId}
Destination: {message.Destination}
Trip Dates: {tripStartStr} to {tripEndStr}

{(string.IsNullOrWhiteSpace(message.Reason) ? "" : $"Reason Provided:\n{message.Reason}\n")}
Our team will review your request soon. You will receive an email once a decision has been made.

Best regards,
Travel App Team
";
        }

        private string BuildCancellationDecisionBody(CancellationMessage message)
        {
            var tripEnd = message.TripStartDate?.AddDays(message.Nights);
            var tripStartStr = message.TripStartDate?.ToString("yyyy-MM-dd") ?? string.Empty;
            var tripEndStr = tripEnd?.ToString("yyyy-MM-dd") ?? string.Empty;

            return $@"
Hello {message.UserName},

{(message.Approved == true
    ? "Good news! Your trip cancellation request has been approved."
    : "We're sorry to inform you that your trip cancellation request has been rejected.")}

Booking ID: {message.BookingId}
Destination: {message.Destination}
Trip Dates: {tripStartStr} to {tripEndStr}

{(string.IsNullOrWhiteSpace(message.AdminComment) ? "" : $"Notes from our team:\n{message.AdminComment}\n")}
If you have any questions, please contact our support team.

Best regards,
Travel App Team
";
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🛑 EmailConsumerService stopping...");

            try
            {
                if (_channel != null)
                {
                    try
                    {
                        _channel.Close();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Warning while closing channel");
                    }
                    finally
                    {
                        _channel.Dispose();
                        _channel = null;
                    }
                }

                if (_connection != null)
                {
                    try
                    {
                        _connection.Close();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Warning while closing connection");
                    }
                    finally
                    {
                        _connection.Dispose();
                        _connection = null;
                    }
                }

                _logger.LogInformation("✅ EmailConsumerService stopped gracefully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error stopping EmailConsumerService");
            }

            await base.StopAsync(stoppingToken);
        }
    }
}
