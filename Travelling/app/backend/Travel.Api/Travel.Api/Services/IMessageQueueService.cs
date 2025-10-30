using Travel.Api.Models;

namespace Travel.Api.Services
{
    /// <summary>
    /// Interface for message queue operations
    /// </summary>
    public interface IMessageQueueService
    {
        /// <summary>
        /// Publish a message to the specified queue
        /// </summary>
        Task PublishMessageAsync(string queueName, object message);
        
        /// <summary>
        /// Publish a message to the booking queue
        /// </summary>
        Task PublishBookingMessageAsync(BookingMessage message);
        
        /// <summary>
        /// Publish a message to the admin queue
        /// </summary>
        Task PublishAdminNotificationAsync(AdminNotificationMessage message);
        
        /// <summary>
        /// Check if the connection is healthy
        /// </summary>
        bool IsConnected { get; }
    }
}