namespace Travel.Api.Models
{
    /// <summary>
    /// Configuration for RabbitMQ connection
    /// </summary>
    public class RabbitMqConfig
    {
        public required string HostName { get; set; }
        public int Port { get; set; } = 5672;
        public required string UserName { get; set; }
        public required string Password { get; set; }
        public string VirtualHost { get; set; } = "/";
        public required string BookingQueue { get; set; }
        public required string BookingDLQ { get; set; }
        public required string AdminQueue { get; set; }
        public required string AdminDLQ { get; set; }
        public int RetryAttempts { get; set; } = 3;
        public int RetryDelaySeconds { get; set; } = 5;
    }
}