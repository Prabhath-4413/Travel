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

public sealed class RescheduleEmailConsumerService : BackgroundService
{
    private const string RetryHeader = "retry-count";
    private readonly ILogger<RescheduleEmailConsumerService> _logger;
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

    public RescheduleEmailConsumerService(
        ILogger<RescheduleEmailConsumerService> logger,
        RabbitMqService rabbitMqService,
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration)
    {
        _logger = logger;
        _rabbitMqService = rabbitMqService;
        _scopeFactory = scopeFactory;

        var section = configuration.GetSection("RabbitMQ");
        _queueName = section.GetValue("RescheduleQueue", "reschedule_queue")!;
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
                _logger.LogError(ex, "Reschedule email queue consumer encountered an error.");
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

            _logger.LogInformation("Reschedule email queue consumer subscribed to {Queue}.", _queueName);
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
            var message = JsonSerializer.Deserialize<RescheduleMessage>(payload, _serializerOptions);
            if (message == null)
            {
                _logger.LogWarning("Reschedule email payload deserialized to null. MessageId {MessageId}.", messageId);
                _channel.BasicAck(args.DeliveryTag, false);
                return;
            }

            await ProcessEmailAsync(message, messageId, _stoppingToken);
            _channel.BasicAck(args.DeliveryTag, false);
            _logger.LogInformation("Reschedule email message processed. MessageId {MessageId}.", messageId);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Invalid reschedule email payload. MessageId {MessageId}.", messageId);
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

    private async Task ProcessEmailAsync(RescheduleMessage message, string messageId, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var emailService = scope.ServiceProvider.GetService<Travel.Api.Services.IEmailService>();
        if (emailService == null)
        {
            _logger.LogWarning("IEmailService not resolved for reschedule email message {MessageId}.", messageId);
            return;
        }

        var templateBuilder = scope.ServiceProvider.GetService<IEmailTemplateBuilder>();
        if (templateBuilder == null)
        {
            _logger.LogWarning("IEmailTemplateBuilder not resolved for reschedule email message {MessageId}.", messageId);
            return;
        }

        // Get booking details from database
        var context = scope.ServiceProvider.GetService<ApplicationDbContext>();
        if (context == null)
        {
            _logger.LogWarning("ApplicationDbContext not resolved for reschedule email message {MessageId}.", messageId);
            return;
        }

        var booking = await context.Bookings
            .Include(b => b.User)
            .Include(b => b.BookingDestinations)
            .ThenInclude(bd => bd.Destination)
            .FirstOrDefaultAsync(b => b.BookingId == message.BookingId, cancellationToken);

        if (booking == null)
        {
            _logger.LogWarning("Booking not found for reschedule email message {MessageId}, BookingId {BookingId}.", messageId, message.BookingId);
            return;
        }

        string subject;
        string body;
        string toEmail;
        string toName;

        if (message.Type == MessageType.RescheduleConfirmation)
        {
            // Send email to user confirming their reschedule
            subject = $"Trip Rescheduled Successfully - Booking #{message.BookingId}";
            body = templateBuilder.BuildRescheduleConfirmationUserBody(booking);
            toEmail = message.UserEmail;
            toName = message.UserName;
        }
        else
        {
            _logger.LogWarning("Unknown message type {MessageType} for reschedule email message {MessageId}.", message.Type, messageId);
            return;
        }

        var email = new Travel.Api.Services.EmailMessage
        {
            ToEmail = toEmail,
            ToName = toName,
            Subject = subject,
            Body = body,
            IsHtml = true
        };

        await emailService.SendAsync(email, cancellationToken);
        _logger.LogInformation("Reschedule email sent to {Email} for booking #{BookingId}, message type {MessageType}.",
            toEmail, message.BookingId, message.Type);
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
            _logger.LogError(exception, "Reschedule email message failed permanently. MessageId {MessageId}.", messageId);
            PublishToDeadLetter(body, properties, messageId);
            _channel.BasicAck(args.DeliveryTag, false);
            return;
        }

        var nextRetry = currentRetries + 1;
        properties.Headers[RetryHeader] = nextRetry;
        _logger.LogWarning(exception, "Reschedule email message retry {Retry}/{Max}. MessageId {MessageId}.", nextRetry, _maxRetries, messageId);

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
            _logger.LogWarning(ex, "Failed to negatively acknowledge reschedule email message.");
        }
    }

    private void OnChannelShutdown(object? sender, RabbitMQ.Client.ShutdownEventArgs args)
    {
        _logger.LogWarning("Reschedule email queue channel shutdown {Code} - {Text}.", args.ReplyCode, args.ReplyText);
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
            _logger.LogWarning(ex, "Error closing reschedule email queue channel.");
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