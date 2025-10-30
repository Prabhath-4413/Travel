using RabbitMQ.Client;

namespace Travel.Api;

/// <summary>
/// Utility to manage RabbitMQ queues (purge old messages, etc.)
/// Run this as a one-time utility: dotnet run --queue-manager purge
/// </summary>
public class RabbitMqQueueManager
{
   public static async Task Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Usage: dotnet run <command>");
            Console.WriteLine("Commands:");
            Console.WriteLine("  purge-all       - Purge all queue messages");
            Console.WriteLine("  purge-booking   - Purge booking queue only");
            Console.WriteLine("  purge-email     - Purge email queue only");
            Console.WriteLine("  list-queues     - List all queues and message counts");
            return;
        }

        var factory = new ConnectionFactory
        {
            HostName = "localhost",
            Port = 5672,
            UserName = "guest",
            Password = "guest",
            VirtualHost = "/"
        };

        try
        {
            using var connection = factory.CreateConnection();
            using var channel = connection.CreateModel();

            string command = args[0].ToLower();

            switch (command)
            {
                case "purge-all":
                    await PurgeQueue(channel, "travel.bookings");
                    await PurgeQueue(channel, "travel.admin");
                    break;

                case "purge-booking":
                    await PurgeQueue(channel, "travel.bookings");
                    break;

                case "purge-email":
                    await PurgeQueue(channel, "travel.admin");
                    break;

                case "list-queues":
                    await ListQueues(channel);
                    break;

                default:
                    Console.WriteLine($"Unknown command: {command}");
                    break;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Environment.Exit(1);
        }
    }

    private static async Task PurgeQueue(IModel channel, string queueName)
    {
        try
        {
            var declareOk = channel.QueueDeclarePassive(queueName);
            uint messageCount = declareOk.MessageCount;
            
            if (messageCount > 0)
            {
                channel.QueuePurge(queueName);
                Console.WriteLine($"✅ Purged {messageCount} messages from queue: {queueName}");
            }
            else
            {
                Console.WriteLine($"ℹ️  Queue '{queueName}' is already empty");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error purging queue '{queueName}': {ex.Message}");
        }
    }

    private static async Task ListQueues(IModel channel)
    {
        string[] queues = { "travel.bookings", "travel.admin", "travel.bookings.dlq", "travel.admin.dlq" };

        Console.WriteLine("\n📊 RabbitMQ Queue Status:\n");

        foreach (var queueName in queues)
        {
            try
            {
                var declareOk = channel.QueueDeclarePassive(queueName);
                Console.WriteLine($"  Queue: {queueName}");
                Console.WriteLine($"    Messages: {declareOk.MessageCount}");
                Console.WriteLine($"    Consumers: {declareOk.ConsumerCount}\n");
            }
            catch
            {
                Console.WriteLine($"  Queue: {queueName} - NOT FOUND\n");
            }
        }
    }
}