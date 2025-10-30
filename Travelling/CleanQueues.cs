using RabbitMQ.Client;

class Program
{
    static void Main(string[] args)
    {
        var factory = new ConnectionFactory
        {
            HostName = "localhost",
            Port = 5672,
            UserName = "guest",
            Password = "guest",
            VirtualHost = "/"
        };

        using var connection = factory.CreateConnection();
        using var channel = connection.CreateModel();

        Console.WriteLine("🧹 Cleaning RabbitMQ Queues...\n");

        PurgeQueue(channel, "travel.bookings");
        PurgeQueue(channel, "travel.admin");

        Console.WriteLine("\n✅ Queue cleanup complete!");
    }

    static void PurgeQueue(IModel channel, string queueName)
    {
        try
        {
            var declareOk = channel.QueueDeclarePassive(queueName);
            if (declareOk.MessageCount > 0)
            {
                channel.QueuePurge(queueName);
                Console.WriteLine($"  ✅ Purged {declareOk.MessageCount} messages from: {queueName}");
            }
            else
            {
                Console.WriteLine($"  ℹ️  Queue '{queueName}' is empty");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  ❌ Error with '{queueName}': {ex.Message}");
        }
    }
}