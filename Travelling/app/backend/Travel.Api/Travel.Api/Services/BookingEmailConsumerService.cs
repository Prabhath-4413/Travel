using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Travel.Api.Models;
using Travel.Api.Data;
using System.Threading;
using System.Threading.Tasks;

namespace Travel.Api.Services;

public sealed class BookingEmailConsumerService : BackgroundService
{
    private const string RetryHeader = "retry-count";
    private readonly ILogger<BookingEmailConsumerService> _logger;
    private readonly RabbitMqService _rabbitMqService;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly SemaphoreSlim _channelLock = new(1, 1);
    private readonly JsonSerializerOptions _serializerOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly string _queueName;
    private readonly string _deadLetterExchange;
    private readonly int _maxRetries;
    private readonly TimeSpan _retryDelay;
    private RabbitMQ.Client.IModel? _channel;
    private AsyncEventingBasicConsumer? _consumer;
    private CancellationToken _stoppingToken;

    public BookingEmailConsumerService(
        ILogger<BookingEmailConsumerService> logger,
        RabbitMqService rabbitMqService,
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration)
    {
        _logger = logger;
        _rabbitMqService = rabbitMqService;
        _scopeFactory = scopeFactory;

        var section = configuration.GetSection("RabbitMQ");
        _queueName = section.GetValue("BookingQueue", "booking_queue")!;
        _deadLetterExchange = section.GetValue("DeadLetterExchange", "travel.dlx")!;
        _maxRetries = section.GetValue("RetryAttempts", 3);
        _retryDelay = TimeSpan.FromSeconds(section.GetValue("RetryDelaySeconds", 5));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _stoppingToken = stoppingToken;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await EnsureConsumerAsync(stoppingToken);
                await Task.Delay(Timeout.Infinite, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Booking email queue consumer encountered an error.");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private async Task EnsureConsumerAsync(CancellationToken cancellationToken)
    {
        if (_channel?.IsOpen == true)
        {
            return;
        }

        await _channelLock.WaitAsync(cancellationToken);
        try
        {
            if (_channel?.IsOpen == true)
            {
                return;
            }

            await CloseChannelAsync();

            _channel = await _rabbitMqService.CreateConsumerChannelAsync(cancellationToken);
            _channel.ModelShutdown += OnChannelShutdown;

            _consumer = new AsyncEventingBasicConsumer(_channel);
            _consumer.Received += OnMessageReceived;
            _channel.BasicConsume(_queueName, autoAck: false, consumer: _consumer);

            _logger.LogInformation("Booking email queue consumer subscribed to {Queue}.", _queueName);
        }
        finally
        {
            _channelLock.Release();
        }
    }

    private async Task OnMessageReceived(object sender, BasicDeliverEventArgs args)
    {
        if (_channel == null)
        {
            return;
        }

        var body = args.Body.ToArray();
        var messageId = args.BasicProperties?.MessageId ?? Guid.NewGuid().ToString("N");

        try
        {
            var payload = Encoding.UTF8.GetString(body);
            var message = JsonSerializer.Deserialize<BookingMessage>(payload, _serializerOptions);
            if (message == null)
            {
                _logger.LogWarning("Booking email payload deserialized to null. MessageId {MessageId}.", messageId);
                _channel.BasicAck(args.DeliveryTag, false);
                return;
            }

            await ProcessEmailAsync(message, messageId, _stoppingToken);
            _channel.BasicAck(args.DeliveryTag, false);
            _logger.LogInformation("Booking email message processed. MessageId {MessageId}.", messageId);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Invalid booking email payload. MessageId {MessageId}.", messageId);
            _channel.BasicAck(args.DeliveryTag, false);
        }
        catch (OperationCanceledException)
        {
            if (!_stoppingToken.IsCancellationRequested)
            {
                SafeNack(args, requeue: true);
            }
        }
        catch (Exception ex)
        {
            await HandleFailureAsync(args, body, messageId, ex);
        }
    }

    private async Task ProcessEmailAsync(BookingMessage message, string messageId, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var emailService = scope.ServiceProvider.GetService<Travel.Api.Services.IEmailService>();
        if (emailService == null)
        {
            _logger.LogWarning("IEmailService not resolved for booking email message {MessageId}.", messageId);
            return;
        }

        var templateBuilder = scope.ServiceProvider.GetService<IEmailTemplateBuilder>();
        if (templateBuilder == null)
        {
            _logger.LogWarning("IEmailTemplateBuilder not resolved for booking email message {MessageId}.", messageId);
            return;
        }

        var context = scope.ServiceProvider.GetService<ApplicationDbContext>();
        if (context == null)
        {
            _logger.LogWarning("ApplicationDbContext not resolved for booking email message {MessageId}.", messageId);
            return;
        }

        var booking = await context.Bookings
            .Include(b => b.User)
            .Include(b => b.BookingDestinations)
            .ThenInclude(bd => bd.Destination)
            .FirstOrDefaultAsync(b => b.BookingId == message.BookingId, cancellationToken);

        if (booking == null)
        {
            _logger.LogWarning("Booking not found for email message {MessageId}, BookingId {BookingId}.", messageId, message.BookingId);
            return;
        }

        var destinationNames = booking.BookingDestinations?
            .Select(bd => bd.Destination?.Name)
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n!)
            .ToList() ?? new List<string>();

        var subject = $"Booking Confirmed - Booking #{message.BookingId}";
        var body = templateBuilder.BuildBookingConfirmationBody(message.UserName, booking, destinationNames);

        var email = new Travel.Api.Services.EmailMessage
        {
            ToEmail = message.UserEmail,
            ToName = message.UserName,
            Subject = subject,
            Body = body,
            IsHtml = true
        };

        await emailService.SendAsync(email, cancellationToken);
        _logger.LogInformation("Booking confirmation email sent to {Email} for booking #{BookingId}.",
            message.UserEmail, message.BookingId);
    }

    private async Task HandleFailureAsync(BasicDeliverEventArgs args, byte[] body, string messageId, Exception exception)
    {
        if (_channel == null)
        {
            return;
        }

        var properties = args.BasicProperties ?? _channel.CreateBasicProperties();
        properties.Headers ??= new Dictionary<string, object?>();
        var currentRetries = ReadRetryCount(properties.Headers);

        if (currentRetries >= _maxRetries)
        {
            _logger.LogError(exception, "Booking email message failed permanently. MessageId {MessageId}.", messageId);
            PublishToDeadLetter(body, properties, messageId);
            _channel.BasicAck(args.DeliveryTag, false);
            return;
        }

        var nextRetry = currentRetries + 1;
        properties.Headers[RetryHeader] = nextRetry;
        _logger.LogWarning(exception, "Booking email message retry {Retry}/{Max}. MessageId {MessageId}.", nextRetry, _maxRetries, messageId);

        try
        {
            await Task.Delay(_retryDelay, _stoppingToken);
        }
        catch (OperationCanceledException)
        {
            SafeNack(args, requeue: true);
            return;
        }

        _channel.BasicPublish(string.Empty, _queueName, properties, body);
        _channel.BasicAck(args.DeliveryTag, false);
    }

    private void PublishToDeadLetter(byte[] body, RabbitMQ.Client.IBasicProperties properties, string messageId)
    {
        if (_channel == null)
        {
            return;
        }

        var deadLetterQueue = $"{_queueName}.dlq";
        var props = _channel.CreateBasicProperties();
        props.Persistent = true;
        props.ContentType = properties.ContentType ?? "application/json";
        props.MessageId = messageId;
        props.Headers = new Dictionary<string, object?>
        {
            [RetryHeader] = _maxRetries
        };

        _channel.BasicPublish(_deadLetterExchange, deadLetterQueue, props, body);
    }

    private static int ReadRetryCount(IDictionary<string, object?> headers)
    {
        if (!headers.TryGetValue(RetryHeader, out var value) || value == null)
        {
            return 0;
        }

        return value switch
        {
            byte b => b,
            sbyte sb => sb,
            short s => s,
            ushort us => us,
            int i => i,
            uint ui => (int)ui,
            long l => (int)l,
            ulong ul => (int)ul,
            byte[] bytes when int.TryParse(Encoding.UTF8.GetString(bytes), out var parsed) => parsed,
            _ => 0
        };
    }

    private void SafeNack(BasicDeliverEventArgs args, bool requeue)
    {
        try
        {
            _channel?.BasicNack(args.DeliveryTag, false, requeue);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to negatively acknowledge booking email message.");
        }
    }

    private void OnChannelShutdown(object? sender, RabbitMQ.Client.ShutdownEventArgs args)
    {
        _logger.LogWarning("Booking email queue channel shutdown {Code} - {Text}.", args.ReplyCode, args.ReplyText);
        _ = EnsureConsumerAsync(_stoppingToken);
    }

    public Task CloseChannelAsync()
    {
        if (_channel == null)
        {
            return Task.CompletedTask;
        }

        try
        {
            if (_consumer != null)
            {
                _consumer.Received -= OnMessageReceived;
            }

            _channel.ModelShutdown -= OnChannelShutdown;
            _channel.Close();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error closing booking email queue channel.");
        }

        try
        {
            _channel?.Dispose();
        }
        catch { }

        _channel = null;
        _consumer = null;

        return Task.CompletedTask;
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        await CloseChannelAsync();
        await base.StopAsync(cancellationToken);
    }

    public override void Dispose()
    {
        _channelLock.Dispose();
        base.Dispose();
    }
}
