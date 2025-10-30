using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Exceptions;
using Travel.Api.Models;
using System.Threading;
using System.Threading.Tasks;

namespace Travel.Api.Services;

public sealed class RabbitMqService : IMessageQueueService, IAsyncDisposable
{
    private readonly ILogger<RabbitMqService> _logger;
    private readonly ConnectionFactory _factory;
    private readonly SemaphoreSlim _sync = new(1, 1);
    private IConnection? _connection;
    private RabbitMQ.Client.IModel? _publisherChannel;
    private bool _disposed;
    private readonly string _bookingQueue;
    private readonly string _emailQueue;
    private readonly string _deadLetterExchange;
    private readonly int _retryAttempts;
    private readonly int _retryDelaySeconds;

    public bool IsConnected => _connection?.IsOpen == true && _publisherChannel?.IsOpen == true;

    public RabbitMqService(ILogger<RabbitMqService> logger, IConfiguration configuration)
    {
        _logger = logger;
        var section = configuration.GetSection("RabbitMQ");
        if (!section.Exists())
        {
            throw new InvalidOperationException("RabbitMQ configuration missing.");
        }

        var hostName = section.GetValue("HostName", "localhost")!;
        var port = section.GetValue("Port", 5672);
        var userName = section.GetValue("UserName", "guest")!;
        var password = section.GetValue("Password", "guest")!;
        var virtualHost = section.GetValue("VirtualHost", "/")!;
        _bookingQueue = section.GetValue("BookingQueue", "booking_queue")!;
        _emailQueue = section.GetValue("EmailQueue", "email_queue")!;
        _deadLetterExchange = section.GetValue("DeadLetterExchange", "travel.dlx")!;
        _retryAttempts = section.GetValue("RetryAttempts", 3);
        _retryDelaySeconds = section.GetValue("RetryDelaySeconds", 5);

        _factory = new ConnectionFactory
        {
            HostName = hostName,
            Port = port,
            UserName = userName,
            Password = password,
            VirtualHost = virtualHost,
            AutomaticRecoveryEnabled = true,
            DispatchConsumersAsync = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10),
            RequestedHeartbeat = TimeSpan.FromSeconds(60)
        };
    }

    public async Task PublishMessageAsync(string queueName, object message)
    {
        if (message is not BaseMessage baseMessage)
        {
            throw new ArgumentException("Message must derive from BaseMessage.", nameof(message));
        }

        await EnsureInfrastructureAsync(CancellationToken.None);
        if (_publisherChannel == null)
        {
            throw new InvalidOperationException("Publisher channel is not available.");
        }

        var json = JsonSerializer.Serialize(message, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        var body = Encoding.UTF8.GetBytes(json);

        lock (_publisherChannel)
        {
            var properties = _publisherChannel.CreateBasicProperties();
            properties.Persistent = true;
            properties.ContentType = "application/json";
            properties.MessageId = baseMessage.MessageId;
            properties.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());
            properties.Headers = new Dictionary<string, object?>
            {
                ["message-type"] = baseMessage.Type.ToString(),
                ["retry-count"] = baseMessage.RetryCount
            };

            _publisherChannel.BasicPublish(string.Empty, queueName, false, properties, body);
        }

        _logger.LogInformation("Published message {MessageId} to {Queue}.", baseMessage.MessageId, queueName);
    }

    public Task PublishBookingMessageAsync(BookingMessage message) => PublishMessageAsync(_bookingQueue, message);

    public Task PublishAdminNotificationAsync(AdminNotificationMessage message) => PublishMessageAsync(_emailQueue, message);

    public async ValueTask<RabbitMQ.Client.IModel> CreateConsumerChannelAsync(CancellationToken cancellationToken)
    {
        await EnsureInfrastructureAsync(cancellationToken);
        if (_connection == null)
        {
            throw new InvalidOperationException("Connection is not available.");
        }

        var channel = _connection.CreateModel();
        channel.BasicQos(0, 1, false);
        return channel;
    }

    private async Task EnsureInfrastructureAsync(CancellationToken cancellationToken)
    {
        if (IsConnected)
        {
            return;
        }

        await _sync.WaitAsync(cancellationToken);
        try
        {
            if (IsConnected)
            {
                return;
            }

            DisposeChannel();

            _connection = _factory.CreateConnection();
            _connection.ConnectionShutdown += OnConnectionShutdown;
            _publisherChannel = _connection.CreateModel();
            _publisherChannel.BasicQos(0, 1, false);

            ConfigureTopology(_publisherChannel);
            _logger.LogInformation("RabbitMQ connection established to {Host}:{Port}.", _factory.HostName, _factory.Port);
        }
        catch (BrokerUnreachableException ex)
        {
            _logger.LogError(ex, "Unable to reach RabbitMQ at {Host}:{Port}.", _factory.HostName, _factory.Port);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize RabbitMQ infrastructure.");
            throw;
        }
        finally
        {
            _sync.Release();
        }
    }

    private void ConfigureTopology(RabbitMQ.Client.IModel channel)
    {
        try
        {
            channel.ExchangeDeclarePassive(_deadLetterExchange);
        }
        catch
        {
            channel.ExchangeDeclare(_deadLetterExchange, ExchangeType.Direct, true);
        }
        
        DeclareQueue(channel, _bookingQueue);
        DeclareQueue(channel, _emailQueue);
        
        _logger.LogInformation("RabbitMQ topology configured successfully.");
    }

    private void DeclareQueue(RabbitMQ.Client.IModel channel, string queueName)
    {
        var deadLetterQueue = $"{queueName}.dlq";
        
        // Check if DLQ exists, if not create it
        try
        {
            channel.QueueDeclarePassive(deadLetterQueue);
            _logger.LogInformation("Dead-letter queue '{DeadLetterQueue}' already exists.", deadLetterQueue);
        }
        catch
        {
            _logger.LogInformation("Creating dead-letter queue '{DeadLetterQueue}'.", deadLetterQueue);
            try
            {
                channel.QueueDeclare(deadLetterQueue, true, false, false, null);
                channel.QueueBind(deadLetterQueue, _deadLetterExchange, deadLetterQueue);
            }
            catch (Exception dlqEx)
            {
                _logger.LogWarning(dlqEx, "Error declaring dead-letter queue '{DeadLetterQueue}'.", deadLetterQueue);
                throw;
            }
        }

        // Check if main queue exists, if not create it
        try
        {
            channel.QueueDeclarePassive(queueName);
            _logger.LogInformation("Queue '{QueueName}' already exists.", queueName);
        }
        catch
        {
            _logger.LogInformation("Creating queue '{QueueName}' with DLX '{DeadLetterExchange}'.", queueName, _deadLetterExchange);
            try
            {
                var arguments = new Dictionary<string, object?>
                {
                    ["x-dead-letter-exchange"] = _deadLetterExchange,
                    ["x-dead-letter-routing-key"] = deadLetterQueue
                };
                channel.QueueDeclare(queueName, true, false, false, arguments);
                _logger.LogInformation("Queue '{QueueName}' created successfully.", queueName);
            }
            catch (Exception queueEx)
            {
                _logger.LogError(queueEx, "Error declaring queue '{QueueName}'.", queueName);
                throw;
            }
        }
    }

    private async void OnConnectionShutdown(object? sender, RabbitMQ.Client.ShutdownEventArgs args)
    {
        _logger.LogWarning("RabbitMQ connection shutdown detected: {Code} - {Text}.", args.ReplyCode, args.ReplyText);
        await EnsureInfrastructureAsync(CancellationToken.None);
    }

    private void DisposeChannel()
    {
        try
        {
            _publisherChannel?.Dispose();
            _publisherChannel = null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error disposing publisher channel.");
        }

        try
        {
            if (_connection != null)
            {
                _connection.ConnectionShutdown -= OnConnectionShutdown;
                _connection.Dispose();
                _connection = null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error disposing connection.");
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _sync.Dispose();
        DisposeChannel();
        await Task.CompletedTask;
    }
}
